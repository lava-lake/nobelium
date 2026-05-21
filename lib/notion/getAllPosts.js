import BLOG from '@/blog.config'
import { NotionAPI } from 'notion-client'
import { idToUuid } from 'notion-utils'
import getAllPageIds from './getAllPageIds'
import getPageProperties from './getPageProperties'
import filterPublishedPosts from './filterPublishedPosts'

/**
 * Notion API now wraps record values as { value: DATA, role: ROLE }.
 * Extract the actual data regardless of old/new format.
 */
function unwrap (val) {
  return val && typeof val === 'object' && 'role' in val ? val.value : val
}

/**
 * @param {{ includePages: boolean }} - false: posts only / true: include pages
 */
export async function getAllPosts ({ includePages = false }) {
  let id = BLOG.notionPageId
  const authToken = BLOG.notionAccessToken || null
  const api = new NotionAPI({ authToken })
  const response = await api.getPage(id)

  id = idToUuid(id)
  const collection = unwrap(Object.values(response.collection)[0]?.value)
  const block = response.block
  const schema = collection?.schema

  const rawMetadata = unwrap(block[id]?.value)

  // Check Type
  if (
    rawMetadata?.type !== 'collection_view_page' &&
    rawMetadata?.type !== 'collection_view'
  ) {
    console.log(`pageId "${id}" is not a database`)
    return null
  }

  // Get page IDs — try collection_query first, fallback to queryCollection API
  let pageIds = []
  const collectionQuery = response.collection_query

  if (collectionQuery && Object.keys(collectionQuery).length > 0) {
    pageIds = getAllPageIds(collectionQuery)
  }

  if (!pageIds.length) {
    // collection_query is empty in newer Notion API — call queryCollection directly
    const collectionId = rawMetadata?.collection_id
    const collectionViewId = rawMetadata?.view_ids?.[0]
    if (collectionId && collectionViewId) {
      try {
        const resp = await fetch('https://www.notion.so/api/v3/queryCollection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collection: { id: collectionId },
            collectionView: { id: collectionViewId },
            loader: {
              type: 'reducer',
              reducers: {
                collection_group_results: { type: 'results', limit: 9999 }
              },
              searchQuery: '',
              userTimeZone: 'Asia/Hong_Kong'
            }
          })
        })
        const queryData = await resp.json()
        // Merge returned blocks into block map
        if (queryData.recordMap?.block) {
          Object.assign(block, queryData.recordMap.block)
        }
        pageIds = queryData.result?.reducerResults?.collection_group_results?.blockIds || []
        // Deduplicate — Notion queryCollection can return the same blockId multiple times
        pageIds = [...new Set(pageIds)]
        console.log(`queryCollection: fetched ${pageIds.length} pages`)
      } catch (e) {
        console.error('queryCollection failed:', e.message)
      }
    }
  }

  // Construct Data
  const data = []
  for (let i = 0; i < pageIds.length; i++) {
    const id = pageIds[i]
    const properties = (await getPageProperties(id, block, schema)) || null
    if (!properties) continue

    // Add fullwidth, createdtime to properties
    const blockValue = unwrap(block[id]?.value)
    properties.createdTime = new Date(
      blockValue?.created_time
    ).toString()
    properties.fullWidth = blockValue?.format?.page_full_width ?? false

    data.push(properties)
  }

  // remove all the the items doesn't meet requirements
  const posts = filterPublishedPosts({ posts: data, includePages })

  // Sort by date
  if (BLOG.sortByDate) {
    posts.sort((a, b) => {
      const dateA = new Date(a?.date?.start_date || a.createdTime)
      const dateB = new Date(b?.date?.start_date || b.createdTime)
      return dateB - dateA
    })
  }

  // Deduplicate by slug — keep the first (newest after sort) when multiple pages share a slug
  const seen = new Set()
  const uniquePosts = []
  for (const post of posts) {
    if (!post.slug || seen.has(post.slug)) continue
    seen.add(post.slug)
    uniquePosts.push(post)
  }
  return uniquePosts
}

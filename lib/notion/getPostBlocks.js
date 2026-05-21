import BLOG from '@/blog.config'
import { NotionAPI } from 'notion-client'

/**
 * Notion API returns records as { spaceId, value: { value: DATA, role } }.
 * react-notion-x expects map[id].value = DATA.
 * Unwrap so entry.value points directly to the block/collection data.
 */
function unwrapRecordMap (recordMap) {
  const mapKeys = ['block', 'collection', 'collection_view', 'notion_user', 'signed_urls']
  for (const key of mapKeys) {
    const map = recordMap[key]
    if (!map || typeof map !== 'object') continue
    for (const [id, entry] of Object.entries(map)) {
      if (!entry || typeof entry !== 'object') continue
      const val = entry.value
      if (val && typeof val === 'object' && 'role' in val && 'value' in val) {
        // { spaceId, value: { value: DATA, role } } → { spaceId, value: DATA }
        entry.value = val.value
      }
    }
  }
  return recordMap
}

async function fetchWithRetry (api, id, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await api.getPage(id)
    } catch (err) {
      if (err.message?.includes('429') || err.statusCode === 429) {
        const delay = Math.pow(2, attempt + 1) * 1000 // 2s, 4s, 8s
        console.warn(`Rate limited fetching ${id}, retry in ${delay}ms...`)
        await new Promise(r => setTimeout(r, delay))
      } else {
        throw err
      }
    }
  }
  // Last attempt without catch
  return await api.getPage(id)
}

export async function getPostBlocks (id) {
  const authToken = BLOG.notionAccessToken || null
  const api = new NotionAPI({ authToken })
  const pageBlock = await fetchWithRetry(api, id)
  return unwrapRecordMap(pageBlock)
}

import BLOG from '@/blog.config'
import { NotionAPI } from 'notion-client'

/**
 * Notion API now wraps record values as { value: DATA, role: ROLE }.
 * Unwrap all records in a recordMap so react-notion-x gets clean data.
 */
function unwrapRecordMap (recordMap) {
  const mapKeys = ['block', 'collection', 'collection_view', 'notion_user', 'signed_urls']
  for (const key of mapKeys) {
    const map = recordMap[key]
    if (!map || typeof map !== 'object') continue
    for (const [id, entry] of Object.entries(map)) {
      if (entry && typeof entry === 'object' && 'role' in entry && 'value' in entry) {
        // Already wrapped — unwrap: { value: DATA, role: ROLE } → { value: DATA }
        // Keep the wrapper structure (react-notion-x expects map[id].value)
        // but ensure .value is the actual block data, not another wrapper
        const inner = entry.value
        if (inner && typeof inner === 'object' && 'role' in inner && 'value' in inner) {
          // Double-wrapped edge case
          map[id] = { value: inner.value, role: entry.role }
        }
        // else: single wrap is fine, react-notion-x reads map[id].value which is DATA
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

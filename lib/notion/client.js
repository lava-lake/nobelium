import { NotionAPI } from 'notion-client'

/**
 * notion.so is behind Cloudflare, which returns 403 for API requests
 * that carry no User-Agent header. notion-client@4 sends its requests
 * with `got`, which sets no User-Agent by default — so without this
 * header every Notion API call fails with "403 Forbidden".
 * Pass these options to every notion-client call.
 */
export const NOTION_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
}

export const NOTION_GOT_OPTIONS = { headers: NOTION_HEADERS }

export function createNotionAPI (authToken) {
  return new NotionAPI({ authToken })
}

import { getAllPosts } from '@/lib/notion'
import { generateRss } from '@/lib/rss'
export async function getServerSideProps ({ res }) {
  res.setHeader('Content-Type', 'text/xml')
  // Cache at the edge so feed polls don't each invoke the function
  // and re-fetch the whole Notion collection
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600')
  const posts = await getAllPosts({ includePages: false })
  const latestPosts = posts.slice(0, 10)
  const xmlFeed = generateRss(latestPosts)
  res.write(xmlFeed)
  res.end()
  return {
    props: {}
  }
}
const feed = () => null
export default feed

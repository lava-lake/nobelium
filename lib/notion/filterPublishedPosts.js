// import BLOG from '@/blog.config'
const current = new Date()
const tomorrow = new Date(current)
tomorrow.setDate(tomorrow.getDate() + 1)
tomorrow.setHours(0, 0, 0, 0)

export default function filterPublishedPosts ({ posts, includePages }) {
  if (!posts || !posts.length) return []
  const publishedPosts = posts
    .filter(post => {
      const type = post?.type?.[0]?.toLowerCase() || ''
      if (includePages) {
        return type === 'post' || type === 'page'
      }
      // Accept any type that isn't explicitly "Page" — treats all content as posts
      return type !== 'page'
    })
    .filter(post => {
      const status = (post?.status?.[0] || '').toLowerCase()
      const postDate = new Date(
        post?.date?.start_date || post.createdTime
      )
      return (
        post.title &&
        post.slug &&
        status === 'published' &&
        postDate < tomorrow
      )
    })
  return publishedPosts
}

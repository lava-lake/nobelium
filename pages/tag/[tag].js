import { getAllPosts, getAllTagsFromPosts } from '@/lib/notion'
import SearchLayout from '@/layouts/search'

export default function Tag ({ tags, posts, currentTag }) {
  return <SearchLayout tags={tags} posts={posts} currentTag={currentTag} />
}

export async function getStaticProps ({ params }) {
  const currentTag = params.tag
  const posts = await getAllPosts({ includePages: false })
  const tags = getAllTagsFromPosts(posts)
  // Unknown tag: 404 instead of generating a real (empty) page —
  // otherwise any junk /tag/<word> costs an ISR write
  if (!(currentTag in tags)) {
    return { notFound: true, revalidate: 86400 }
  }
  const filteredPosts = posts.filter(
    post => post && post.tags && post.tags.includes(currentTag)
  )
  return {
    props: {
      tags,
      posts: filteredPosts,
      currentTag
    },
    revalidate: 604800
  }
}

export async function getStaticPaths () {
  return {
    paths: [],
    fallback: 'blocking'
  }
}

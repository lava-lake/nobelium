import Layout from '@/layouts/layout'
import { getAllPosts, getPostBlocks } from '@/lib/notion'
import BLOG from '@/blog.config'
import { createHash } from 'crypto'

const BlogPost = ({ post, blockMap, emailHash }) => {
  if (!post) return null
  return (
    <Layout
      blockMap={blockMap}
      frontMatter={post}
      emailHash={emailHash}
      fullWidth={post.fullWidth}
    />
  )
}

export async function getStaticPaths () {
  // Don't prerender all 900+ pages at build time — generates them on-demand
  return {
    paths: [],
    fallback: 'blocking'
  }
}

export async function getStaticProps ({ params: { slug } }) {
  const posts = await getAllPosts({ includePages: true })
  const post = posts.find(t => t.slug === slug)

  if (!post) {
    return { notFound: true }
  }

  const blockMap = await getPostBlocks(post.id)
  const emailHash = createHash('md5')
    .update(BLOG.email)
    .digest('hex')
    .trim()
    .toLowerCase()

  return {
    props: { post, blockMap, emailHash },
    revalidate: 86400
  }
}

export default BlogPost

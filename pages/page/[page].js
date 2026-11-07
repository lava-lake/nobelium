import Container from '@/components/Container'
import BlogPost from '@/components/BlogPost'
import Pagination from '@/components/Pagination'
import { getAllPosts } from '@/lib/notion'
import BLOG from '@/blog.config'

const Page = ({ postsToShow, page, showNext }) => {
  return (
    <Container>
      {postsToShow &&
        postsToShow.map(post => <BlogPost key={post.id} post={post} />)}
      <Pagination page={page} showNext={showNext} />
    </Container>
  )
}

export async function getStaticProps (context) {
  const { page } = context.params // Get Current Page No.
  const posts = await getAllPosts({ includePages: false })
  const totalPosts = posts.length
  const pageNum = Number(page)
  const totalPages = Math.max(1, Math.ceil(totalPosts / BLOG.postsPerPage))
  // Out-of-range page: 404 instead of generating an empty page —
  // otherwise any /page/<number> costs an ISR write
  if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > totalPages) {
    return { notFound: true, revalidate: 86400 }
  }
  const postsToShow = posts.slice(
    BLOG.postsPerPage * (pageNum - 1),
    BLOG.postsPerPage * pageNum
  )
  const showNext = pageNum * BLOG.postsPerPage < totalPosts
  return {
    props: {
      page, // Current Page
      postsToShow,
      showNext
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

export default Page

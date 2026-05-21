import { idToUuid } from 'notion-utils'
export default function getAllPageIds (collectionQuery, viewId) {
  if (!collectionQuery || Object.keys(collectionQuery).length === 0) {
    return []
  }
  const views = Object.values(collectionQuery)[0]
  let pageIds = []
  if (viewId) {
    const vId = idToUuid(viewId)
    pageIds = views[vId]?.collection_group_results?.blockIds || views[vId]?.blockIds || []
  } else {
    const pageSet = new Set()
    Object.values(views).forEach(view => {
      const ids = view?.collection_group_results?.blockIds || view?.blockIds || []
      ids.forEach(id => pageSet.add(id))
    })
    pageIds = [...pageSet]
  }
  return pageIds
}

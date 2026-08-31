const ARTICLE_IMAGE_MODEL_CACHE_SIZE = 6
const EMPTY_ATTACHMENT_ITEMS = []
const articleImageModelCache = []

const normalizeImageSource = (source) => (typeof source === "string" ? source.trim() : "")

const extractImageSources = (htmlString) => {
  const content = typeof htmlString === "string" ? htmlString : ""
  const doc = new DOMParser().parseFromString(content, "text/html")

  return [...doc.querySelectorAll("img")]
    .map((img) => normalizeImageSource(img.getAttribute("src")))
    .filter(Boolean)
}

const createArticleImageModel = (htmlString, attachmentItems) => {
  const imageSources = [...new Set(extractImageSources(htmlString))]
  const imageIndexBySource = new Map(imageSources.map((source, index) => [source, index]))

  const visibleAttachments = attachmentItems.flatMap((item) => {
    if (!item.canPreview) {
      return [item]
    }

    const source = normalizeImageSource(item.url)
    if (!source) {
      return [{ ...item, canPreview: false }]
    }
    if (imageIndexBySource.has(source)) {
      return []
    }

    const galleryIndex = imageSources.length
    imageSources.push(source)
    imageIndexBySource.set(source, galleryIndex)
    return [{ ...item, galleryIndex }]
  })

  return {
    getImageIndex: (source) => imageIndexBySource.get(normalizeImageSource(source)) ?? -1,
    imageSources,
    visibleAttachments,
  }
}

const buildArticleImageModel = (htmlString, attachmentItems = EMPTY_ATTACHMENT_ITEMS) => {
  const cacheIndex = articleImageModelCache.findIndex(
    (entry) => entry.htmlString === htmlString && entry.attachmentItems === attachmentItems,
  )
  if (cacheIndex !== -1) {
    const [cachedEntry] = articleImageModelCache.splice(cacheIndex, 1)
    articleImageModelCache.push(cachedEntry)
    return cachedEntry.model
  }

  const model = createArticleImageModel(htmlString, attachmentItems)
  articleImageModelCache.push({ attachmentItems, htmlString, model })
  if (articleImageModelCache.length > ARTICLE_IMAGE_MODEL_CACHE_SIZE) {
    articleImageModelCache.shift()
  }
  return model
}

export default buildArticleImageModel

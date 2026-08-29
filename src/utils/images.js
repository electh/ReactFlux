const normalizeImageSource = (source) => (typeof source === "string" ? source.trim() : "")

const extractImageSources = (htmlString) => {
  const content = typeof htmlString === "string" ? htmlString : ""
  const doc = new DOMParser().parseFromString(content, "text/html")

  return [...doc.querySelectorAll("img")]
    .map((img) => normalizeImageSource(img.getAttribute("src")))
    .filter(Boolean)
}

const buildArticleImageModel = (htmlString, attachmentItems = []) => {
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

export default buildArticleImageModel

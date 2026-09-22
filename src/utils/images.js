const ARTICLE_IMAGE_MODEL_CACHE_SIZE = 6
const EMPTY_ATTACHMENT_ITEMS = []
const articleImageModelCache = []

const MAX_SRCSET_CANDIDATES = 64
const SRCSET_DESCRIPTOR_PATTERNS = {
  w: /^\d+$/,
  x: /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i,
}
const SRCSET_WHITESPACE_PATTERN = /[ \t\n\f\r]/

const normalizeImageSource = (source) => (typeof source === "string" ? source.trim() : "")

const isSrcSetWhitespace = (character) => SRCSET_WHITESPACE_PATTERN.test(character)

const parseSrcSetDescriptor = (descriptor) => {
  if (!descriptor) {
    return { type: "x", value: 1 }
  }

  const type = descriptor.at(-1)?.toLowerCase()
  const rawValue = descriptor.slice(0, -1)
  const valuePattern = SRCSET_DESCRIPTOR_PATTERNS[type]
  if (!valuePattern?.test(rawValue)) {
    return null
  }

  const value = Number(rawValue)
  return Number.isFinite(value) && value > 0 ? { type, value } : null
}

const parseSrcSetCandidates = (srcSet) => {
  const candidates = []
  let position = 0

  while (position < srcSet.length && candidates.length < MAX_SRCSET_CANDIDATES) {
    while (
      position < srcSet.length &&
      (isSrcSetWhitespace(srcSet[position]) || srcSet[position] === ",")
    ) {
      position += 1
    }
    if (position >= srcSet.length) {
      break
    }

    const sourceStart = position
    while (position < srcSet.length && !isSrcSetWhitespace(srcSet[position])) {
      position += 1
    }

    const sourceToken = srcSet.slice(sourceStart, position)
    let sourceEnd = sourceToken.length
    while (sourceEnd > 0 && sourceToken.at(sourceEnd - 1) === ",") {
      sourceEnd -= 1
    }
    const source = sourceToken.slice(0, sourceEnd)
    if (!source) {
      continue
    }

    if (source !== sourceToken) {
      candidates.push({ descriptor: { type: "x", value: 1 }, source })
      continue
    }

    while (position < srcSet.length && isSrcSetWhitespace(srcSet[position])) {
      position += 1
    }

    const descriptorStart = position
    let parenthesisDepth = 0
    while (position < srcSet.length) {
      const character = srcSet[position]
      if (character === "(") {
        parenthesisDepth += 1
      } else if (character === ")" && parenthesisDepth > 0) {
        parenthesisDepth -= 1
      } else if (character === "," && parenthesisDepth === 0) {
        break
      }
      position += 1
    }

    const descriptorText = srcSet.slice(descriptorStart, position).trim()
    if (position < srcSet.length) {
      position += 1
    }
    if (SRCSET_WHITESPACE_PATTERN.test(descriptorText)) {
      continue
    }

    const descriptor = parseSrcSetDescriptor(descriptorText)
    if (descriptor) {
      candidates.push({ descriptor, source })
    }
  }

  return candidates
}

const parseImageDimension = (value) => {
  const normalizedValue = typeof value === "string" ? value.trim() : ""
  if (!/^\d+(?:\.\d+)?$/.test(normalizedValue)) {
    return null
  }

  const dimension = Number(normalizedValue)
  return Number.isFinite(dimension) && dimension > 0 ? dimension : null
}

const extractResponsiveImageSources = (image) => {
  const rawSrcSet = image.getAttribute("srcset")
  // Use HTML dimensions only to infer candidate aspect ratios, not intrinsic pixel widths.
  const width = parseImageDimension(image.getAttribute("width"))
  const height = parseImageDimension(image.getAttribute("height"))
  if (!rawSrcSet || !width || !height) {
    return
  }

  const candidates = parseSrcSetCandidates(rawSrcSet)
  // Density descriptors do not provide the intrinsic pixel dimensions required by the lightbox.
  if (candidates.length === 0 || candidates.some(({ descriptor }) => descriptor.type !== "w")) {
    return
  }

  const sourcesByWidth = new Map()
  for (const { descriptor, source } of candidates) {
    const candidateWidth = descriptor.value
    const candidateHeight = Math.round((height / width) * candidateWidth)
    if (
      !Number.isFinite(candidateHeight) ||
      candidateHeight <= 0 ||
      sourcesByWidth.has(candidateWidth)
    ) {
      continue
    }

    sourcesByWidth.set(candidateWidth, {
      height: candidateHeight,
      src: source,
      width: candidateWidth,
    })
  }

  if (sourcesByWidth.size === 0) {
    return
  }

  return [...sourcesByWidth.values()].toSorted((left, right) => left.width - right.width)
}

const extractImageSlides = (htmlString) => {
  const content = typeof htmlString === "string" ? htmlString : ""
  const doc = new DOMParser().parseFromString(content, "text/html")

  return [...doc.querySelectorAll("img")].flatMap((image) => {
    const src = normalizeImageSource(image.getAttribute("src"))
    if (!src) {
      return []
    }

    const srcSet = extractResponsiveImageSources(image)
    return [{ src, ...(srcSet ? { srcSet } : {}) }]
  })
}

const createArticleImageModel = (htmlString, attachmentItems) => {
  const imageIndexBySource = new Map()
  const imageSlides = []

  for (const slide of extractImageSlides(htmlString)) {
    if (imageIndexBySource.has(slide.src)) {
      continue
    }

    const galleryIndex = imageSlides.length
    imageSlides.push(slide)
    imageIndexBySource.set(slide.src, galleryIndex)
    for (const candidate of slide.srcSet ?? []) {
      const candidateSource = normalizeImageSource(candidate.src)
      if (candidateSource && !imageIndexBySource.has(candidateSource)) {
        imageIndexBySource.set(candidateSource, galleryIndex)
      }
    }
  }

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

    const galleryIndex = imageSlides.length
    imageSlides.push({ src: source })
    imageIndexBySource.set(source, galleryIndex)
    return [{ ...item, galleryIndex }]
  })

  return {
    getImageIndex: (source) => imageIndexBySource.get(normalizeImageSource(source)) ?? -1,
    imageSlides,
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

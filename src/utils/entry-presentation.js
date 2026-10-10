import { extractHeadingsFromDocument } from "@/utils/dom"

// Keep this allowlist aligned with Miniflux's reader/sanitizer/url.go.
const ALLOWED_URI_SCHEMES = new Set([
  "https",
  "http",
  "apt",
  "bitcoin",
  "callto",
  "dav",
  "davs",
  "ed2k",
  "facetime",
  "feed",
  "ftp",
  "geo",
  "git",
  "gopher",
  "irc",
  "irc6",
  "ircs",
  "itms-apps",
  "itms",
  "magnet",
  "mailto",
  "news",
  "nntp",
  "rtmp",
  "sftp",
  "sip",
  "sips",
  "shortcuts",
  "skype",
  "spotify",
  "ssh",
  "steam",
  "svn",
  "svn+ssh",
  "tel",
  "webcal",
  "xmpp",
  "opener",
  "hack",
])

const BROWSER_URI_SCHEMES = new Set(["http", "https", "ftp"])
const EMBEDDABLE_URI_SCHEMES = new Set(["http", "https"])
const IMAGE_FILE_EXTENSION = /\.(?:avif|gif|jpe?g|png|webp)$/i
const FILE_SIZE_UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"]
const MAX_COVER_CANDIDATES = 12
const MAX_PREVIEW_LENGTH = 320
const MIN_ELIGIBLE_PREVIEW_LENGTH = 45
const IDEAL_SUBSTANTIVE_PREVIEW_LENGTH = 80
const DECORATIVE_IMAGE_PATTERN =
  /(?:^|[\W_])(?:logo|favicon|avatar|author|profile|social|share|icon|sprite|badge|ad|ads|advert|advertisement|sponsor|tracking|tracker|pixel|beacon|spacer|blank|analytics)(?:$|[\W_])/i
const DECORATIVE_CONTEXT_PATTERN =
  /(?:^|[\W_])(?:logo|favicon|avatar|author|byline|profile|portrait|social|share|comment|related|newsletter|ad|ads|advert|advertisement|sponsor|badge|sprite|track|tracker|analytics)(?:$|[\W_])/i
const PREVIEW_BOILERPLATE_PATTERN =
  /(?:\b(?:\d+\s+)?comments?\b|\b(?:\d+\s+)?comentarios?\b|\bshare (?:this|the) (?:article|story)\b|\bcompartilh(?:ar|e)\b|\bread more\b|\bleia mais\b|\bcontinue reading\b|\bcontinue lendo\b|\bsubscribe (?:to|for) (?:our )?(?:newsletter|updates)\b|\bassine\b|\bnewsletter\b|\bnewsletter signup\b|\b(?:materias|noticias)\s+relacionadas\b|^\s*related (?:stories|articles|posts)\b|\b(?:publicidade|anuncio)\b|^\s*advertisement\s*$|\bphoto\s*(?:credit|:)|\bfoto\s*[:/]|\bimage\s*credit\b|\bcreditos?(?:\s+da\s+imagem)?\s*:|\bimagem\s*:|\bdivulgacao\b|\bgetty images\b|\b(?:all rights reserved|direitos reservados)\b|\bcopyright\b|©)/i
const PREVIEW_CONTEXT_PATTERN =
  /(?:^|[\W_])(?:caption|credit|byline|author|social|shares?|comments?|comment[-_]?count|related|newsletter|subscriptions?|subscribe|ads?|advert|advertisement|sponsor|hidden)(?:$|[\W_])/i
const EXCLUDED_PREVIEW_SELECTOR =
  "script, style, noscript, nav, footer, aside, figcaption, form, button, [hidden], [inert], [aria-hidden='true']"
const SEMANTIC_TEXT_BLOCK_SELECTOR = "article, main, section, div, li, blockquote, p"
const DOCUMENT_BLOCK_SELECTOR =
  "address, article, blockquote, dd, div, dl, dt, fieldset, figcaption, h1, h2, h3, h4, h5, h6, li, main, ol, p, pre, section, table, td, th, tr, ul"

const getUriScheme = (url) => {
  const match = /^([a-z][a-z\d+.-]*):/i.exec(url)
  return match?.[1].toLowerCase() ?? ""
}

const getPathname = (url) => {
  try {
    return new URL(url).pathname
  } catch {
    return url.split(/[?#]/, 1)[0]
  }
}

const decodeUrlSegment = (segment) => {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

const getDisplayName = (url, scheme) => {
  try {
    const parsedUrl = new URL(url)
    if (scheme === "magnet") {
      return parsedUrl.searchParams.get("dn")?.trim() ?? ""
    }

    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean)
    return decodeUrlSegment(pathSegments.at(-1) ?? "").trim()
  } catch {
    return ""
  }
}

const formatFileSize = (size) => {
  const bytes = Number(size)
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return ""
  }

  if (bytes < 1024) {
    return `${Math.floor(bytes)} B`
  }

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    FILE_SIZE_UNITS.length - 1,
  )
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(1)} ${FILE_SIZE_UNITS[exponent]}`
}

const getAttachmentKind = (mimeType, url) => {
  const normalizedMimeType = mimeType.toLowerCase()
  if (normalizedMimeType.startsWith("audio/")) {
    return "audio"
  }
  if (normalizedMimeType.startsWith("video/")) {
    return "video"
  }
  if (normalizedMimeType.startsWith("image/") || IMAGE_FILE_EXTENSION.test(getPathname(url))) {
    return "image"
  }
  return "file"
}

const getLinkMode = (scheme) => {
  if (!ALLOWED_URI_SCHEMES.has(scheme)) {
    return "blocked"
  }
  return BROWSER_URI_SCHEMES.has(scheme) ? "browser" : "handler"
}

const normalizeEnclosure = (enclosure) => {
  if (!enclosure || typeof enclosure !== "object") {
    return null
  }

  const url = typeof enclosure.url === "string" ? enclosure.url.trim() : ""
  if (!url) {
    return null
  }

  const mimeType = typeof enclosure.mime_type === "string" ? enclosure.mime_type.trim() : ""
  const scheme = getUriScheme(url)
  const kind = getAttachmentKind(mimeType, url)
  const isEmbeddable = EMBEDDABLE_URI_SCHEMES.has(scheme)

  return {
    ...enclosure,
    url,
    mime_type: mimeType,
    kind,
    scheme,
    linkMode: getLinkMode(scheme),
    displayName: getDisplayName(url, scheme),
    formattedSize: formatFileSize(enclosure.size),
    canPlay: isEmbeddable && (kind === "audio" || kind === "video"),
    canPreview: isEmbeddable && kind === "image",
  }
}

const buildAttachmentModel = (enclosures) => {
  const items = enclosures.map((enclosure) => normalizeEnclosure(enclosure)).filter(Boolean)

  let imageIndex = 0
  const indexedItems = items.map((item) => {
    if (!item.canPreview) {
      return item
    }

    const indexedItem = { ...item, imageIndex }
    imageIndex += 1
    return indexedItem
  })

  return {
    items: indexedItems,
    primaryMedia: indexedItems.find((item) => item.canPlay) ?? null,
    images: indexedItems.filter((item) => item.canPreview),
  }
}

const getWeiboFirstImage = (doc) =>
  [...doc.querySelectorAll("img")].find(
    (img) =>
      !img.closest("a") && !(img.hasAttribute("alt") && /\[.+]/.test(img.getAttribute("alt"))),
  ) ?? null

const getPositiveDimension = (element, attribute) => {
  const value = Number.parseFloat(element?.getAttribute(attribute) ?? "")
  return Number.isFinite(value) && value > 0 ? value : null
}

const isSafeImageSource = (value) => {
  const source = typeof value === "string" ? value.trim() : ""
  if (
    !source ||
    /^(?:data|blob|javascript|file|vbscript):/i.test(source) ||
    source.startsWith("#")
  ) {
    return false
  }

  const scheme = getUriScheme(source)
  return !scheme || scheme === "http" || scheme === "https"
}

const parseSrcset = (srcset) => {
  if (typeof srcset !== "string" || !srcset.trim()) {
    return []
  }

  return srcset
    .split(",")
    .map((candidate) => {
      const [source, descriptor = ""] = candidate.trim().split(/\s+/)
      const widthMatch = /^(\d+)w$/.exec(descriptor)
      const densityMatch = /^(\d+(?:\.\d+)?)x$/.exec(descriptor)
      return {
        source,
        resolutionHint: widthMatch ? Number(widthMatch[1]) : null,
        density: densityMatch ? Number(densityMatch[1]) : null,
      }
    })
    .filter(({ source }) => isSafeImageSource(source))
    .toSorted(
      (left, right) =>
        (right.resolutionHint ?? right.density ?? 0) - (left.resolutionHint ?? left.density ?? 0),
    )
}

const getElementTokens = (element) => {
  const tokens = []
  let current = element
  let depth = 0

  while (current && depth < 5) {
    const attributes = [current.id, current.getAttribute("class"), current.getAttribute("role")]
    tokens.push(...attributes.filter(Boolean))
    current = current.parentElement
    depth += 1
  }

  return tokens.join(" ").toLowerCase()
}

const isDecorativeContext = (element) => {
  let current = element
  let depth = 0

  while (current && depth < 5) {
    const tagName = current.tagName.toLowerCase()
    if (["nav", "aside", "footer"].includes(tagName)) {
      return true
    }

    const contextTokens = [current.id, current.getAttribute("class")].filter(Boolean).join(" ")
    if (DECORATIVE_CONTEXT_PATTERN.test(contextTokens)) {
      return true
    }

    current = current.parentElement
    depth += 1
  }

  return false
}

const getImageAspectRatio = (width, height) =>
  width && height && width > 0 && height > 0 ? width / height : null

const scoreImageCandidate = (candidate) => {
  const rejectionReasons = []
  const reasons = []
  const lowerTokens = `${candidate.src} ${candidate.alt} ${candidate.tokens}`.toLowerCase()
  const aspectRatio = getImageAspectRatio(candidate.width, candidate.height)
  const largestKnownDimension = Math.max(candidate.width ?? 0, candidate.height ?? 0)
  const resolutionHint = Math.max(candidate.resolutionHint ?? 0, largestKnownDimension)

  if (!isSafeImageSource(candidate.src)) {
    rejectionReasons.push("unsafe-or-data-uri")
  }
  if (candidate.decorativeContext) {
    rejectionReasons.push("decorative-container")
  }
  if (DECORATIVE_IMAGE_PATTERN.test(lowerTokens)) {
    rejectionReasons.push("decorative-image-token")
  }
  if (
    candidate.width &&
    candidate.height &&
    (largestKnownDimension < 64 || candidate.width * candidate.height < 4096)
  ) {
    rejectionReasons.push("below-minimum-dimensions")
  }
  if (resolutionHint > 0 && resolutionHint < 64) {
    rejectionReasons.push("below-minimum-resolution")
  }

  let score = candidate.kind === "video-poster" ? 36 : 30
  switch (candidate.kind) {
    case "figure-image": {
      score += 14
      reasons.push("figure")

      break
    }
    case "image-enclosure": {
      score += 8
      reasons.push("image-enclosure")

      break
    }
    case "picture-source": {
      score += 4
      reasons.push("picture-source")

      break
    }
    case "video-poster": {
      reasons.push("video-poster")

      break
    }
    default: {
      reasons.push("content-image")
    }
  }

  if (resolutionHint >= 1400) {
    score += 18
    reasons.push("high-resolution")
  } else if (resolutionHint >= 900) {
    score += 14
    reasons.push("good-resolution")
  } else if (resolutionHint >= 500) {
    score += 9
    reasons.push("usable-resolution")
  } else if (resolutionHint >= 240) {
    score += 4
    reasons.push("small-resolution-hint")
  }

  if (aspectRatio !== null) {
    if (aspectRatio >= 1.15 && aspectRatio <= 2.25) {
      score += 10
      reasons.push("editorial-aspect-ratio")
    } else if (aspectRatio >= 0.45 && aspectRatio <= 3.2) {
      score += 3
      reasons.push("usable-aspect-ratio")
    } else {
      score -= 14
      reasons.push("extreme-aspect-ratio-penalty")
    }
  }

  if (candidate.alt && !DECORATIVE_IMAGE_PATTERN.test(candidate.alt)) {
    score += 5
    reasons.push("descriptive-alt")
  }
  if (/(?:hero|feature|editorial|cover|lead|main-image)/i.test(lowerTokens)) {
    score += 8
    reasons.push("editorial-image-hint")
  }
  if (candidate.position !== null && candidate.position < 3) {
    score += 2
    reasons.push("early-content-position")
  }
  if (/(?:^|[\W_])(?:thumb|thumbnail)(?:$|[\W_])/i.test(lowerTokens)) {
    score -= 6
    reasons.push("thumbnail-penalty")
  }
  if (candidate.isFeedPreferred) {
    score += 20
    reasons.push("feed-specific-primary-image")
  }

  if (aspectRatio !== null && (aspectRatio < 0.1 || aspectRatio > 10)) {
    rejectionReasons.push("unusable-aspect-ratio")
  }

  return {
    ...candidate,
    aspectRatio,
    score,
    reason: rejectionReasons.length > 0 ? rejectionReasons.join(",") : reasons.join(","),
    rejectionReasons,
  }
}

const createImageCandidate = ({
  alt = "",
  decorativeContext = false,
  height = null,
  isFeedPreferred = false,
  kind,
  position = null,
  resolutionHint = null,
  src,
  tokens = "",
  width = null,
}) =>
  scoreImageCandidate({
    alt: alt.trim(),
    decorativeContext,
    height,
    isFeedPreferred,
    kind,
    position,
    resolutionHint,
    src: src.trim(),
    tokens,
    width,
  })

const extractImageCandidates = (doc, attachments, preferredImageSource = "") => {
  const scoredCandidates = []
  const rejectedReasons = {}
  const seenSources = new Map()
  let position = 0

  const addCandidate = (candidate) => {
    const scored = createImageCandidate(candidate)
    if (scored.rejectionReasons.length > 0) {
      for (const reason of scored.rejectionReasons) {
        rejectedReasons[reason] = (rejectedReasons[reason] ?? 0) + 1
      }
      return
    }

    const existingIndex = seenSources.get(scored.src)
    if (existingIndex !== undefined) {
      if (scored.score > scoredCandidates[existingIndex].score) {
        scoredCandidates[existingIndex] = scored
      }
      return
    }

    seenSources.set(scored.src, scoredCandidates.length)
    scoredCandidates.push(scored)
  }

  for (const image of doc.querySelectorAll("img")) {
    const figure = image.closest("figure")
    const imageContext = {
      alt: image.getAttribute("alt") ?? "",
      decorativeContext: isDecorativeContext(image),
      height: getPositiveDimension(image, "height"),
      isFeedPreferred: (image.getAttribute("src") ?? "") === preferredImageSource,
      kind: figure ? "figure-image" : "content-image",
      position,
      tokens: getElementTokens(image),
      width: getPositiveDimension(image, "width"),
    }
    const pictureSources = image.closest("picture")?.querySelectorAll("source") ?? []
    const sourceCandidates = [...pictureSources].flatMap((source) =>
      parseSrcset(source.getAttribute("srcset")).map((candidate) => ({
        ...imageContext,
        kind: "picture-source",
        resolutionHint: candidate.resolutionHint,
        src: candidate.source,
        tokens: `${imageContext.tokens} ${source.getAttribute("class") ?? ""} ${source.getAttribute("id") ?? ""}`,
      })),
    )
    const imageCandidates = parseSrcset(image.getAttribute("srcset")).map((candidate) => ({
      ...imageContext,
      resolutionHint: candidate.resolutionHint,
      src: candidate.source,
    }))
    const sourceCandidatesOrdered = [...sourceCandidates, ...imageCandidates].toSorted(
      (left, right) => (right.resolutionHint ?? 0) - (left.resolutionHint ?? 0),
    )

    for (const candidate of sourceCandidatesOrdered) {
      addCandidate(candidate)
    }

    addCandidate({
      ...imageContext,
      resolutionHint: imageContext.width,
      src: image.getAttribute("src") ?? "",
    })
    position += 1
  }

  for (const video of doc.querySelectorAll("video[poster]")) {
    addCandidate({
      decorativeContext: isDecorativeContext(video),
      height: getPositiveDimension(video, "height"),
      kind: "video-poster",
      position,
      resolutionHint: getPositiveDimension(video, "width"),
      src: video.getAttribute("poster") ?? "",
      tokens: getElementTokens(video),
      width: getPositiveDimension(video, "width"),
    })
    position += 1
  }

  for (const enclosure of attachments.images) {
    addCandidate({
      decorativeContext: false,
      height: Number(enclosure.height) || null,
      kind: "image-enclosure",
      position,
      resolutionHint: Number(enclosure.width) || null,
      src: enclosure.url,
      tokens: `${enclosure.mime_type ?? ""} ${enclosure.title ?? ""} ${enclosure.filename ?? ""} ${enclosure.url}`,
      width: Number(enclosure.width) || null,
    })
    position += 1
  }

  const candidates = scoredCandidates
    .toSorted((left, right) => right.score - left.score || left.position - right.position)
    .slice(0, MAX_COVER_CANDIDATES)
    .map(({ decorativeContext, position: _position, rejectionReasons, tokens: _tokens, ...item }) =>
      // Keep only presentation metadata on each entry; large source HTML and DOM nodes stay out.
      ({ ...item, rejectionReasons }),
    )

  return {
    candidates,
    candidateCount: scoredCandidates.length,
    rejectedReasons,
    reason: candidates[0]?.reason ?? "no-eligible-image-candidate",
  }
}

const normalizeText = (text) => text.replaceAll(/[\s\u00A0]+/g, " ").trim()

const normalizeBoilerplateText = (text) =>
  normalizeText(text)
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()

const normalizeComparableText = (text) =>
  normalizeText(text)
    .toLocaleLowerCase()
    .replaceAll(/[\p{P}\p{S}]/gu, "")

const hasBoilerplateContext = (element) => {
  let current = element
  let depth = 0

  while (current && depth < 6) {
    const inlineStyle = current.getAttribute("style") ?? ""
    if (
      current.matches(EXCLUDED_PREVIEW_SELECTOR) ||
      current.matches("input[type='hidden']") ||
      /\b(?:display\s*:\s*none|visibility\s*:\s*hidden)\b/i.test(inlineStyle)
    ) {
      return true
    }

    const contextTokens = [current.id, current.getAttribute("class"), current.getAttribute("role")]
      .filter(Boolean)
      .join(" ")
    if (
      DECORATIVE_CONTEXT_PATTERN.test(contextTokens) ||
      PREVIEW_CONTEXT_PATTERN.test(contextTokens)
    ) {
      return true
    }

    current = current.parentElement
    depth += 1
  }

  return false
}

const getParagraphLinkDensity = (paragraph, textLength) => {
  if (textLength === 0) {
    return 1
  }

  const linkedTextLength = [...paragraph.querySelectorAll("a")].reduce(
    (length, link) => length + normalizeText(link.textContent ?? "").length,
    0,
  )
  return Math.min(1, linkedTextLength / textLength)
}

const truncateAtSentenceBoundary = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text
  }

  const sentence = text
    .slice(0, maxLength)
    .match(/^.{0,320}?[.!?](?:\s|$)/u)?.[0]
    ?.trim()
  if (sentence && sentence.length >= Math.min(MIN_ELIGIBLE_PREVIEW_LENGTH, maxLength * 0.55)) {
    return sentence
  }

  const prefix = text.slice(0, maxLength)
  const lastSpace = prefix.lastIndexOf(" ")
  return `${prefix.slice(0, lastSpace > 0 ? lastSpace : maxLength).trimEnd()}…`
}

const getTextCandidateScore = ({ index, linkDensity, text }) => {
  const wordCount = text.split(/\s+/).filter(Boolean).length
  const sentenceCount = (text.match(/[.!?](?:\s|$)/g) ?? []).length
  const reasons = ["substantive-paragraph"]
  let score = 40

  if (text.length >= 180) {
    score += 20
    reasons.push("developed-length")
  } else if (text.length >= 120) {
    score += 14
    reasons.push("useful-length")
  } else if (text.length >= IDEAL_SUBSTANTIVE_PREVIEW_LENGTH) {
    score += 8
    reasons.push("minimum-substantive-length")
  } else {
    score += 4
    reasons.push("short-editorial-lead")
  }

  if (wordCount >= 18) {
    score += 8
    reasons.push("sentence-like-text")
  }
  if (sentenceCount > 0) {
    score += 4
    reasons.push("complete-sentence")
  }
  if (linkDensity <= 0.1) {
    score += 14
    reasons.push("low-link-density")
  } else if (linkDensity <= 0.3) {
    score += 6
    reasons.push("moderate-link-density")
  } else {
    score -= Math.round(linkDensity * 24)
    reasons.push("link-density-penalty")
  }
  if (index < 4) {
    score += 4 - index
    reasons.push("early-article-position")
  }

  return { score, reasons }
}

const getNodeText = (node) => {
  if (!node.querySelector("br")) {
    return normalizeText(node.textContent ?? "")
  }

  const clone = node.cloneNode(true)
  for (const lineBreak of clone.querySelectorAll("br")) {
    lineBreak.replaceWith(clone.ownerDocument.createTextNode(" "))
  }
  return normalizeText(clone.textContent ?? "")
}

const isSentenceLikeLead = (text) =>
  text.split(/\s+/).filter(Boolean).length >= 6 && /[.!?][”’"')\]]?$/u.test(text)

const isEligiblePreviewText = (text) =>
  text.length >= MIN_ELIGIBLE_PREVIEW_LENGTH &&
  (text.length >= IDEAL_SUBSTANTIVE_PREVIEW_LENGTH || isSentenceLikeLead(text))

const isBoilerplateText = (text) =>
  PREVIEW_BOILERPLATE_PATTERN.test(normalizeBoilerplateText(text)) ||
  /^(?:by|written by|author|por|escrito por)\s+/i.test(text)

const createPreviewCandidate = ({ author, element, index, text, title }) => {
  const normalizedText = normalizeText(text)
  const comparableText = normalizeComparableText(normalizedText)
  if (
    !isEligiblePreviewText(normalizedText) ||
    isBoilerplateText(normalizedText) ||
    (title && comparableText === title) ||
    (author && comparableText === author) ||
    (element && hasBoilerplateContext(element))
  ) {
    return null
  }

  const linkDensity = element ? getParagraphLinkDensity(element, normalizedText.length) : 0
  if (linkDensity > 0.55) {
    return null
  }

  const score = getTextCandidateScore({ index, linkDensity, text: normalizedText })
  return { ...score, index, linkDensity, text: normalizedText }
}

const selectBestPreviewCandidate = (candidates) =>
  candidates.toSorted((left, right) => right.score - left.score || left.index - right.index)[0] ??
  null

const collectDocumentTextSegments = (root) => {
  const segments = []
  let text = ""
  let linkedTextLength = 0
  const flush = () => {
    const normalizedText = normalizeText(text)
    if (normalizedText) {
      segments.push({ linkedTextLength, text: normalizedText })
    }
    text = ""
    linkedTextLength = 0
  }
  const walker = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
  )

  while (walker.nextNode()) {
    const node = walker.currentNode
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase()
      if (tagName === "br") {
        flush()
      } else if (
        node !== root &&
        node.matches(DOCUMENT_BLOCK_SELECTOR) &&
        (text.trim() || linkedTextLength)
      ) {
        flush()
      }
      continue
    }

    const nodeText = node.nodeValue ?? ""
    text += nodeText
    if (node.parentElement?.closest("a")) {
      linkedTextLength += nodeText.length
    }
  }

  flush()
  return segments
}

const prepareDocumentFallback = (doc) => {
  const root = doc.body?.cloneNode(true) ?? doc.documentElement?.cloneNode(true)
  if (!root) {
    return []
  }

  for (const element of root.querySelectorAll("*")) {
    if (element.parentElement && hasBoilerplateContext(element)) {
      element.remove()
    }
  }
  for (const node of root.querySelectorAll(
    "img, video, audio, iframe, canvas, svg, picture, source",
  )) {
    node.remove()
  }
  for (const figure of root.querySelectorAll("figure")) {
    if (!normalizeText(figure.textContent ?? "")) {
      figure.remove()
    }
  }

  return collectDocumentTextSegments(root)
}

const extractSemanticPreview = (doc, entry) => {
  const title = normalizeComparableText(entry.title ?? "")
  const author = normalizeComparableText(entry.author ?? "")
  const paragraphCandidates = [...doc.querySelectorAll("p")]
    .map((paragraph, index) =>
      createPreviewCandidate({
        author,
        element: paragraph,
        index,
        text: getNodeText(paragraph),
        title,
      }),
    )
    .filter(Boolean)
  let selected = selectBestPreviewCandidate(paragraphCandidates)
  let previewSource = "paragraph"

  if (!selected) {
    const semanticBlocks = [...doc.querySelectorAll("article, main, section, div, li, blockquote")]
    const blockCandidates = semanticBlocks
      .map((block, index) => {
        const ownText = block.cloneNode(true)
        for (const child of ownText.querySelectorAll(SEMANTIC_TEXT_BLOCK_SELECTOR)) {
          child.remove()
        }
        return createPreviewCandidate({
          author,
          element: block,
          index,
          text: getNodeText(ownText),
          title,
        })
      })
      .filter(Boolean)
    selected = selectBestPreviewCandidate(blockCandidates)
    previewSource = "block"
  }

  if (!selected) {
    const fallbackCandidates = prepareDocumentFallback(doc)
      .map(({ linkedTextLength, text }, index) => {
        const candidate = createPreviewCandidate({ author, index, text, title })
        if (!candidate) {
          return null
        }
        const linkDensity = Math.min(1, linkedTextLength / text.length)
        if (linkDensity > 0.55) {
          return null
        }
        return {
          ...getTextCandidateScore({ index, linkDensity, text }),
          index,
          linkDensity,
          text,
        }
      })
      .filter(Boolean)
    selected = selectBestPreviewCandidate(fallbackCandidates)
    previewSource = "document-fallback"
  }

  if (!selected) {
    return {
      previewConfidence: 0,
      previewReason: "no-substantive-paragraph",
      previewSource: "none",
      previewText: "",
    }
  }

  return {
    previewConfidence: Number(Math.min(0.95, selected.score / 100).toFixed(2)),
    previewParagraphIndex: previewSource === "paragraph" ? selected.index : undefined,
    previewReason: selected.reasons.join("; "),
    previewSource,
    previewText: truncateAtSentenceBoundary(selected.text, MAX_PREVIEW_LENGTH),
  }
}

const prepareEntry = (entry) => {
  const content = typeof entry.content === "string" ? entry.content : ""
  const doc = new DOMParser().parseFromString(content, "text/html")
  const isWeiboFeed =
    entry.feed?.site_url && /https:\/\/weibo\.com\/\d+\//.test(entry.feed.site_url)
  const weiboImage = isWeiboFeed ? getWeiboFirstImage(doc) : null
  const embeddedMedia = doc.querySelector("video, audio, iframe")
  const enclosures = Array.isArray(entry.enclosures) ? entry.enclosures : []
  const attachments = buildAttachmentModel(enclosures)
  const imageSelection = extractImageCandidates(
    doc,
    attachments,
    weiboImage?.getAttribute("src") ?? "",
  )
  const cover = imageSelection.candidates[0] ?? null
  const preview = extractSemanticPreview(doc, entry)

  return {
    ...entry,
    content,
    enclosures,
    attachments,
    headings: extractHeadingsFromDocument(doc),
    coverCandidates: imageSelection.candidates,
    coverSource: cover?.src ?? null,
    coverWidth: cover?.width ?? null,
    coverHeight: cover?.height ?? null,
    coverReason: imageSelection.reason,
    coverCandidateCount: imageSelection.candidateCount,
    coverRejectedReasons: imageSelection.rejectedReasons,
    ...preview,
    isMedia: Boolean(attachments.primaryMedia || embeddedMedia),
  }
}

export { extractImageCandidates, extractSemanticPreview }
export default prepareEntry

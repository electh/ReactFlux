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
const IMAGE_FILE_EXTENSION = /\.(?:gif|jpe?g|png)$/i
const FILE_SIZE_UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"]

const getUriScheme = (url) => {
  const match = /^([a-z][a-z\d+.-]*):/i.exec(url)
  return match?.[1].toLowerCase() ?? ""
}

const getPathname = (url) => {
  try {
    return new URL(url).pathname
  } catch {
    return ""
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

const prepareEntry = (entry) => {
  const content = typeof entry.content === "string" ? entry.content : ""
  const doc = new DOMParser().parseFromString(content, "text/html")
  const isWeiboFeed =
    entry.feed?.site_url && /https:\/\/weibo\.com\/\d+\//.test(entry.feed.site_url)

  const firstImage = isWeiboFeed ? getWeiboFirstImage(doc) : doc.querySelector("img")
  const video = doc.querySelector("video")
  const embeddedMedia = video ?? doc.querySelector("audio, iframe")
  const enclosures = Array.isArray(entry.enclosures) ? entry.enclosures : []
  const attachments = buildAttachmentModel(enclosures)

  const coverSource = firstImage?.getAttribute("src") || video?.getAttribute("poster") || null

  return {
    ...entry,
    content,
    enclosures,
    attachments,
    coverSource,
    isMedia: Boolean(attachments.primaryMedia || embeddedMedia),
  }
}

export default prepareEntry

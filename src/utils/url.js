const SAFE_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"])

export const getSafeExternalUrl = (url) => {
  if (typeof url !== "string" || url.trim() === "") {
    return null
  }

  try {
    const parsedUrl = new URL(url)
    return SAFE_EXTERNAL_PROTOCOLS.has(parsedUrl.protocol) ? parsedUrl.href : null
  } catch {
    return null
  }
}

export const openExternalUrl = (url) => {
  const safeUrl = getSafeExternalUrl(url)
  if (!safeUrl) {
    return false
  }

  globalThis.open(safeUrl, "_blank", "noopener")
  return true
}

const getHostname = (url) => {
  const pattern = /^(?:http|https):\/\/((?!(\d+\.){3}\d+)([^/?#]+))/
  const match = url.match(pattern)
  if (match) {
    return match[1]
  }
  return null
}

export const getSecondHostname = (url) => {
  const hostname = getHostname(url)
  if (hostname) {
    const parts = hostname.split(".")
    if (parts.length >= 2) {
      return parts.slice(-2).join(".")
    }
  }
  return null
}

export const extractBasePath = (pathname) => {
  return pathname.replace(/\/entry\/\d+$/, "")
}

export const buildEntryDetailPath = (basePath, entryId) => {
  return `${basePath}/entry/${entryId}`
}

export const isEntryDetailPath = (pathname) => {
  return /\/entry\/\d+$/.test(pathname)
}

const extractEntryIdFromPath = (pathname) => {
  const match = pathname.match(/\/entry\/(\d+)$/)
  return match ? match[1] : null
}

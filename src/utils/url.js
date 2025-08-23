export const getHostname = (url) => {
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

export const extractEntryIdFromPath = (pathname) => {
  const match = pathname.match(/\/entry\/(\d+)$/)
  return match ? match[1] : null
}

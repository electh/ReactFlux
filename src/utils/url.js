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

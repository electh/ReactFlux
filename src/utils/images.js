export const extractImageSources = (htmlString) => {
  const doc = new DOMParser().parseFromString(htmlString, "text/html")
  const images = doc.querySelectorAll("img")
  return Array.from(images).map((img) => img.getAttribute("src"))
}

export const parseCoverImage = (entry) => {
  const doc = new DOMParser().parseFromString(entry.content, "text/html")
  const firstImage = doc.querySelector("img")
  let coverSource = firstImage?.getAttribute("src")
  let isVideo = false

  if (!coverSource) {
    const video = doc.querySelector("video")
    if (video) {
      coverSource = video.getAttribute("poster")
      isVideo = true
    } else if (entry.enclosures?.[0]) {
      const firstEnclosure = entry.enclosures[0]
      const isImage =
        firstEnclosure.mime_type.toLowerCase().startsWith("image/") ||
        /\.(jpg|jpeg|png|gif)$/i.test(firstEnclosure.url)
      if (isImage) {
        coverSource = firstEnclosure.url
      }
      // Youtube thumbnail
      isVideo = coverSource?.startsWith("https://i.ytimg.com") ?? false
    }
  }

  return { ...entry, coverSource, isVideo }
}

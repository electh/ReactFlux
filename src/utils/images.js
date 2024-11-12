export const extractImageSources = (htmlString) => {
  const doc = new DOMParser().parseFromString(htmlString, "text/html")
  const images = doc.querySelectorAll("img")
  return Array.from(images).map((img) => img.getAttribute("src"))
}

export const parseFirstImage = (entry) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(entry.content, "text/html")
  let imgSrc = doc.querySelector("img")?.getAttribute("src")
  let isVideo = false

  if (!imgSrc) {
    const video = doc.querySelector("video")
    if (video) {
      imgSrc = video.getAttribute("poster")
      isVideo = true
    } else if (entry.enclosures.length > 0) {
      if (entry.enclosures[0].mime_type.includes("image")) {
        imgSrc = entry.enclosures[0].url
      }
      // Youtube thumbnail
      if (imgSrc?.startsWith("https://i.ytimg.com")) {
        isVideo = true
      }
    }
  }
  return { ...entry, imgSrc, isVideo }
}

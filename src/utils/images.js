import { allowedIframeHostnames } from "@/utils/sanitizeHtml"

export const extractImageSources = (htmlString) => {
  const doc = new DOMParser().parseFromString(htmlString, "text/html")
  const images = doc.querySelectorAll("img")
  return Array.from(images).map((img) => img.getAttribute("src"))
}

export const parseCoverImage = (entry) => {
  const doc = new DOMParser().parseFromString(entry.content, "text/html")
  const firstImage = doc.querySelector("img")
  let coverSource = firstImage?.getAttribute("src")
  let isMedia = false
  let mediaPlayerEnclosure = null

  if (!coverSource) {
    const video = doc.querySelector("video")
    if (video) {
      coverSource = video.getAttribute("poster")
      isMedia = true
    } else {
      mediaPlayerEnclosure = entry.enclosures?.find(
        (enclosure) =>
          enclosure.url !== "" &&
          (enclosure.mime_type.startsWith("video/") || enclosure.mime_type.startsWith("audio/")),
      )
      if (mediaPlayerEnclosure) {
        isMedia = true
      }
      const imageEnclosure = entry.enclosures?.find(
        (enclosure) =>
          enclosure.mime_type.toLowerCase().startsWith("image/") ||
          /\.(jpg|jpeg|png|gif)$/i.test(enclosure.url),
      )
      if (imageEnclosure) {
        coverSource = imageEnclosure.url
      }
    }
    if (!isMedia) {
      const iframe = doc.querySelector("iframe")
      const iframeHost = iframe?.getAttribute("src")?.split("/")[2]
      if (iframeHost && allowedIframeHostnames.includes(iframeHost)) {
        isMedia = true
      }
    }
  }

  return { ...entry, coverSource, mediaPlayerEnclosure, isMedia }
}

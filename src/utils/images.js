export const extractImageSources = (htmlString) => {
  const doc = new DOMParser().parseFromString(htmlString, "text/html")
  const images = doc.querySelectorAll("img")
  return Array.from(images).map((img) => img.getAttribute("src"))
}

const getWeiboFirstImage = (doc) => {
  const allImages = Array.from(doc.querySelectorAll("img"))
  const filteredImages = allImages.filter((img) => {
    return !img.closest("a") && !(img.hasAttribute("alt") && /\[.+]/.test(img.getAttribute("alt")))
  })
  return filteredImages.length > 0 ? filteredImages[0] : null
}

const findMediaEnclosure = (enclosures) => {
  return enclosures?.find(
    (enclosure) =>
      enclosure.url !== "" &&
      (enclosure.mime_type.startsWith("video/") || enclosure.mime_type.startsWith("audio/")),
  )
}

const findImageEnclosure = (enclosures) => {
  return enclosures?.find(
    (enclosure) =>
      enclosure.mime_type.toLowerCase().startsWith("image/") ||
      /\.(jpg|jpeg|png|gif)$/i.test(enclosure.url),
  )
}

export const parseCoverImage = (entry) => {
  const doc = new DOMParser().parseFromString(entry.content, "text/html")
  const isWeiboFeed =
    entry.feed?.site_url && /https:\/\/weibo\.com\/\d+\//.test(entry.feed.site_url)

  // Get the first image
  const firstImage = isWeiboFeed ? getWeiboFirstImage(doc) : doc.querySelector("img")

  let coverSource = firstImage?.getAttribute("src")
  let isMedia = false
  let mediaPlayerEnclosure = null

  // If no cover image is found, try to get from other sources
  if (!coverSource) {
    // Check video poster
    const video = doc.querySelector("video")
    if (video) {
      coverSource = video.getAttribute("poster")
      isMedia = true
    } else {
      // Check media attachments
      mediaPlayerEnclosure = findMediaEnclosure(entry.enclosures)
      isMedia = !!mediaPlayerEnclosure

      // Check image attachments
      const imageEnclosure = findImageEnclosure(entry.enclosures)
      if (imageEnclosure) {
        coverSource = imageEnclosure.url
      }
    }

    // Check iframe
    if (!isMedia) {
      const iframe = doc.querySelector("iframe")
      const iframeHost = iframe?.getAttribute("src")?.split("/")[2]
      isMedia = !!iframeHost
    }
  }

  return { ...entry, coverSource, mediaPlayerEnclosure, isMedia }
}

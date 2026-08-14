const extractImageSources = (htmlString) => {
  const doc = new DOMParser().parseFromString(htmlString, "text/html")
  const images = doc.querySelectorAll("img")
  return [...images].map((img) => img.getAttribute("src"))
}

export default extractImageSources

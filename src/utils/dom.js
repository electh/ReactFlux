export const extractHeadingsFromDocument = (doc) =>
  [...doc.querySelectorAll("h1, h2, h3, h4, h5, h6")].map((heading, index) => ({
    id: `heading-${index}`,
    text: heading.textContent.trim(),
    level: Number.parseInt(heading.tagName.slice(1)),
  }))

export const extractHeadings = (content) => {
  if (!content) {
    return []
  }

  return extractHeadingsFromDocument(new DOMParser().parseFromString(content, "text/html"))
}

export const getPreferredScrollBehavior = () =>
  globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"

export const scrollToHeading = (heading) => {
  const headingElements = document.querySelectorAll("h1, h2, h3, h4, h5, h6")

  for (const element of headingElements) {
    if (element.textContent.trim() === heading.text) {
      element.scrollIntoView({ behavior: getPreferredScrollBehavior(), block: "start" })
      break
    }
  }
}

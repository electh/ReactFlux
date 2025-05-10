export const extractHeadings = (content) => {
  if (!content) {
    return []
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(content, "text/html")
  const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6"))

  return headings.map((heading, index) => {
    const text = heading.textContent.trim()
    const level = parseInt(heading.tagName.substring(1))
    const id = `heading-${index}`

    return {
      id,
      text,
      level,
      element: heading,
    }
  })
}

export const scrollToHeading = (heading) => {
  const headingElements = document.querySelectorAll("h1, h2, h3, h4, h5, h6")

  for (const element of headingElements) {
    if (element.textContent.trim() === heading.text) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
      break
    }
  }
}

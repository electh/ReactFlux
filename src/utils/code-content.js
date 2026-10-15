const extractCodeContent = (preElement) => {
  // html-react-parser already decoded text nodes; preserve literal entities and whitespace.
  return preElement.children
    .map((child) => {
      if (child.type === "tag" && child.name === "p") {
        const [firstChild] = child.children
        return `${firstChild?.data ?? ""}\n`
      }
      if (child.type === "tag" && child.name === "strong") {
        const [firstChild] = child.children
        return firstChild?.data ?? ""
      }
      return child.data ?? (child.name === "br" ? "\n" : "")
    })
    .join("")
}

export default extractCodeContent

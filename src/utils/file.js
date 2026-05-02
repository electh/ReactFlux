export const readFileAsText = async (file) => {
  try {
    return await file.text()
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`)
  }
}

export const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type })
  const url = globalThis.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  globalThis.URL.revokeObjectURL(url)
}

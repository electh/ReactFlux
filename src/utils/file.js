export const readFileAsText = async (file) => {
  try {
    return await file.text()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to read file: ${errorMessage}`, { cause: error })
  }
}

export const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const objectUrl = globalThis.URL.createObjectURL(blob)
  const downloadLink = document.createElement("a")

  downloadLink.href = objectUrl
  downloadLink.download = filename
  document.body.append(downloadLink)
  downloadLink.click()
  downloadLink.remove()
  globalThis.URL.revokeObjectURL(objectUrl)
}

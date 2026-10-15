const getCodeLineCount = (code) => {
  if (code.length === 0) {
    return 0
  }

  let count = 1
  let index = code.indexOf("\n")
  while (index !== -1 && index < code.length - 1) {
    count++
    index = code.indexOf("\n", index + 1)
  }
  return count
}

export default getCodeLineCount

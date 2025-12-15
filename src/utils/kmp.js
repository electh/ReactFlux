const computeLPSArray = (pattern) => {
  const lpsArray = Array.from({ length: pattern.length }).fill(0)
  let prevLongestPrefixLength = 0
  let currentIndex = 1

  while (currentIndex < pattern.length) {
    if (pattern[currentIndex] === pattern[prevLongestPrefixLength]) {
      prevLongestPrefixLength++
      lpsArray[currentIndex] = prevLongestPrefixLength
      currentIndex++
    } else if (prevLongestPrefixLength === 0) {
      lpsArray[currentIndex] = 0
      currentIndex++
    } else {
      prevLongestPrefixLength = lpsArray[prevLongestPrefixLength - 1]
    }
  }
  return lpsArray
}

// Main KMP search algorithm
export const kmpSearch = (text, pattern, ignoreCase = true) => {
  // TODO: Make ignoreCase configurable
  const processedText = ignoreCase ? text.toLowerCase() : text
  const processedPattern = ignoreCase ? pattern.toLowerCase() : pattern

  if (processedPattern.length === 0) {
    return 0 // Handle empty pattern
  }

  const lpsArray = computeLPSArray(processedPattern) // Pre-compute LPS array
  let textIndex = 0
  let patternIndex = 0

  while (textIndex < processedText.length) {
    if (processedText[textIndex] === processedPattern[patternIndex]) {
      textIndex++
      patternIndex++
    } else if (patternIndex === 0) {
      textIndex++
    } else {
      patternIndex = lpsArray[patternIndex - 1] // Backtrack using LPS
    }

    if (patternIndex === processedPattern.length) {
      return textIndex - patternIndex // Found match position
    }
  }
  return -1 // No match found
}

// Parse query statement
export const parseQuery = (query) => {
  const includeTerms = []
  const excludeTerms = []
  let exactPhrases = []

  // Handle quoted phrases, considering prefixes
  const exactMatches = query.match(/([-+]?)\s*"([^"]+)"/g)
  let queryCopy = query

  if (exactMatches) {
    exactPhrases = exactMatches.map((match) => {
      const prefix = match.trim()[0] // Get prefix
      const phrase = match.match(/"([^"]+)"/)[1] // Extract phrase content

      // Handle different logic based on prefix
      switch (prefix) {
        case "-": {
          excludeTerms.push(phrase)
          break
        }
        case "+": {
          includeTerms.push(phrase)
          break
        }
        default: {
          includeTerms.push(phrase)
          break
        }
      }

      return phrase
    })

    // Remove processed quoted phrases from query string
    queryCopy = query.replaceAll(/([-+]?)\s*"([^"]+)"/g, "")
  }

  // Handle remaining unquoted parts
  const terms = queryCopy.split(/\s+/)
  for (const term of terms) {
    const strippedTerm = term.replace(/^[-+]/, "") // Remove possible prefix symbols
    if (term.startsWith("-") && strippedTerm) {
      excludeTerms.push(strippedTerm)
    } else if (term.startsWith("+") && strippedTerm) {
      includeTerms.push(strippedTerm)
    } else if (strippedTerm) {
      // Check if the term is still valid after stripping prefix
      includeTerms.push(strippedTerm)
    }
  }

  return { includeTerms, excludeTerms, exactPhrases }
}

export const filterData = (data, query, fields = [], ignoreCase = true) => {
  const { includeTerms, excludeTerms, exactPhrases } = parseQuery(query)

  const checkField = (itemValue) => {
    // Check excluded terms
    if (excludeTerms.some((term) => kmpSearch(itemValue, term, ignoreCase) !== -1)) {
      return false
    }

    // Check exact match phrases
    if (
      exactPhrases.length > 0 &&
      !exactPhrases.some((phrase) => kmpSearch(itemValue, phrase, ignoreCase) !== -1)
    ) {
      return false
    }

    // Check included terms
    return includeTerms.every((term) => kmpSearch(itemValue, term, ignoreCase) !== -1)
  }

  return data.filter((item) =>
    fields.some((field) => {
      const value = item[field]
      return typeof value === "string" && checkField(ignoreCase ? value.toLowerCase() : value)
    }),
  )
}

// Main function
export const filterByQuery = (data, query, fields = [], ignoreCase = true) => {
  if (!Array.isArray(data) || data.length === 0) {
    console.error("Invalid data input:", {
      receivedData: data,
      type: typeof data,
      isArray: Array.isArray(data),
      length: Array.isArray(data) ? data.length : "N/A",
    })
    return []
  }
  if (typeof query !== "string" || query.trim().length === 0) {
    console.error("Invalid query input:", {
      receivedQuery: query,
      type: typeof query,
      trimmedLength: typeof query === "string" ? query.trim().length : "N/A",
    })
    return []
  }
  return filterData(data, query, fields, ignoreCase)
}

// Extract basic search terms for server-side search
export const extractBasicSearchTerms = (query) => {
  if (!query || typeof query !== "string" || !query.trim()) {
    return ""
  }

  const { includeTerms } = parseQuery(query)

  // Return only the words that must be included, connected with spaces
  // Excludes excludeTerms (-prefix)
  return includeTerms.join(" ").trim()
}

const QUERY_TOKEN_PATTERN = /[+-]?"[^"]+"(?=\s|$)|\S+/g

const parseQuery = (query) => {
  const includeTerms = []
  const excludeTerms = []

  for (const rawToken of query.match(QUERY_TOKEN_PATTERN) ?? []) {
    const firstCharacter = rawToken[0]
    const hasPrefix =
      (firstCharacter === "+" || firstCharacter === "-") &&
      rawToken.length > 1 &&
      rawToken[1] !== "+" &&
      rawToken[1] !== "-"
    let term = hasPrefix ? rawToken.slice(1) : rawToken

    if (term.length > 2 && term.startsWith('"') && term.endsWith('"')) {
      term = term.slice(1, -1)
    }

    const normalizedTerm = term.toLowerCase()
    if (hasPrefix && firstCharacter === "-") {
      excludeTerms.push(normalizedTerm)
    } else {
      includeTerms.push(normalizedTerm)
    }
  }

  return { includeTerms, excludeTerms }
}

const filterFeedsByQuery = (feeds, query, field) => {
  if (query.trim().length === 0) {
    return feeds
  }

  const { includeTerms, excludeTerms } = parseQuery(query)

  return feeds.filter((feed) => {
    const value = feed[field]
    if (typeof value !== "string") {
      return false
    }

    const normalizedValue = value.toLowerCase()
    return (
      !excludeTerms.some((term) => normalizedValue.includes(term)) &&
      includeTerms.every((term) => normalizedValue.includes(term))
    )
  })
}

export default filterFeedsByQuery

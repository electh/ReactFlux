const toExpandedCategoryKey = (value) => {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return `/category/${value}`
  }

  if (typeof value !== "string") {
    return null
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return null
  }

  if (/^\d+$/.test(trimmedValue)) {
    return `/category/${trimmedValue}`
  }

  return trimmedValue
}

export const sanitizeExpandedCategories = (value) => {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set()
  const sanitizedCategories = []

  for (const categoryKey of value) {
    const normalizedKey = toExpandedCategoryKey(categoryKey)
    if (normalizedKey === null || seen.has(normalizedKey)) {
      continue
    }

    seen.add(normalizedKey)
    sanitizedCategories.push(normalizedKey)
  }

  return sanitizedCategories
}

export default sanitizeExpandedCategories

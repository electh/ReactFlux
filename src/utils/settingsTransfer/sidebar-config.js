const toCategoryId = (value) => {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value
  }

  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) {
    return null
  }

  const parsedValue = Number.parseInt(value, 10)
  return parsedValue > 0 ? parsedValue : null
}

export const sanitizeExpandedCategories = (value) => {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set()
  const sanitizedCategories = []

  for (const categoryId of value) {
    const normalizedId = toCategoryId(categoryId)
    if (normalizedId === null || seen.has(normalizedId)) {
      continue
    }

    seen.add(normalizedId)
    sanitizedCategories.push(normalizedId)
  }

  return sanitizedCategories
}

export default sanitizeExpandedCategories

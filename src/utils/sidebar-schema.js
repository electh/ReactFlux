export const decodeDesktopSidebarCollapsed = (value) => {
  try {
    return JSON.parse(value) === true
  } catch {
    return false
  }
}

export const encodeDesktopSidebarCollapsed = (value) => JSON.stringify(value === true)

const toExpandedCategoryKey = (value) => {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? `/category/${value}` : null
  }

  if (typeof value !== "string") {
    return null
  }

  const match = value.trim().match(/^(?:\/category\/)?(\d+)$/)
  if (!match) {
    return null
  }

  const categoryId = Number(match[1])
  return Number.isSafeInteger(categoryId) && categoryId > 0 ? `/category/${categoryId}` : null
}

export const sanitizeExpandedCategories = (value) => {
  if (!Array.isArray(value)) {
    return []
  }

  const categoryKeys = new Set()

  for (const categoryValue of value) {
    const categoryKey = toExpandedCategoryKey(categoryValue)
    if (categoryKey !== null) {
      categoryKeys.add(categoryKey)
    }
  }

  return [...categoryKeys]
}

export const decodeExpandedCategories = (value) => {
  try {
    return sanitizeExpandedCategories(JSON.parse(value))
  } catch {
    return []
  }
}

export const encodeExpandedCategories = (value) => JSON.stringify(sanitizeExpandedCategories(value))

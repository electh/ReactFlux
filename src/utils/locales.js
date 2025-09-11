import { settingsState } from "@/store/settingsState"

export const getPreferredLanguage = () => {
  const { language } = settingsState.get()
  const browserLanguage = getBrowserLanguage()
  return language || browserLanguage
}

export const getBrowserLanguage = () => {
  const browserLanguage = navigator.language
  if (browserLanguage === "zh-Hans-CN") {
    return "zh-CN"
  }
  return browserLanguage
}

// Determine priority type for sorting text
const getTextType = (text) => {
  if (/^[0-9]/.test(text)) {
    return 0
  }
  if (/^[a-zA-Z]/.test(text)) {
    return 1
  }
  return 2
}

// Sorts array with mixed language content using a multi-level comparison
export const sortMixedLanguageArray = (array, keyOrGetter, locale) => {
  // Create value extractor based on parameter type
  const getValueFromItem =
    typeof keyOrGetter === "function" ? keyOrGetter : (item) => item[keyOrGetter]

  return [...array].toSorted((itemA, itemB) => {
    const valueA = getValueFromItem(itemA)
    const valueB = getValueFromItem(itemB)

    const typeA = getTextType(valueA)
    const typeB = getTextType(valueB)

    // First sort by type priority
    if (typeA !== typeB) {
      return typeA - typeB
    }

    // Then sort by locale rules within the same type
    return valueA.localeCompare(valueB, locale, { numeric: true })
  })
}

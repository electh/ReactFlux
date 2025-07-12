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

const isStartsWithEnglishLetter = (text) => {
  return /^[a-zA-Z]/.test(text)
}

export const sortMixedLanguageArray = (array, keyOrGetter, locale) => {
  const getValueFromItem =
    typeof keyOrGetter === "function" ? keyOrGetter : (item) => item[keyOrGetter]

  return [...array].sort((itemA, itemB) => {
    const valueA = getValueFromItem(itemA)
    const valueB = getValueFromItem(itemB)

    const isAEnglish = isStartsWithEnglishLetter(valueA)
    const isBEnglish = isStartsWithEnglishLetter(valueB)

    // Prioritize English-starting items
    if (isAEnglish !== isBEnglish) {
      return isAEnglish ? -1 : 1
    }

    // Both start with English: compare English parts first, then remaining parts
    if (isAEnglish && isBEnglish) {
      const englishPartA = valueA.match(/^[a-zA-Z]+/)[0]
      const englishPartB = valueB.match(/^[a-zA-Z]+/)[0]

      const englishCompare = englishPartA.localeCompare(englishPartB, "en")
      if (englishCompare !== 0) {
        return englishCompare
      }

      const restA = valueA.substring(englishPartA.length).trim()
      const restB = valueB.substring(englishPartB.length).trim()

      return restA.localeCompare(restB, locale, { numeric: true })
    }

    return valueA.localeCompare(valueB, locale, { numeric: true })
  })
}

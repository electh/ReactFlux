import { useStore } from "@nanostores/react"
import dayjs from "dayjs"
import "dayjs/locale/de"
import "dayjs/locale/en"
import "dayjs/locale/es"
import "dayjs/locale/fr"
import "dayjs/locale/zh-cn"
import { map } from "nanostores"
import Polyglot from "node-polyglot"
import { useEffect } from "react"

import { settingsState, updateSettings } from "@/store/settingsState"
import { getBrowserLanguage } from "@/utils/locales"
import createSetter from "@/utils/nanostores"

const languageToLocale = {
  "zh-CN": "zh-cn",
  de: "de",
  es: "es",
  fr: "fr",
}

export const polyglotState = map({
  polyglot: null,
})
const setPolyglot = createSetter(polyglotState, "polyglot")

const loadLanguage = async (language, polyglot) => {
  let phrases
  let locale = language

  try {
    const phrasesModule = await import(`../locales/${language}.json`)
    phrases = phrasesModule.default
  } catch (error) {
    console.error("Failed to load language:", error)
    const fallbackModule = await import("@/locales/en-US.json")
    phrases = fallbackModule.default
    locale = "en-US"
  }

  if (polyglot) {
    polyglot.replace(phrases)
    polyglot.locale(locale)
    setPolyglot(polyglot)
  } else {
    const newPolyglot = new Polyglot({
      phrases: phrases,
      locale: locale,
    })
    setPolyglot(newPolyglot)
  }
}

const useLanguage = () => {
  const { language } = useStore(settingsState)

  useEffect(() => {
    if (language) {
      loadLanguage(language)

      const locale =
        language.startsWith("de-") || language.startsWith("es-") || language.startsWith("fr-")
          ? language.slice(0, 2)
          : languageToLocale[language] || "en"
      dayjs.locale(locale)
    } else {
      updateSettings({ language: getBrowserLanguage() })
    }
  }, [language])
}

export default useLanguage

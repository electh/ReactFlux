import { useStore } from "@nanostores/react";
import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/es";
import "dayjs/locale/fr";
import "dayjs/locale/zh-cn";
import { map } from "nanostores";
import Polyglot from "node-polyglot";
import { useEffect } from "react";
import { settingsState, updateSettings } from "../store/settingsState";
import { getBrowserLanguage } from "../utils/locales";
import { createSetter } from "../utils/nanostores";

const languageToLocale = {
  "zh-CN": "zh-cn",
  es: "es",
  fr: "fr",
};

export const polyglotState = map({
  polyglot: null,
});
const setPolyglot = createSetter(polyglotState, "polyglot");

const loadLanguage = async (language, polyglot) => {
  let phrases;
  let locale = language;

  try {
    phrases = await import(`../locales/${language}.json`);
  } catch (error) {
    console.error("Failed to load language: ", error);
    phrases = await import("../locales/en-US.json");
    locale = "en-US";
  }

  if (!polyglot) {
    const newPolyglot = new Polyglot({
      phrases: phrases.default,
      locale: locale,
    });
    setPolyglot(newPolyglot);
  } else {
    polyglot.replace(phrases.default);
    polyglot.locale(locale);
    setPolyglot(polyglot);
  }
};

const useLanguage = () => {
  const { language } = useStore(settingsState);

  useEffect(() => {
    if (!language) {
      updateSettings({ language: getBrowserLanguage() });
    } else {
      loadLanguage(language);

      const locale =
        language.startsWith("es-") || language.startsWith("fr-")
          ? language.substring(0, 2)
          : languageToLocale[language] || "en";
      dayjs.locale(locale);
    }
  }, [language]);
};

export default useLanguage;

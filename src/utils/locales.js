import { settingsState } from "../store/settingsState";

export const getPreferredLanguage = () => {
  const { language } = settingsState.get();
  const browserLanguage = getBrowserLanguage();
  return language || browserLanguage;
};

export const getBrowserLanguage = () => {
  const browserLanguage = navigator.language;
  if (browserLanguage === "zh-Hans-CN") {
    return "zh-CN";
  }
  return browserLanguage;
};

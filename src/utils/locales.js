import { settingsState } from "../store/settingsState";

export const getPreferredLanguage = () => {
  const { language } = settingsState.get();
  return language || navigator.language;
};

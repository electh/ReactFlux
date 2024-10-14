import { persistentAtom } from "@nanostores/persistent";
import { getBrowserLanguage } from "../utils/locales";

const defaultValue = {
  articleWidth: 90,
  fontFamily: "system-ui",
  fontSize: 1.05,
  highlightTheme: "OneDark",
  homePage: "all",
  language: getBrowserLanguage(),
  layout: "large",
  markReadOnScroll: false,
  orderBy: "created_at",
  orderDirection: "desc",
  pageSize: 100,
  removeDuplicates: "none",
  showAllFeeds: false,
  showUnreadFeedsOnly: false,
  showDetailedRelativeTime: false,
  showFeedIcon: true,
  showStatus: "unread",
  theme: "light",
  themeColor: "Blue",
};

export const settingsState = persistentAtom("settings", defaultValue, {
  encode: JSON.stringify,
  decode: (str) => {
    const storedValue = JSON.parse(str);
    return { ...defaultValue, ...storedValue };
  },
});

export const getSettings = (key) => settingsState.get()[key];

export const updateSettings = (settingsChanges) =>
  settingsState.set({ ...settingsState.get(), ...settingsChanges });

export const resetSettings = () => settingsState.set(defaultValue);

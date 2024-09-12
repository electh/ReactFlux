import { persistentAtom } from "@nanostores/persistent";

const defaultValue = {
  articleWidth: 90,
  fontSize: 1.05,
  homePage: "all",
  language: navigator.language,
  layout: "large",
  markReadOnScroll: false,
  orderBy: "created_at",
  orderDirection: "desc",
  pageSize: 100,
  removeDuplicates: "none",
  showAllFeeds: false,
  showDetailedRelativeTime: false,
  showFeedIcon: true,
  showStatus: "unread",
  theme: "light",
  themeColor: "Blue",
};

export const settingsState = persistentAtom("settings", defaultValue, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const getSettings = (key) => settingsState.get()[key];

export const updateSettings = (settingsChanges) =>
  settingsState.set({ ...settingsState.get(), ...settingsChanges });

export const resetSettings = () => settingsState.set(defaultValue);

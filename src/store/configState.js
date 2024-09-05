import { proxy, subscribe } from "valtio";

export const defaultConfig = {
  articleWidth: 90,
  fontSize: 1.05,
  homePage: "all",
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

export const configState = proxy(
  JSON.parse(localStorage.getItem("config")) || defaultConfig,
);

export const getConfig = (key) => configState[key];

export const updateConfig = (configChanges) => {
  Object.assign(configState, configChanges);
};

export const resetConfig = () => updateConfig(defaultConfig);

subscribe(configState, () => {
  localStorage.setItem("config", JSON.stringify(configState));
});

const defaultConfig = {
  color: "Blue",
  showStatus: "all",
  homePage: "all",
  orderBy: "published_at",
  orderDirection: "desc",
  pageSize: 100,
  fontSize: 1.05,
  layout: "large",
  showAllFeeds: false,
  showFeedIcon: true,
  theme: "light",
};

const getConfig = (name) => {
  const config = JSON.parse(localStorage.getItem("config")) || {};
  const hasProperty = Object.hasOwn(config, name);
  return hasProperty ? config[name] : defaultConfig[name] || null;
};

const setConfig = (name, value) => {
  const config = JSON.parse(localStorage.getItem("config")) || {};
  config[name] = value;
  localStorage.setItem("config", JSON.stringify(config));
};

export { getConfig, setConfig };

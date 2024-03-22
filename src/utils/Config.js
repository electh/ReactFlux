const getConfig = (name) => {
  const config = JSON.parse(localStorage.getItem("config"));
  if (!config) {
    console.log("No config found in localStorage");
    return null;
  }

  const value = config[name];
  if (typeof value === "undefined") {
    console.log(`Config for "${name}" not found`);
    return null;
  }
  return value;
};

const setConfig = (name, value) => {
  const config = JSON.parse(localStorage.getItem("config")) || {};
  const newConfig = { ...config, [name]: value };
  localStorage.setItem("config", JSON.stringify(newConfig));
};

export { getConfig, setConfig };

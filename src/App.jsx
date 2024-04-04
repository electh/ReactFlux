import React, { useEffect } from "react";

import "./App.css";
import useStore from "./Store";
import Header from "./components/Header/Header";
import Main from "./components/Main/Main";
import Sidebar from "./components/Sidebar/Sidebar";

const App = () => {
  const initData = useStore((state) => state.initData);
  const theme = useStore((state) => state.theme);
  const isSysDarkMode = useStore((state) => state.isSysDarkMode);
  const setIsSysDarkMode = useStore((state) => state.setIsSysDarkMode);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    initData();

    const handleDarkModeChange = (event) => {
      setIsSysDarkMode(event.matches);
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", handleDarkModeChange);

    // 在组件卸载时清除监听器
    return () => {
      mediaQuery.removeEventListener("change", handleDarkModeChange);
    };
  }, []);

  useEffect(() => {
    const applyTheme = (isDarkMode) => {
      document.body.setAttribute("arco-theme", isDarkMode ? "dark" : "light");
      document.body.style.colorScheme = isDarkMode ? "dark" : "light";
    };

    applyTheme(theme === "system" ? isSysDarkMode : theme === "dark");
  }, [isSysDarkMode, theme]);

  return (
    <div className="app">
      <Header />
      <Sidebar />
      <Main />
    </div>
  );
};

export default App;

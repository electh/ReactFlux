import { useEffect } from "react";

import { useAtomValue } from "jotai";
import "./App.css";
import useStore from "./Store";
import { configAtom } from "./atoms/configAtom";
import Header from "./components/Header/Header";
import Main from "./components/Main/Main";
import Sidebar from "./components/Sidebar/Sidebar";

const App = () => {
  const config = useAtomValue(configAtom);
  const { theme } = config;
  const isSysDarkMode = useStore((state) => state.isSysDarkMode);
  const setIsSysDarkMode = useStore((state) => state.setIsSysDarkMode);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
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
      <Sidebar />
      <Header />
      <Main />
    </div>
  );
};

export default App;

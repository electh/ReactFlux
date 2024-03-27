import React, { useEffect } from "react";

import "./App.css";
import useStore from "./Store";
import Header from "./components/Header/Header";
import Main from "./components/Main/Main";
import Sidebar from "./components/Sidebar/Sidebar";
import { applyColor } from "./utils/Colors";

const App = () => {
  const initData = useStore((state) => state.initData);
  const theme = useStore((state) => state.theme);
  const isSysDarkMode = useStore((state) => state.isSysDarkMode);
  const setIsSysDarkMode = useStore((state) => state.setIsSysDarkMode);
  const color = useStore((state) => state.color);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    initData();

    const handelDarkMode = (event) => {
      setIsSysDarkMode(event.matches);
    };

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (event) => {
        handelDarkMode(event);
      });

    // 在组件卸载时清除监听器
    return () => {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", (event) => {
          handelDarkMode(event);
        });
    };
  }, []);

  useEffect(() => {
    const isDarkMode = theme === "system" ? isSysDarkMode : theme === "dark";
    if (isDarkMode) {
      document.body.setAttribute("arco-theme", "dark");
      document.body.style.colorScheme = "dark";
    } else {
      document.body.removeAttribute("arco-theme");
      document.body.style.colorScheme = "light";
    }
  }, [isSysDarkMode, theme]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    applyColor(color);
  }, [color, isSysDarkMode, theme]);

  return (
    <div
      className="app"
      style={{ display: "flex", backgroundColor: "var(--color-bg-1)" }}
    >
      <Header />
      <Sidebar />
      <Main />
    </div>
  );
};

export default App;

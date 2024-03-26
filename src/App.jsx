import React, { useEffect } from "react";

import "./App.css";
import useStore from "./Store";
import Header from "./components/Header/Header";
import Main from "./components/Main/Main";
import Sidebar from "./components/Sidebar/Sidebar";
import { applyColor } from "./utils/Colors";
import { getConfig } from "./utils/Config";

const App = () => {
  const initData = useStore((state) => state.initData);
  const theme = useStore((state) => state.theme);

  const initTheme = () => {
    if (theme === "dark") {
      document.body.setAttribute("arco-theme", "dark");
      document.body.style.colorScheme = "dark";
    } else {
      document.body.removeAttribute("arco-theme");
      document.body.style.colorScheme = "light";
    }
    applyColor(getConfig("themeColor") || "Blue");
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    initData();
    initTheme();
  }, []);

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

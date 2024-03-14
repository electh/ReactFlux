import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import "./App.css";
import { useStore } from "./Store";
import ArticleList from "./components/ArticleList";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { applyColor } from "./utils/Colors";
import { getConfig } from "./utils/Config";

export default function App() {
  const initData = useStore((state) => state.initData);
  const theme = useStore((state) => state.theme);
  const location = useLocation();

  const initTheme = () => {
    if (theme === "dark") {
      document.body.setAttribute("arco-theme", "dark");
    } else {
      document.body.removeAttribute("arco-theme");
    }
    applyColor(getConfig("themeColor") || "Blue");
  };

  useEffect(() => {
    initData();
    initTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="app"
      style={{ display: "flex", backgroundColor: "var(--color-bg-1)" }}
    >
      <Header theme={theme} />
      <Sidebar location={location} />
      <ArticleList />
    </div>
  );
}

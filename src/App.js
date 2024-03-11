import "./App.css";
import ArticleList from "./components/ArticleList";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "./Store";

export default function App() {
  const { initData, theme } = useStore();
  const location = useLocation();

  const initTheme = () => {
    if (theme === "dark") {
      document.body.setAttribute("arco-theme", "dark");
    } else {
      document.body.removeAttribute("arco-theme");
    }
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

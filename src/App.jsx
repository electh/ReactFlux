import { useEffect, useState } from "react";

import { Layout } from "@arco-design/web-react";
import { useAtomValue } from "jotai";
import "./App.css";
import { configAtom } from "./atoms/configAtom";
import Header from "./components/Header/Header";
import Main from "./components/Main/Main";
import Sidebar from "./components/Sidebar/Sidebar";
import { useCollapsed } from "./hooks/useCollapsed.js";

const App = () => {
  const { theme } = useAtomValue(configAtom);
  const [isSystemDark, setIsSystemDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const { collapsed, toggleCollapsed, isLg } = useCollapsed();

  useEffect(() => {
    const handleDarkModeChange = (event) => {
      setIsSystemDark(event.matches);
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", handleDarkModeChange);

    // 在组件卸载时清除监听器
    return () => mediaQuery.removeEventListener("change", handleDarkModeChange);
  }, []);

  useEffect(() => {
    const applyTheme = (isDarkMode) => {
      const themeValue = isDarkMode ? "dark" : "light";
      document.body.setAttribute("arco-theme", themeValue);
      document.body.style.colorScheme = themeValue;
    };

    if (theme === "system") {
      applyTheme(isSystemDark);
    } else {
      applyTheme(theme === "dark");
    }
  }, [isSystemDark, theme]);

  return (
    <div className="app">
      {isLg ? (
        <Layout.Sider
          breakpoint="lg"
          className="sidebar"
          collapsed={collapsed}
          collapsedWidth={0}
          collapsible
          onCollapse={toggleCollapsed}
          trigger={null}
          width={240}
          style={{
            borderRight: collapsed ? "none" : "1px solid var(--color-border-2)",
            display: collapsed ? "none" : "block",
          }}
        >
          <Sidebar />
        </Layout.Sider>
      ) : null}
      <Header />
      <Main />
    </div>
  );
};

export default App;

import { useEffect, useState } from "react";

import { Layout } from "@arco-design/web-react";
import { useAtomValue } from "jotai";
import "./App.css";
import { configAtom } from "./atoms/configAtom";
import Header from "./components/Header/Header";
import Main from "./components/Main/Main";
import Sidebar from "./components/Sidebar/Sidebar";
import { useScreenWidth } from "./hooks/useScreenWidth";
import { applyColor } from "./utils/colors";

const App = () => {
  const { theme, themeColor } = useAtomValue(configAtom);
  const [isSystemDark, setIsSystemDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const { belowLg } = useScreenWidth();

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
    applyColor(themeColor);
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
  }, [isSystemDark, theme, themeColor]);

  return (
    <div className="app">
      {belowLg ? null : (
        <Layout.Sider
          breakpoint="lg"
          className="sidebar"
          collapsible={false}
          trigger={null}
          width={240}
        >
          <Sidebar />
        </Layout.Sider>
      )}
      <Header />
      <Main />
    </div>
  );
};

export default App;

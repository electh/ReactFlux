import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { settingsState } from "../store/settingsState";
import { applyColor } from "../utils/colors";

const useTheme = () => {
  const { theme, themeColor, themeMode } = useStore(settingsState);
  const [isSystemDark, setIsSystemDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemDarkMode = (event) => setIsSystemDark(event.matches);

    mediaQuery.addEventListener("change", updateSystemDarkMode);

    // 在组件卸载时清除监听器
    return () => mediaQuery.removeEventListener("change", updateSystemDarkMode);
  }, []);

  useEffect(() => {
    const applyColorScheme = (isDarkMode) => {
      const themeMode = isDarkMode ? "dark" : "light";
      document.body.setAttribute("arco-theme", themeMode);
      document.body.style.colorScheme = themeMode;
    };

    applyColor(themeColor);

    if (themeMode === "system") {
      applyColorScheme(isSystemDark);
    } else {
      applyColorScheme(themeMode === "dark");
    }
  }, [isSystemDark, themeMode, themeColor]);

  useEffect(() => {
    document.body.className = theme;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `/styles/${theme}-theme.css`;
    if (theme !== "default") {
      document.head.appendChild(link);
    }

    return () => {
      if (theme !== "default") {
        document.head.removeChild(link);
      }
    };
  }, [theme]);
};

export default useTheme;

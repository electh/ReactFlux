import { useEffect, useState } from "react";
import { useSnapshot } from "valtio";
import { configState } from "../store/configState";
import { applyColor } from "../utils/colors";

const useTheme = () => {
  const { theme, themeColor } = useSnapshot(configState);
  const [isSystemDark, setIsSystemDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

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
};

export default useTheme;

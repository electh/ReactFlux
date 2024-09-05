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

    if (theme === "system") {
      applyColorScheme(isSystemDark);
    } else {
      applyColorScheme(theme === "dark");
    }
  }, [isSystemDark, theme, themeColor]);
};

export default useTheme;

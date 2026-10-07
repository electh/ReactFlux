import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"

import { settingsState } from "@/store/settingsState"
import { applyColor } from "@/utils/colors"

const useTheme = () => {
  const { themeColor, themeMode } = useStore(settingsState, {
    keys: ["themeColor", "themeMode"],
  })
  const [isSystemDark, setIsSystemDark] = useState(
    globalThis.matchMedia("(prefers-color-scheme: dark)").matches,
  )

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)")
    const updateSystemDarkMode = (event) => setIsSystemDark(event.matches)

    mediaQuery.addEventListener("change", updateSystemDarkMode)

    // 在组件卸载时清除监听器
    return () => mediaQuery.removeEventListener("change", updateSystemDarkMode)
  }, [])

  useEffect(() => {
    const applyColorScheme = (isDarkMode) => {
      const themeMode = isDarkMode ? "dark" : "light"
      document.body.setAttribute("arco-theme", themeMode)
      document.body.style.colorScheme = themeMode

      const shellBackground = getComputedStyle(document.body)
        .getPropertyValue("--color-neutral-2")
        .trim()
      if (shellBackground) {
        document.documentElement.style.setProperty("--app-shell-background", shellBackground)
        for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
          meta.setAttribute("content", shellBackground)
        }
      }

      document
        .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
        ?.setAttribute("content", isDarkMode ? "black" : "default")
    }

    applyColor(themeColor)

    if (themeMode === "system") {
      applyColorScheme(isSystemDark)
    } else {
      applyColorScheme(themeMode === "dark")
    }
  }, [isSystemDark, themeMode, themeColor])
}

export default useTheme

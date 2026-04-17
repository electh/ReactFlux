import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"

import { settingsState, updateSettings } from "@/store/settingsState"
import { applyColor, getModeFallbackColor, isModeRestrictedColor } from "@/utils/colors"

const useTheme = () => {
  const { themeColor, themeMode } = useStore(settingsState)
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
      const mode = isDarkMode ? "dark" : "light"
      document.body.setAttribute("arco-theme", mode)
      document.body.style.colorScheme = mode
    }

    const effectiveDark = themeMode === "system" ? isSystemDark : themeMode === "dark"

    if (isModeRestrictedColor(themeColor, effectiveDark)) {
      updateSettings({ themeColor: getModeFallbackColor(themeColor) })
      return
    }

    applyColor(themeColor)
    applyColorScheme(effectiveDark)
  }, [isSystemDark, themeMode, themeColor])
}

export default useTheme

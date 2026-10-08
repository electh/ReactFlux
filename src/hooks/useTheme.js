import { useStore } from "@nanostores/react"
import { useEffect, useLayoutEffect, useState } from "react"

import { isPhotoSliderVisibleState } from "@/hooks/usePhotoSlider"
import useScreenWidth from "@/hooks/useScreenWidth"
import { activeContentState } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { applyColor } from "@/utils/colors"
import { selectStore } from "@/utils/nanostores"

const hasActiveArticleState = selectStore(activeContentState, Boolean)

const useTheme = () => {
  const { articleListLayout, themeColor, themeMode } = useStore(settingsState, {
    keys: ["articleListLayout", "themeColor", "themeMode"],
  })
  const hasActiveArticle = useStore(hasActiveArticleState)
  const isPhotoSliderVisible = useStore(isPhotoSliderVisibleState)
  const { isBelowMedium } = useScreenWidth()
  const isDetailLayerActive =
    hasActiveArticle &&
    (isBelowMedium || articleListLayout === "card" || articleListLayout === "list")
  const [isSystemDark, setIsSystemDark] = useState(
    globalThis.matchMedia("(prefers-color-scheme: dark)").matches,
  )

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)")
    const updateSystemDarkMode = (event) => setIsSystemDark(event.matches)

    mediaQuery.addEventListener("change", updateSystemDarkMode)

    // Remove the system theme listener when the component unmounts.
    return () => mediaQuery.removeEventListener("change", updateSystemDarkMode)
  }, [])

  useLayoutEffect(() => {
    const applyColorScheme = (isDarkMode) => {
      const themeMode = isDarkMode ? "dark" : "light"
      document.body.setAttribute("arco-theme", themeMode)
      document.body.style.colorScheme = themeMode

      const bodyStyle = getComputedStyle(document.body)
      const shellBackground = bodyStyle.getPropertyValue("--color-neutral-2").trim()
      if (shellBackground) {
        document.documentElement.style.setProperty("--app-shell-background", shellBackground)
      }

      const pageBackground = isDetailLayerActive
        ? bodyStyle.getPropertyValue("--color-bg-1").trim() || shellBackground
        : shellBackground
      const statusBarBackground =
        (isPhotoSliderVisible && bodyStyle.getPropertyValue("--app-lightbox-background").trim()) ||
        pageBackground
      if (statusBarBackground) {
        document.documentElement.style.setProperty(
          "--app-status-bar-background",
          statusBarBackground,
        )
        for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
          meta.setAttribute("content", statusBarBackground)
        }
      }

      document
        .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
        ?.setAttribute("content", isPhotoSliderVisible || isDarkMode ? "black" : "default")
    }

    applyColor(themeColor)

    const isDarkMode = themeMode === "system" ? isSystemDark : themeMode === "dark"
    applyColorScheme(isDarkMode)
  }, [isDetailLayerActive, isPhotoSliderVisible, isSystemDark, themeMode, themeColor])
}

export default useTheme

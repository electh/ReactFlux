import { Button, ConfigProvider, Layout, Tooltip } from "@arco-design/web-react"
import deDE from "@arco-design/web-react/es/locale/de-DE"
import enUS from "@arco-design/web-react/es/locale/en-US"
import esES from "@arco-design/web-react/es/locale/es-ES"
import frFR from "@arco-design/web-react/es/locale/fr-FR"
import jaJP from "@arco-design/web-react/es/locale/ja-JP"
import zhCN from "@arco-design/web-react/es/locale/zh-CN"
import { IconMenuFold } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useCallback, useEffect, useMemo, useRef } from "react"

import "./App.css"
import AppNotifications from "./AppNotifications"
import HomePageManager from "./components/HomePageManager"
import Main from "./components/Main/Main"
import Sidebar from "./components/Sidebar/Sidebar"
import DesktopSidebarContext from "./contexts/desktop-sidebar-context"
import useArticleFontStylesheet from "./hooks/useArticleFontStylesheet"
import useFeedIconsSync from "./hooks/useFeedIconsSync"
import useLanguage, { polyglotState } from "./hooks/useLanguage"
import useScreenWidth from "./hooks/useScreenWidth"
import useTheme from "./hooks/useTheme"
import { settingsState } from "./store/settingsState"
import { desktopSidebarCollapsedState, toggleDesktopSidebar } from "./store/sidebarState"
import hideSpinner from "./utils/loading"

const EXPANDED_SIDEBAR_WIDTH = 240

const canReceiveFocus = (element) =>
  Boolean(
    element?.isConnected &&
    !element.disabled &&
    element.getClientRects().length > 0 &&
    !element.closest('[inert], [aria-hidden="true"]'),
  )

const scheduleFocus = (callback) => {
  if (typeof globalThis.requestAnimationFrame === "function") {
    const frameId = globalThis.requestAnimationFrame(callback)
    return () => globalThis.cancelAnimationFrame(frameId)
  }

  const timeoutId = globalThis.setTimeout(callback, 0)
  return () => globalThis.clearTimeout(timeoutId)
}

const localMap = {
  "de-DE": deDE,
  "es-ES": esES,
  "fr-FR": frFR,
  "ja-JP": jaJP,
  "zh-CN": zhCN,
}

const getLocale = (language) => localMap[language] || enUS

const App = () => {
  useLanguage()
  useTheme()
  useArticleFontStylesheet()
  useFeedIconsSync()

  const { isBelowLarge } = useScreenWidth()

  const { polyglot } = useStore(polyglotState)
  const { language } = useStore(settingsState, { keys: ["language"] })
  const isDesktopSidebarCollapsed = useStore(desktopSidebarCollapsedState)
  const locale = getLocale(language)
  const sidebarCollapseLabel = polyglot?.t("sidebar.collapse")
  const sidebarWidth = isDesktopSidebarCollapsed ? 0 : EXPANDED_SIDEBAR_WIDTH

  const collapseButtonRef = useRef(null)
  const detailCloseButtonRef = useRef(null)
  const pendingFocusTargetRef = useRef(null)
  const reopenButtonRef = useRef(null)

  const collapseDesktopSidebar = useCallback(() => {
    if (desktopSidebarCollapsedState.get()) {
      return
    }

    pendingFocusTargetRef.current = "reopen"
    toggleDesktopSidebar()
  }, [])

  const expandDesktopSidebar = useCallback(() => {
    if (!desktopSidebarCollapsedState.get()) {
      return
    }

    pendingFocusTargetRef.current = "collapse"
    toggleDesktopSidebar()
  }, [])

  useEffect(() => {
    const focusTarget = pendingFocusTargetRef.current
    if (!focusTarget) {
      return
    }

    return scheduleFocus(() => {
      if (pendingFocusTargetRef.current !== focusTarget) {
        return
      }

      pendingFocusTargetRef.current = null

      const focusCandidates =
        focusTarget === "collapse"
          ? [collapseButtonRef.current]
          : [reopenButtonRef.current, detailCloseButtonRef.current]
      focusCandidates.find((element) => canReceiveFocus(element))?.focus({ preventScroll: true })
    })
  }, [isDesktopSidebarCollapsed])

  useEffect(() => {
    hideSpinner()
  }, [])

  const desktopSidebarContextValue = useMemo(
    () => ({
      collapseButtonRef,
      collapseDesktopSidebar,
      detailCloseButtonRef,
      expandDesktopSidebar,
      isDesktopSidebarCollapsed,
      reopenButtonRef,
    }),
    [collapseDesktopSidebar, expandDesktopSidebar, isDesktopSidebarCollapsed],
  )

  return (
    polyglot && (
      <ConfigProvider locale={locale}>
        <AppNotifications />
        <HomePageManager />
        <DesktopSidebarContext.Provider value={desktopSidebarContextValue}>
          <div className="app" style={{ "--desktop-sidebar-width": `${sidebarWidth}px` }}>
            {!isBelowLarge && (
              <Layout.Sider
                breakpoint="lg"
                collapsible={false}
                trigger={null}
                width={EXPANDED_SIDEBAR_WIDTH}
                className={`sidebar ${
                  isDesktopSidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded"
                }`}
              >
                {!isDesktopSidebarCollapsed && (
                  <Tooltip content={sidebarCollapseLabel} position="right">
                    <Button
                      ref={collapseButtonRef}
                      aria-controls="desktop-sidebar-navigation"
                      aria-expanded={true}
                      aria-label={sidebarCollapseLabel}
                      className="desktop-sidebar-toggle"
                      icon={<IconMenuFold aria-hidden="true" />}
                      shape="circle"
                      size="small"
                      type="secondary"
                      onClick={collapseDesktopSidebar}
                    />
                  </Tooltip>
                )}
                <div
                  className="desktop-sidebar-content"
                  hidden={isDesktopSidebarCollapsed}
                  id="desktop-sidebar-navigation"
                >
                  {!isDesktopSidebarCollapsed && <Sidebar />}
                </div>
              </Layout.Sider>
            )}
            <Main />
          </div>
        </DesktopSidebarContext.Provider>
      </ConfigProvider>
    )
  )
}

export default App

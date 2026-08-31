import { Button, ConfigProvider, Layout, Tooltip } from "@arco-design/web-react"
import deDE from "@arco-design/web-react/es/locale/de-DE"
import enUS from "@arco-design/web-react/es/locale/en-US"
import esES from "@arco-design/web-react/es/locale/es-ES"
import frFR from "@arco-design/web-react/es/locale/fr-FR"
import zhCN from "@arco-design/web-react/es/locale/zh-CN"
import { IconMenuFold, IconMenuUnfold } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect } from "react"

import "./App.css"
import AppNotifications from "./AppNotifications"
import HomePageManager from "./components/HomePageManager"
import Main from "./components/Main/Main"
import Sidebar from "./components/Sidebar/Sidebar"
import useArticleFontStylesheet from "./hooks/useArticleFontStylesheet"
import useFeedIconsSync from "./hooks/useFeedIconsSync"
import useLanguage, { polyglotState } from "./hooks/useLanguage"
import useScreenWidth from "./hooks/useScreenWidth"
import useTheme from "./hooks/useTheme"
import { settingsState } from "./store/settingsState"
import { desktopSidebarCollapsedState, toggleDesktopSidebar } from "./store/sidebarState"
import hideSpinner from "./utils/loading"

const COLLAPSED_SIDEBAR_WIDTH = 48
const EXPANDED_SIDEBAR_WIDTH = 240

const localMap = {
  "de-DE": deDE,
  "es-ES": esES,
  "fr-FR": frFR,
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
  const sidebarToggleLabel = polyglot?.t(
    isDesktopSidebarCollapsed ? "sidebar.expand" : "sidebar.collapse",
  )
  const sidebarWidth = isDesktopSidebarCollapsed ? COLLAPSED_SIDEBAR_WIDTH : EXPANDED_SIDEBAR_WIDTH
  const SidebarToggleIcon = isDesktopSidebarCollapsed ? IconMenuUnfold : IconMenuFold

  useEffect(() => {
    hideSpinner()
  }, [])

  return (
    polyglot && (
      <ConfigProvider locale={locale}>
        <AppNotifications />
        <HomePageManager />
        <div className="app" style={{ "--desktop-sidebar-width": `${sidebarWidth}px` }}>
          {isBelowLarge ? null : (
            <Layout.Sider
              breakpoint="lg"
              collapsible={false}
              trigger={null}
              width={sidebarWidth}
              className={`sidebar ${
                isDesktopSidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded"
              }`}
            >
              <Tooltip content={sidebarToggleLabel} position="right">
                <Button
                  aria-controls="desktop-sidebar-navigation"
                  aria-expanded={!isDesktopSidebarCollapsed}
                  aria-label={sidebarToggleLabel}
                  className="desktop-sidebar-toggle"
                  icon={<SidebarToggleIcon aria-hidden="true" />}
                  shape="circle"
                  size="small"
                  type="secondary"
                  onClick={toggleDesktopSidebar}
                />
              </Tooltip>
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
      </ConfigProvider>
    )
  )
}

export default App

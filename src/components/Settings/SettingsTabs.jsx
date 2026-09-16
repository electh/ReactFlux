import { Tabs } from "@arco-design/web-react"
import {
  IconBook,
  IconCommand,
  IconFile,
  IconFolder,
  IconSettings,
  IconSkin,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect, useRef } from "react"

import Appearance from "./Appearance"
import CategoryList from "./CategoryList"
import FeedList from "./FeedList"
import General from "./General"
import Hotkeys from "./Hotkeys"
import Reading from "./Reading"

import AdaptiveScrollArea from "@/components/ui/AdaptiveScrollArea"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import {
  getVisibleSettingsTabs,
  resolveSettingsTab,
  SETTINGS_TAB_KEYS,
} from "@/utils/settings-navigation"

import "./SettingsTabs.css"

const TAB_CONTENT = {
  [SETTINGS_TAB_KEYS.GENERAL]: { Component: General, Icon: IconSettings },
  [SETTINGS_TAB_KEYS.READING]: { Component: Reading, Icon: IconBook },
  [SETTINGS_TAB_KEYS.APPEARANCE]: { Component: Appearance, Icon: IconSkin },
  [SETTINGS_TAB_KEYS.FEEDS]: { Component: FeedList, Icon: IconFile },
  [SETTINGS_TAB_KEYS.CATEGORIES]: { Component: CategoryList, Icon: IconFolder },
  [SETTINGS_TAB_KEYS.HOTKEYS]: { Component: Hotkeys, Icon: IconCommand },
}

const CustomTabTitle = ({ Icon, tabKey, title }) => (
  <div
    data-settings-tab-key={tabKey}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    <Icon aria-hidden="true" style={{ fontSize: "20px" }} />
    <div className="custom-tab-title">{title}</div>
  </div>
)

const SettingsTabs = ({ activeTab, onTabChange }) => {
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()
  const tabsRootRef = useRef(null)
  const focusedTabKeyRef = useRef(null)
  const visibleTabs = getVisibleSettingsTabs(isBelowMedium)
  const resolvedActiveTab = resolveSettingsTab(activeTab, isBelowMedium)

  useEffect(() => {
    const handleFocusIn = (event) => {
      const panel = event.target.closest?.("[data-settings-panel-key]")
      const tabTitle = event.target.closest?.("[data-settings-tab-key]")
      focusedTabKeyRef.current =
        panel?.dataset.settingsPanelKey ?? tabTitle?.dataset.settingsTabKey ?? null
    }

    document.addEventListener("focusin", handleFocusIn)
    return () => document.removeEventListener("focusin", handleFocusIn)
  }, [])

  useEffect(() => {
    if (resolvedActiveTab === activeTab) {
      return
    }

    const shouldRestoreFocus = document.hasFocus() && focusedTabKeyRef.current === activeTab

    onTabChange(resolvedActiveTab)

    if (shouldRestoreFocus) {
      globalThis.requestAnimationFrame(() => {
        const tabTitle = tabsRootRef.current?.querySelector(
          `[data-settings-tab-key="${CSS.escape(resolvedActiveTab)}"]`,
        )
        tabTitle?.closest('[role="tab"]')?.focus()
      })
    }
  }, [activeTab, onTabChange, resolvedActiveTab])

  return (
    <AdaptiveScrollArea className="settings-tabs-scroll">
      <div ref={tabsRootRef} className="settings-tabs-content">
        <Tabs
          animation
          activeTab={resolvedActiveTab}
          className="custom-tabs"
          tabPosition="top"
          onChange={onTabChange}
        >
          {visibleTabs.map(({ key, labelKey }) => {
            const { Component, Icon } = TAB_CONTENT[key]

            return (
              <Tabs.TabPane
                key={key}
                title={<CustomTabTitle Icon={Icon} tabKey={key} title={polyglot.t(labelKey)} />}
              >
                <div data-settings-panel-key={key}>
                  <Component />
                </div>
              </Tabs.TabPane>
            )
          })}
        </Tabs>
      </div>
    </AdaptiveScrollArea>
  )
}

export default SettingsTabs

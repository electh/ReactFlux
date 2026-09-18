import { Button, Drawer } from "@arco-design/web-react"
import { IconClose, IconMenuUnfold } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { atom } from "nanostores"
import { useEffect, useRef } from "react"
import { useLocation } from "react-router"

import Sidebar from "@/components/Sidebar/Sidebar"
import CustomTooltip from "@/components/ui/CustomTooltip"
import useDesktopSidebar from "@/hooks/useDesktopSidebar"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import "./SidebarTrigger.css"
import createSetter from "@/utils/nanostores"

const sidebarVisibleState = atom(false)
const setSidebarVisible = createSetter(sidebarVisibleState)

export default function SidebarTrigger() {
  const currentPath = useLocation().pathname
  const { isBelowLarge } = useScreenWidth()

  const sidebarVisible = useStore(sidebarVisibleState)
  const { polyglot } = useStore(polyglotState)
  const { expandDesktopSidebar, isDesktopSidebarCollapsed, reopenButtonRef } = useDesktopSidebar()

  const closeButtonRef = useRef(null)
  const restoreFocusAfterCloseRef = useRef(false)
  const triggerButtonRef = useRef(null)

  const closeSidebarLabel = polyglot.t("actions.close_dialog", {
    name: polyglot.t("sidebar.navigation_menu"),
  })
  const sidebarTriggerLabel = polyglot.t(isBelowLarge ? "sidebar.open" : "sidebar.expand")

  const closeSidebar = () => {
    restoreFocusAfterCloseRef.current = true
    setSidebarVisible(false)
  }

  const closeSidebarAfterNavigation = () => {
    restoreFocusAfterCloseRef.current = false
    setSidebarVisible(false)
  }

  const handleAfterClose = () => {
    const shouldRestoreFocus = restoreFocusAfterCloseRef.current
    restoreFocusAfterCloseRef.current = false

    const triggerButton = triggerButtonRef.current
    if (
      shouldRestoreFocus &&
      triggerButton?.isConnected &&
      !triggerButton.disabled &&
      triggerButton.getClientRects().length > 0
    ) {
      triggerButton.focus({ preventScroll: true })
    }
  }

  useEffect(() => {
    if (!isBelowLarge) {
      restoreFocusAfterCloseRef.current = false
      setSidebarVisible(false)
    }
  }, [isBelowLarge])

  useEffect(() => {
    if (currentPath) {
      restoreFocusAfterCloseRef.current = false
      setSidebarVisible(false)
    }
  }, [currentPath])

  if (!isBelowLarge) {
    if (!isDesktopSidebarCollapsed) {
      return null
    }

    return (
      <div className="brand">
        <CustomTooltip mini content={sidebarTriggerLabel}>
          <Button
            ref={reopenButtonRef}
            aria-controls="desktop-sidebar-navigation"
            aria-expanded={false}
            aria-label={sidebarTriggerLabel}
            className="desktop-sidebar-reopen"
            icon={<IconMenuUnfold aria-hidden="true" />}
            shape="circle"
            size="small"
            type="secondary"
            onClick={expandDesktopSidebar}
          />
        </CustomTooltip>
      </div>
    )
  }

  return (
    <div>
      <div className="brand">
        <CustomTooltip mini content={sidebarTriggerLabel}>
          <Button
            ref={triggerButtonRef}
            aria-controls="mobile-sidebar-drawer"
            aria-expanded={sidebarVisible}
            aria-haspopup="dialog"
            aria-label={sidebarTriggerLabel}
            className="trigger"
            icon={<IconMenuUnfold aria-hidden="true" />}
            shape="circle"
            size="small"
            onClick={() => {
              restoreFocusAfterCloseRef.current = false
              setSidebarVisible(!sidebarVisible)
            }}
          />
        </CustomTooltip>
      </div>
      <Drawer
        focusLock
        afterClose={handleAfterClose}
        afterOpen={() => closeButtonRef.current?.focus({ preventScroll: true })}
        autoFocus={false}
        className="sidebar-drawer"
        closable={false}
        footer={null}
        id="mobile-sidebar-drawer"
        placement="left"
        title={null}
        visible={sidebarVisible}
        width={240}
        onCancel={closeSidebar}
      >
        <Sidebar
          headerAction={
            <Button
              ref={closeButtonRef}
              aria-label={closeSidebarLabel}
              className="mobile-sidebar-close"
              icon={<IconClose aria-hidden="true" />}
              shape="circle"
              size="small"
              onClick={closeSidebar}
            />
          }
          onNavigate={closeSidebarAfterNavigation}
        />
      </Drawer>
    </div>
  )
}

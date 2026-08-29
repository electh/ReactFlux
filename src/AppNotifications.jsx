import { Button, Notification } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useEffect, useRef } from "react"

import { polyglotState } from "@/hooks/useLanguage"
import useModalToggle from "@/hooks/useModalToggle"
import useVersionCheck from "@/hooks/useVersionCheck"
import { duplicateHotkeysState } from "@/store/hotkeysState"
import { GITHUB_REPO_PATH } from "@/utils/constants"

import "./AppNotifications.css"

const NEW_VERSION_NOTIFICATION_ID = "new-version-available"
const DUPLICATE_HOTKEYS_NOTIFICATION_ID = "duplicate-hotkeys"

const NotificationActions = ({ polyglot, onCheck, onDismiss }) => (
  <div className="notification-actions">
    <Button size="small" type="secondary" onClick={onDismiss}>
      {polyglot.t("actions.dismiss")}
    </Button>
    <Button size="small" type="primary" onClick={onCheck}>
      {polyglot.t("actions.check")}
    </Button>
  </div>
)

const AppNotifications = () => {
  const { polyglot } = useStore(polyglotState)
  const duplicateHotkeys = useStore(duplicateHotkeysState)
  const { hasUpdate, dismissUpdate } = useVersionCheck()
  const { setSettingsModalVisible, setSettingsTabsActiveTab } = useModalToggle()

  const previousDuplicateHotkeysSignatureRef = useRef(null)
  const isDuplicateHotkeysNotificationDismissedRef = useRef(false)

  const duplicateHotkeysSignature = JSON.stringify(duplicateHotkeys.toSorted())
  const hasDuplicateHotkeys = duplicateHotkeys.length > 0

  useEffect(() => {
    if (!hasUpdate) {
      Notification.remove(NEW_VERSION_NOTIFICATION_ID)
      return
    }

    Notification.info({
      id: NEW_VERSION_NOTIFICATION_ID,
      title: polyglot.t("app.new_version_available"),
      closable: false,
      content: polyglot.t("app.new_version_available_description"),
      duration: 0,
      btn: (
        <NotificationActions
          polyglot={polyglot}
          onCheck={() => {
            window.open(`https://github.com/${GITHUB_REPO_PATH}/commits/main`, "_blank")
            Notification.remove(NEW_VERSION_NOTIFICATION_ID)
          }}
          onDismiss={() => {
            dismissUpdate()
            Notification.remove(NEW_VERSION_NOTIFICATION_ID)
          }}
        />
      ),
    })
  }, [dismissUpdate, hasUpdate, polyglot])

  useEffect(() => {
    if (previousDuplicateHotkeysSignatureRef.current !== duplicateHotkeysSignature) {
      previousDuplicateHotkeysSignatureRef.current = duplicateHotkeysSignature
      isDuplicateHotkeysNotificationDismissedRef.current = false
    }

    if (!hasDuplicateHotkeys) {
      Notification.remove(DUPLICATE_HOTKEYS_NOTIFICATION_ID)
      return
    }

    if (isDuplicateHotkeysNotificationDismissedRef.current) {
      return
    }

    const dismissDuplicateHotkeysNotification = () => {
      isDuplicateHotkeysNotificationDismissedRef.current = true
      Notification.remove(DUPLICATE_HOTKEYS_NOTIFICATION_ID)
    }

    Notification.error({
      id: DUPLICATE_HOTKEYS_NOTIFICATION_ID,
      title: polyglot.t("settings.duplicate_hotkeys"),
      closable: false,
      duration: 0,
      btn: (
        <NotificationActions
          polyglot={polyglot}
          onDismiss={dismissDuplicateHotkeysNotification}
          onCheck={() => {
            setSettingsTabsActiveTab("5")
            setSettingsModalVisible(true)
            dismissDuplicateHotkeysNotification()
          }}
        />
      ),
    })
  }, [
    duplicateHotkeysSignature,
    hasDuplicateHotkeys,
    polyglot,
    setSettingsModalVisible,
    setSettingsTabsActiveTab,
  ])

  useEffect(() => {
    return () => {
      Notification.remove(NEW_VERSION_NOTIFICATION_ID)
      Notification.remove(DUPLICATE_HOTKEYS_NOTIFICATION_ID)
    }
  }, [])

  return null
}

export default AppNotifications

import { Button } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useEffect } from "react"

import { polyglotState } from "@/hooks/useLanguage"
import { Notification } from "@/utils/feedback"

const NOTIFICATION_ID = "sw-update-available"

// Surfaces the "new version available" prompt dispatched from main.jsx when the
// service worker detects an update. Replacing autoUpdate's silent reload with an
// explicit prompt prevents the double page reload that happened when an idle tab
// was refreshed after a new build had been deployed.
const UpdatePrompt = () => {
  const { polyglot } = useStore(polyglotState)

  useEffect(() => {
    const handler = (event) => {
      const updateSW = event.detail?.updateSW
      if (typeof updateSW !== "function") {
        return
      }

      Notification.info({
        id: NOTIFICATION_ID,
        title: polyglot.t("app.new_version_available"),
        content: polyglot.t("app.new_version_available_description"),
        duration: 0,
        btn: (
          <span>
            <Button
              size="small"
              style={{ marginRight: 8 }}
              onClick={() => Notification.remove(NOTIFICATION_ID)}
            >
              {polyglot.t("actions.dismiss")}
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={() => {
                Notification.remove(NOTIFICATION_ID)
                updateSW(true)
              }}
            >
              {polyglot.t("actions.reload")}
            </Button>
          </span>
        ),
      })
    }

    globalThis.addEventListener("reloadedflux:sw-need-refresh", handler)
    return () => globalThis.removeEventListener("reloadedflux:sw-need-refresh", handler)
  }, [polyglot])

  return null
}

export default UpdatePrompt

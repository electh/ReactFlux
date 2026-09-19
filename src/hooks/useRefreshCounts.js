import { Button, Notification } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { createElement, useCallback } from "react"

import useAppData from "@/hooks/useAppData"
import { polyglotState } from "@/hooks/useLanguage"

const COUNTS_REFRESH_NOTIFICATION_ID = "counts-refresh-error"

const useRefreshCounts = () => {
  const { refreshCounts } = useAppData()
  const { polyglot } = useStore(polyglotState)

  return useCallback(
    async (options = {}) => {
      const tryRefreshCounts = async () => {
        try {
          const result = await refreshCounts({ ...options, includeEntrySummary: true })
          if (result?.error) {
            throw new Error(result.error)
          }
          return true
        } catch (error) {
          console.error("Failed to refresh counts:", error)
          return false
        }
      }

      const refreshAndDismissWarning = async () => {
        const refreshed = await tryRefreshCounts()
        if (refreshed) {
          Notification.remove(COUNTS_REFRESH_NOTIFICATION_ID)
        }
        return refreshed
      }

      if (await refreshAndDismissWarning()) {
        return true
      }

      Notification.warning({
        id: COUNTS_REFRESH_NOTIFICATION_ID,
        content: polyglot.t("app.counts_refresh_error"),
        duration: 0,
        btn: createElement(
          Button,
          { size: "small", onClick: refreshAndDismissWarning },
          polyglot.t("actions.retry"),
        ),
      })
      return false
    },
    [polyglot, refreshCounts],
  )
}

export default useRefreshCounts

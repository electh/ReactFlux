import { ofetch } from "ofetch"
import { useEffect, useState } from "react"

import { hasPWAUpdate } from "@/pwa"
import { GITHUB_REPO_PATH, UPDATE_NOTIFICATION_KEY } from "@/utils/constants"
import { checkIsInLast24Hours, getTimestamp } from "@/utils/date"
import buildInfo from "@/version-info.json"

function useVersionCheck() {
  const [hasUpdate, setHasUpdate] = useState(false)

  const dismissUpdate = () => {
    localStorage.setItem(UPDATE_NOTIFICATION_KEY, getTimestamp().toString())
    setHasUpdate(false)
  }

  useEffect(() => {
    if (!import.meta.env.PROD || hasPWAUpdate()) {
      return
    }

    const checkUpdate = async () => {
      try {
        const lastDismissed = localStorage.getItem(UPDATE_NOTIFICATION_KEY)
        if (lastDismissed && checkIsInLast24Hours(lastDismissed)) {
          return
        }

        const data = await ofetch(`https://api.github.com/repos/${GITHUB_REPO_PATH}/commits/main`)

        const currentGitTimestamp = getTimestamp(buildInfo.gitDate)
        const latestGitTimestamp = getTimestamp(data.commit.committer.date)

        setHasUpdate(currentGitTimestamp < latestGitTimestamp)
      } catch (error) {
        console.error("Check update failed", error)
      }
    }

    checkUpdate()
  }, [])

  return { hasUpdate, dismissUpdate }
}

export default useVersionCheck

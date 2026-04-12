import { useStore } from "@nanostores/react"
import { ofetch } from "ofetch"
import { useEffect, useState } from "react"

import { dataState } from "@/store/dataState"
import { GITHUB_REPO_PATH } from "@/utils/constants"
import { getTimestamp } from "@/utils/date"
import { compareBuildVersions } from "@/utils/version"
import buildInfo from "@/version-info.json"

// The GitHub Pages deployment publishes the built app from the `build` branch.
// Checking `main/public/version-info.json` reads a source file that CI does not
// write back to `main`, so it can drift from the actual deployed artifact.
const DEFAULT_REMOTE_VERSION_INFO_URL = `https://raw.githubusercontent.com/${GITHUB_REPO_PATH}/build/version-info.json`
const DEFAULT_LATEST_COMMIT_URL = `https://api.github.com/repos/${GITHUB_REPO_PATH}/commits/main`

const isVersionCheckDebugEnabled = () => {
  const rawValue = import.meta.env.VITE_VERSION_CHECK_DEBUG
  if (typeof rawValue !== "string") {
    return false
  }

  const normalizedValue = rawValue.trim().toLowerCase()
  return ["1", "true", "yes", "on"].includes(normalizedValue)
}

const logVersionCheckDebug = (payload) => {
  if (!isVersionCheckDebugEnabled()) {
    return
  }

  console.info("[version-check]", payload)
}

const getRemoteVersionInfoUrl = () => {
  const configuredUrl = import.meta.env.VITE_VERSION_INFO_URL
  const baseUrl = configuredUrl || DEFAULT_REMOTE_VERSION_INFO_URL

  try {
    const url = new URL(baseUrl)
    url.searchParams.set("_", Date.now().toString())
    return url.toString()
  } catch {
    const separator = baseUrl.includes("?") ? "&" : "?"
    return `${baseUrl}${separator}_=${Date.now()}`
  }
}

const getLatestCommitUrl = () => {
  try {
    const url = new URL(DEFAULT_LATEST_COMMIT_URL)
    url.searchParams.set("_", Date.now().toString())
    return url.toString()
  } catch {
    return `${DEFAULT_LATEST_COMMIT_URL}?_=${Date.now()}`
  }
}

function useVersionCheck() {
  const { isAppDataReady } = useStore(dataState)

  const [hasUpdate, setHasUpdate] = useState(false)
  const [remoteBuildInfo, setRemoteBuildInfo] = useState(null)

  const dismissUpdate = () => {
    setHasUpdate(false)
  }

  useEffect(() => {
    if (!isAppDataReady || import.meta.env.DEV) {
      return
    }

    const checkUpdate = async () => {
      try {
        const remoteVersionInfoUrl = getRemoteVersionInfoUrl()
        try {
          const remoteBuildInfo = await ofetch(remoteVersionInfoUrl, {
            cache: "no-store",
          })

          const buildVersionComparison = compareBuildVersions(
            buildInfo.buildVersion,
            remoteBuildInfo.buildVersion,
          )

          if (buildVersionComparison !== null) {
            const hasUpdateByBuildVersion = buildVersionComparison < 0
            setHasUpdate(hasUpdateByBuildVersion)
            setRemoteBuildInfo(hasUpdateByBuildVersion ? remoteBuildInfo : null)
            logVersionCheckDebug({
              reason: "build_version_comparison",
              hasUpdate: hasUpdateByBuildVersion,
              remoteVersionInfoUrl,
              local: buildInfo,
              remote: remoteBuildInfo,
            })
            return
          }

          const currentGitTimestamp = getTimestamp(buildInfo.gitCommitDate ?? buildInfo.gitDate)
          const latestGitTimestamp = getTimestamp(
            remoteBuildInfo.gitCommitDate ?? remoteBuildInfo.gitDate,
          )
          const hasValidDates =
            Number.isFinite(currentGitTimestamp) && Number.isFinite(latestGitTimestamp)

          if (hasValidDates) {
            const hasUpdateByDate = currentGitTimestamp < latestGitTimestamp
            setHasUpdate(hasUpdateByDate)
            setRemoteBuildInfo(hasUpdateByDate ? remoteBuildInfo : null)
            logVersionCheckDebug({
              reason: "date_comparison",
              hasUpdate: hasUpdateByDate,
              remoteVersionInfoUrl,
              local: buildInfo,
              remote: remoteBuildInfo,
              currentGitTimestamp,
              latestGitTimestamp,
            })
            return
          }

          if (buildInfo.gitHash && remoteBuildInfo.gitHash) {
            const hasUpdateByHash = buildInfo.gitHash !== remoteBuildInfo.gitHash
            setHasUpdate(hasUpdateByHash)
            setRemoteBuildInfo(hasUpdateByHash ? remoteBuildInfo : null)
            logVersionCheckDebug({
              reason: "hash_fallback",
              hasUpdate: hasUpdateByHash,
              remoteVersionInfoUrl,
              local: buildInfo,
              remote: remoteBuildInfo,
            })
            return
          }

          logVersionCheckDebug({
            reason: "insufficient_version_data",
            remoteVersionInfoUrl,
            local: buildInfo,
            remote: remoteBuildInfo,
          })
        } catch (error) {
          logVersionCheckDebug({
            reason: "version_info_request_failed",
            remoteVersionInfoUrl,
            error: error instanceof Error ? error.message : String(error),
          })
        }

        const latestCommitUrl = getLatestCommitUrl()
        const latestCommit = await ofetch(latestCommitUrl, {
          cache: "no-store",
        })
        const latestCommitDate = latestCommit?.commit?.committer?.date
        const latestCommitHash = latestCommit?.sha?.slice?.(0, buildInfo.gitHash.length)

        const currentGitTimestamp = getTimestamp(buildInfo.gitCommitDate ?? buildInfo.gitDate)
        const latestGitTimestamp = getTimestamp(latestCommitDate)
        const hasValidDates =
          Number.isFinite(currentGitTimestamp) && Number.isFinite(latestGitTimestamp)

        if (hasValidDates) {
          const hasUpdateByCommitDate = currentGitTimestamp < latestGitTimestamp
          setHasUpdate(hasUpdateByCommitDate)
          setRemoteBuildInfo(
            hasUpdateByCommitDate
              ? {
                  gitCommitDate: latestCommitDate,
                  gitDate: latestCommitDate,
                  gitHash: latestCommitHash,
                }
              : null,
          )
          logVersionCheckDebug({
            reason: "commit_date_fallback",
            hasUpdate: hasUpdateByCommitDate,
            latestCommitUrl,
            local: buildInfo,
            remote: {
              gitHash: latestCommitHash,
              gitDate: latestCommitDate,
            },
            currentGitTimestamp,
            latestGitTimestamp,
          })
          return
        }

        if (buildInfo.gitHash && latestCommitHash) {
          const hasUpdateByCommitHash = buildInfo.gitHash !== latestCommitHash
          setHasUpdate(hasUpdateByCommitHash)
          setRemoteBuildInfo(
            hasUpdateByCommitHash
              ? {
                  gitCommitDate: latestCommitDate,
                  gitDate: latestCommitDate,
                  gitHash: latestCommitHash,
                }
              : null,
          )
          logVersionCheckDebug({
            reason: "commit_hash_fallback",
            hasUpdate: hasUpdateByCommitHash,
            latestCommitUrl,
            local: buildInfo,
            remote: {
              gitHash: latestCommitHash,
              gitDate: latestCommitDate,
            },
          })
          return
        }

        setHasUpdate(false)
        setRemoteBuildInfo(null)
        logVersionCheckDebug({
          reason: "insufficient_version_data",
          hasUpdate: false,
          remoteVersionInfoUrl,
          latestCommitUrl,
          local: buildInfo,
          remote: {
            gitHash: latestCommitHash,
            gitDate: latestCommitDate,
          },
        })
      } catch (error) {
        console.error("Check update failed", error)
        setRemoteBuildInfo(null)
        logVersionCheckDebug({
          reason: "request_failed",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    checkUpdate()
  }, [isAppDataReady])

  return { hasUpdate, dismissUpdate, remoteBuildInfo }
}

export default useVersionCheck

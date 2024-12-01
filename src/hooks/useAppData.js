import { useRef } from "react"

import {
  getCategories,
  getCounters,
  getFeeds,
  getIntegrationsStatus,
  getTodayEntries,
  getVersion,
} from "@/apis"
import {
  setCategoriesData,
  setFeedsData,
  setHasIntegrations,
  setHistoryCount,
  setIsAppDataReady,
  setUnreadInfo,
  setUnreadTodayCount,
  setVersion,
} from "@/store/dataState"
import compareVersions from "@/utils/version"

const useAppData = () => {
  const isLoading = useRef(false)

  const fetchAppData = async () => {
    if (isLoading.current) {
      return
    }

    isLoading.current = true
    setIsAppDataReady(false)

    try {
      const responses = await Promise.all([
        getCounters(),
        getTodayEntries(0, "unread"),
        getFeeds(),
        getCategories(),
        getVersion(),
      ])

      const [countersData, unreadTodayData, feedsData, categoriesData, versionData] = responses

      const unreadInfo = feedsData.reduce((acc, feed) => {
        acc[feed.id] = countersData.unreads[feed.id] ?? 0
        return acc
      }, {})

      const historyCount = Object.values(countersData.reads).reduce((acc, count) => acc + count, 0)

      const { version } = versionData
      setVersion(version)

      if (compareVersions(version, "2.2.2") >= 0) {
        const integrationsStatus = await getIntegrationsStatus()
        if (integrationsStatus.has_integrations) {
          setHasIntegrations(true)
        }
      }

      setUnreadInfo(unreadInfo)
      setUnreadTodayCount(unreadTodayData.total ?? 0)
      setHistoryCount(historyCount)
      setFeedsData(feedsData)
      setCategoriesData(categoriesData)
      setIsAppDataReady(true)
    } catch (error) {
      console.error("Error fetching app data: ", error)
    } finally {
      isLoading.current = false
    }
  }

  return { fetchAppData }
}

export default useAppData

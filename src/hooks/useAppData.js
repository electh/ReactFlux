import { useCallback, useRef } from "react"

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
  setIsCoreDataReady,
  setUnreadInfo,
  setUnreadTodayCount,
  setVersion,
} from "@/store/dataState"
import compareVersions from "@/utils/version"

const useAppData = () => {
  const isLoading = useRef(false)

  const fetchCounters = useCallback(async () => {
    try {
      const countersData = await getCounters()
      const historyCount = Object.values(countersData.reads).reduce((acc, count) => acc + count, 0)
      setHistoryCount(historyCount)
      return countersData
    } catch (error) {
      console.error("Error fetching counters: ", error)
      return { reads: {}, unreads: {} }
    }
  }, [])

  const fetchUnreadToday = useCallback(async () => {
    try {
      const unreadTodayData = await getTodayEntries(0, "unread")
      setUnreadTodayCount(unreadTodayData.total ?? 0)
      return unreadTodayData
    } catch (error) {
      console.error("Error fetching unread today entries: ", error)
      setUnreadTodayCount(0)
      return { total: 0 }
    }
  }, [])

  const fetchFeeds = useCallback(async () => {
    try {
      const feedsData = await getFeeds()
      setFeedsData(feedsData)
      return feedsData
    } catch (error) {
      console.error("Error fetching feeds: ", error)
      return []
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const categoriesData = await getCategories()
      setCategoriesData(categoriesData)
      return categoriesData
    } catch (error) {
      console.error("Error fetching categories: ", error)
      return []
    }
  }, [])

  const updateUnreadInfo = useCallback((feeds, counters) => {
    if (!feeds || !counters) {
      return
    }

    const unreadInfo = feeds.reduce((acc, feed) => {
      acc[feed.id] = counters.unreads[feed.id] ?? 0
      return acc
    }, {})
    setUnreadInfo(unreadInfo)
  }, [])

  const fetchIntegrationStatus = useCallback(async (version) => {
    if (compareVersions(version, "2.2.2") < 0) {
      return false
    }

    try {
      const integrationsStatus = await getIntegrationsStatus()
      const hasIntegrations = !!integrationsStatus.has_integrations
      setHasIntegrations(hasIntegrations)
      return hasIntegrations
    } catch (error) {
      console.error("Error fetching integration status: ", error)
      return false
    }
  }, [])

  const fetchFeedRelatedData = useCallback(async () => {
    if (isLoading.current) {
      return
    }

    isLoading.current = true

    try {
      const [counters, feeds] = await Promise.all([fetchCounters(), fetchFeeds()])

      updateUnreadInfo(feeds, counters)
      await fetchUnreadToday()

      return { counters, feeds }
    } catch (error) {
      console.error("Error fetching feed related data: ", error)
    } finally {
      isLoading.current = false
    }
  }, [fetchCounters, fetchFeeds, fetchUnreadToday, updateUnreadInfo])

  const fetchAppData = useCallback(async () => {
    if (isLoading.current) {
      return
    }

    isLoading.current = true
    setIsAppDataReady(false)
    setIsCoreDataReady(false)

    try {
      const [feeds, categories] = await Promise.all([
        fetchFeeds(),
        fetchCategories(),
      ])
      
      setIsCoreDataReady(true)
      
      const [counters, versionData, todayData] = await Promise.all([
        fetchCounters(),
        getVersion(),
        fetchUnreadToday(),
      ])

      const { version } = versionData
      setVersion(version)
      await fetchIntegrationStatus(version)

      updateUnreadInfo(feeds, counters)

      setIsAppDataReady(true)
      return { counters, feeds, categories, version, todayData }
    } catch (error) {
      console.error("Error fetching app data: ", error)
    } finally {
      isLoading.current = false
    }
  }, [
    fetchCategories,
    fetchCounters,
    fetchFeeds,
    fetchIntegrationStatus,
    fetchUnreadToday,
    updateUnreadInfo,
  ])

  return { fetchAppData, fetchFeedRelatedData }
}

export default useAppData

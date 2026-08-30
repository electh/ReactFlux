import {
  getCategories,
  getCounters,
  getEntryCountSummary,
  getFeeds,
  getIntegrationsStatus,
  getTodayEntries,
  getVersion,
} from "@/apis"
import {
  commitCatalogData,
  commitCountsData,
  commitServerInfoData,
  dataState,
  getDataResourceRevision,
  getDataSessionRevision,
  setDataResourceLoadState,
} from "@/store/dataState"
import compareVersions from "@/utils/version"

const RESOURCE_NAMES = ["catalog", "counts", "serverInfo"]

const getErrorMessage = (error) => (error instanceof Error ? error.message : String(error))

const loadCatalog = async () => {
  const [feedsData, categoriesData] = await Promise.all([getFeeds(), getCategories()])

  if (!Array.isArray(feedsData) || !Array.isArray(categoriesData)) {
    throw new TypeError("Invalid feed or category response")
  }

  return { feedsData, categoriesData }
}

const loadCounts = async (includeEntrySummary) => {
  const summaryRequest = includeEntrySummary
    ? getEntryCountSummary()
    : getTodayEntries("unread", { limit: 1 })
  const [countersResult, summaryResult] = await Promise.allSettled([getCounters(), summaryRequest])
  const errors = []
  const countsData = {}

  if (countersResult.status === "fulfilled") {
    const counters = countersResult.value
    const feeds = dataState.get().feedsData
    const unreadInfo = {}

    for (const feed of feeds) {
      unreadInfo[feed.id] = counters.unreads?.[feed.id] ?? 0
    }

    countsData.historyCount = Object.values(counters.reads ?? {}).reduce(
      (total, count) => total + count,
      0,
    )
    countsData.unreadInfo = unreadInfo
  } else {
    errors.push(countersResult.reason)
  }

  if (summaryResult.status === "fulfilled") {
    if (includeEntrySummary) {
      countsData.starredCount = summaryResult.value.starredCount
      countsData.unreadStarredCount = summaryResult.value.unreadStarredCount
      countsData.unreadTodayCount = summaryResult.value.unreadTodayCount
    } else {
      countsData.unreadTodayCount = summaryResult.value.total ?? 0
    }
  } else {
    errors.push(summaryResult.reason)
  }

  if (Object.keys(countsData).length === 0) {
    throw new AggregateError(errors, "Unable to load feed counts")
  }

  return {
    countsData,
    error: errors.length > 0 ? errors.map((error) => getErrorMessage(error)).join("; ") : null,
  }
}

const loadServerInfo = async () => {
  const { version } = await getVersion()
  let hasIntegrations = false
  let error = null

  if (compareVersions(version, "2.2.2") >= 0) {
    try {
      const integrationsStatus = await getIntegrationsStatus()
      hasIntegrations = Boolean(integrationsStatus.has_integrations)
    } catch (integrationError) {
      error = getErrorMessage(integrationError)
    }
  }

  return {
    serverInfoData: { version, hasIntegrations },
    error,
  }
}

const createAppDataCoordinator = () => {
  let isActive = true
  const requestStates = Object.fromEntries(
    RESOURCE_NAMES.map((resource) => [resource, { inFlight: null, requestId: 0 }]),
  )

  const runResource = (resource, loadResource, commitResource, { force = false } = {}) => {
    const requestState = requestStates[resource]
    if (!isActive) {
      return Promise.reject(new Error("App data coordinator has been disposed"))
    }

    if (!force && requestState.inFlight) {
      return requestState.inFlight
    }

    const requestId = ++requestState.requestId
    const sessionRevision = getDataSessionRevision()
    const resourceRevision = getDataResourceRevision(resource)
    const { hasSnapshot } = dataState.get().loadState[resource]
    const isRequestCurrent = () =>
      isActive &&
      getDataSessionRevision() === sessionRevision &&
      requestState.requestId === requestId

    setDataResourceLoadState(resource, {
      activity: hasSnapshot ? "refreshing" : "loading",
      error: null,
    })

    const request = Promise.resolve()
      .then(loadResource)
      .then((result) => {
        if (!isRequestCurrent()) {
          return result
        }

        if (getDataResourceRevision(resource) !== resourceRevision) {
          setDataResourceLoadState(resource, { activity: "idle" })
          return runResource(resource, loadResource, commitResource, { force: true })
        }

        commitResource(result)
        return result
      })
      .catch((error) => {
        if (isRequestCurrent()) {
          setDataResourceLoadState(resource, {
            activity: "idle",
            error: getErrorMessage(error),
          })
          console.error(`Failed to load ${resource}:`, error)
        }

        throw error
      })
      .finally(() => {
        if (requestState.inFlight === request) {
          requestState.inFlight = null
        }
      })

    requestState.inFlight = request
    return request
  }

  const refreshCatalog = (options) =>
    runResource("catalog", loadCatalog, commitCatalogData, options)

  const refreshCounts = ({ includeEntrySummary = false, ...options } = {}) =>
    runResource(
      "counts",
      () => loadCounts(includeEntrySummary),
      ({ countsData, error }) => commitCountsData(countsData, error),
      options,
    )

  const refreshServerInfo = (options) =>
    runResource(
      "serverInfo",
      loadServerInfo,
      ({ serverInfoData, error }) => commitServerInfoData(serverInfoData, error),
      options,
    )

  const refreshFeedData = async (options) => {
    await refreshCatalog(options)
    await refreshCounts(options)
  }

  const bootstrap = () => {
    isActive = true
    return Promise.allSettled([refreshFeedData(), refreshServerInfo()])
  }

  const dispose = () => {
    isActive = false

    for (const requestState of Object.values(requestStates)) {
      requestState.requestId += 1
      requestState.inFlight = null
    }
  }

  return {
    actions: { refreshCounts, refreshFeedData },
    bootstrap,
    dispose,
  }
}

export default createAppDataCoordinator

import { useStore } from "@nanostores/react"
import { atom } from "nanostores"

import { contentState, setEntriesWithDeduplication, setLoadMoreVisible } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { getTimestamp } from "@/utils/date"
import { parseCoverImage } from "@/utils/images"
import { extractBasicSearchTerms } from "@/utils/kmp"
import createSetter from "@/utils/nanostores"

const loadingMoreState = atom(false)
const setLoadingMore = createSetter(loadingMoreState)

const isUniqueEntry = (entry, existingEntries) =>
  !existingEntries.some((existing) => existing.id === entry.id)

const useLoadMore = () => {
  const { entries, filterString, infoFrom } = useStore(contentState)
  const { pageSize, showStatus, orderBy, orderDirection } = useStore(settingsState)
  const loadingMore = useStore(loadingMoreState)

  const updateEntries = (newEntries) => {
    const uniqueNewEntries = newEntries.filter((entry) => isUniqueEntry(entry, entries))
    const combinedEntries = [...entries, ...uniqueNewEntries]
    setEntriesWithDeduplication(combinedEntries)
  }

  const getFilterParams = () => {
    if (entries.length === 0) {
      return {}
    }

    const referenceEntry = getReferenceEntry()
    if (!referenceEntry) {
      return {}
    }

    return buildFilterParams(referenceEntry)
  }

  const sortProperty = ["starred", "history"].includes(infoFrom) ? "changed_at" : orderBy

  const getReferenceEntry = () => {
    const sortedEntries = [...entries].toSorted((a, b) => {
      const aValue = getTimestamp(a[sortProperty])
      const bValue = getTimestamp(b[sortProperty])
      return orderDirection === "desc" ? bValue - aValue : aValue - bValue
    })

    const entriesByTimestamp = {}
    for (const entry of sortedEntries) {
      const timestamp = getTimestamp(entry[sortProperty])
      if (!entriesByTimestamp[timestamp]) {
        entriesByTimestamp[timestamp] = []
      }
      entriesByTimestamp[timestamp].push(entry)
    }

    const timestamps = Object.keys(entriesByTimestamp)
      .map(Number)
      .toSorted((a, b) => (orderDirection === "desc" ? b - a : a - b))

    if (timestamps.length === 0) {
      return null
    }

    const referenceTimestampIndex = timestamps.length > 1 ? timestamps.length - 2 : 0
    const referenceTimestamp = timestamps[referenceTimestampIndex]

    const timestampEntries = entriesByTimestamp[referenceTimestamp]
    return timestampEntries.at(-1)
  }

  const buildFilterParams = (referenceEntry) => {
    if (sortProperty === "changed_at") {
      return orderDirection === "desc"
        ? { changed_before: getTimestamp(referenceEntry.changed_at) }
        : { changed_after: getTimestamp(referenceEntry.changed_at) }
    }

    if (sortProperty === "created_at") {
      return orderDirection === "desc"
        ? { before_entry_id: referenceEntry.id }
        : { after_entry_id: referenceEntry.id }
    }

    if (sortProperty === "published_at") {
      return orderDirection === "desc"
        ? { published_before: getTimestamp(referenceEntry.published_at) }
        : { published_after: getTimestamp(referenceEntry.published_at) }
    }

    return {}
  }

  const handleLoadMore = async (getEntries) => {
    setLoadingMore(true)

    try {
      const filterParams = getFilterParams()

      // Add search query to filter params if present
      // Extract basic search terms
      const basicSearchTerms = extractBasicSearchTerms(filterString)
      if (basicSearchTerms) {
        filterParams.search = basicSearchTerms
      }

      let response

      if (infoFrom === "starred") {
        response = await getEntries(showStatus === "unread" ? "unread" : null, null, filterParams)
      } else if (infoFrom === "history") {
        response = await getEntries(null, null, filterParams)
      } else {
        switch (showStatus) {
          case "starred": {
            response = await getEntries(null, true, filterParams)
            break
          }
          case "unread": {
            response = await getEntries("unread", false, filterParams)
            break
          }
          default: {
            response = await getEntries(null, false, filterParams)
            break
          }
        }
      }

      if (response?.entries?.length > 0) {
        const newEntries = response.entries.map((entry) => parseCoverImage(entry))
        updateEntries(newEntries)
      }
      if (response.total < pageSize) {
        setLoadMoreVisible(false)
      }
    } catch (error) {
      console.error("Error fetching more articles:", error)
    } finally {
      setLoadingMore(false)
    }
  }

  return { handleLoadMore, loadingMore }
}

export default useLoadMore

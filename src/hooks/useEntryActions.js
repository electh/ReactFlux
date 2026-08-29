import { Message, Notification } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import Confetti from "canvas-confetti"

import {
  getOriginalContent,
  saveToThirdPartyServices,
  setEntriesStarred,
  updateEntriesStatus,
} from "@/apis"
import { polyglotState } from "@/hooks/useLanguage"
import { contentState, setActiveContent, setEntries } from "@/store/contentState"
import {
  setHistoryCount,
  setStarredCount,
  setUnreadInfo,
  setUnreadStarredCount,
  setUnreadTodayCount,
} from "@/store/dataState"
import { checkIsInLast24Hours } from "@/utils/date"

const updateEntries = (entries, updatedEntries) => {
  const updatedEntryIds = new Set(updatedEntries.map((entry) => entry.id))
  return entries.map((entry) => {
    if (updatedEntryIds.has(entry.id)) {
      const updatedEntry = updatedEntries.find((e) => e.id === entry.id)
      return updatedEntry || entry
    }
    return entry
  })
}

const handleEntriesStatusUpdate = (entries, newStatus) => {
  const feedCountChanges = {}
  let unreadStarredCountChange = 0
  let unreadTodayCountChange = 0
  const filteredEntries = entries.filter((entry) => entry.status !== newStatus)
  if (filteredEntries.length === 0) {
    return
  }

  if (newStatus === "read") {
    setHistoryCount((prev) => prev + filteredEntries.length)
  } else {
    setHistoryCount((prev) => Math.max(0, prev - filteredEntries.length))
  }

  for (const entry of filteredEntries) {
    const feedId = entry.feed.id
    const isRecent = checkIsInLast24Hours(entry.published_at)
    const statusDelta = newStatus === "read" ? -1 : 1

    feedCountChanges[feedId] = (feedCountChanges[feedId] ?? 0) + statusDelta
    unreadStarredCountChange += entry.starred ? statusDelta : 0
    unreadTodayCountChange += isRecent ? statusDelta : 0
  }

  setUnreadStarredCount((prev) => Math.max(0, prev + unreadStarredCountChange))
  setUnreadTodayCount((prev) => Math.max(0, prev + unreadTodayCountChange))

  setUnreadInfo((prev) => {
    const updatedInfo = { ...prev }
    for (const [feedId, change] of Object.entries(feedCountChanges)) {
      updatedInfo[feedId] = Math.max(0, (updatedInfo[feedId] ?? 0) + change)
    }
    return updatedInfo
  })

  const updatedEntries = filteredEntries.map((entry) => ({
    ...entry,
    status: newStatus,
  }))

  const { activeContent } = contentState.get()
  const activeEntry = updatedEntries.find((entry) => entry.id === activeContent?.id)
  if (activeEntry) {
    setActiveContent(activeEntry)
  }

  setEntries((prev) => updateEntries(prev, updatedEntries))
}

// Keeps duplicate-entry side effects out of the pure deduplication utility.
export const markDuplicatesAsRead = (duplicateEntries) => {
  const unreadDuplicateIds = duplicateEntries
    .filter(({ status }) => status === "unread")
    .map(({ id }) => id)

  if (unreadDuplicateIds.length === 0) {
    return
  }

  const { polyglot } = polyglotState.get()

  handleEntriesStatusUpdate(duplicateEntries, "read")
  updateEntriesStatus(unreadDuplicateIds, "read").catch(() => {
    Message.error(polyglot.t("deduplicate.mark_as_read_error"))
    handleEntriesStatusUpdate(duplicateEntries, "unread")
  })
}

const handleEntryStatusUpdate = (entry, newStatus) => {
  handleEntriesStatusUpdate([entry], newStatus)
}

const handleOpenLinkExternally = (entry) => {
  window.open(entry.url, "_blank")
}

const useEntryActions = () => {
  const { activeContent } = useStore(contentState)
  const { polyglot } = useStore(polyglotState)

  const handleEntryStarredUpdate = (entry, newStarred, shouldCelebrate = true) => {
    const starredCountChange = newStarred ? 1 : -1
    setStarredCount((prev) => Math.max(0, prev + starredCountChange))

    if (entry.status === "unread") {
      setUnreadStarredCount((prev) => Math.max(0, prev + starredCountChange))
    }

    if (newStarred && shouldCelebrate) {
      Confetti({
        particleCount: 100,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 1 },
      })
    }

    const updatedEntry = { ...entry, starred: newStarred }
    if (activeContent?.id === entry.id) {
      setActiveContent(updatedEntry)
    }
    setEntries((prev) => updateEntries(prev, [updatedEntry]))
  }

  const handleToggleStatus = async (entry) => {
    const prevStatus = entry.status
    const newStatus = prevStatus === "read" ? "unread" : "read"
    const updatedEntry = { ...entry, status: newStatus }
    handleEntryStatusUpdate(entry, newStatus)

    updateEntriesStatus([entry.id], newStatus).catch(() => {
      Message.error(
        newStatus === "read"
          ? polyglot.t("actions.mark_as_read_error")
          : polyglot.t("actions.mark_as_unread_error"),
      )
      handleEntryStatusUpdate(updatedEntry, prevStatus)
    })
  }

  const handleToggleStarred = async (entry) => {
    const newStarred = !entry.starred
    handleEntryStarredUpdate(entry, newStarred)

    try {
      await setEntriesStarred([entry.id], newStarred)

      if (!newStarred && contentState.get().infoFrom === "starred") {
        setEntries((prev) =>
          prev.filter((currentEntry) => currentEntry.id !== entry.id || currentEntry.starred),
        )
      }
    } catch {
      Message.error(
        newStarred ? polyglot.t("actions.star_error") : polyglot.t("actions.unstar_error"),
      )
      handleEntryStarredUpdate(entry, !newStarred, false)
    }
  }

  const handleFetchContent = async () => {
    try {
      const response = await getOriginalContent(activeContent.id)
      Message.success(polyglot.t("actions.fetched_content_success"))
      const newContent = response.content
      const newReadingTime = response.reading_time ?? activeContent.reading_time
      setActiveContent({ ...activeContent, content: newContent, readingTime: newReadingTime })
    } catch (error) {
      console.error("Failed to fetch content:", error)
      Message.error(polyglot.t("actions.fetched_content_error"))
    }
  }

  const handleSaveToThirdPartyServices = async (entry) => {
    try {
      const response = await saveToThirdPartyServices(entry.id)
      if (response.status === 202) {
        Notification.success({
          title: polyglot.t("actions.saved_to_third-party_services_success"),
        })
      } else {
        Notification.error({
          title: polyglot.t("actions.saved_to_third-party_services_error"),
        })
      }
    } catch (error) {
      console.error("Failed to save to third-party services:", error)
      Notification.error({
        title: polyglot.t("actions.saved_to_third-party_services_error"),
        content: error.message,
      })
    }
  }

  return {
    handleEntryStatusUpdate,
    handleFetchContent,
    handleOpenLinkExternally,
    handleSaveToThirdPartyServices,
    handleToggleStarred,
    handleToggleStatus,
  }
}

export default useEntryActions

import { Message, Notification } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import Confetti from "canvas-confetti"

import {
  getOriginalContent,
  saveToThirdPartyServices,
  toggleEntryStarred,
  updateEntriesStatus,
} from "@/apis"
import { polyglotState } from "@/hooks/useLanguage"
import { contentState, setActiveContent, setEntries, setOffset } from "@/store/contentState"
import {
  setHistoryCount,
  setStarredCount,
  setUnreadInfo,
  setUnreadTodayCount,
} from "@/store/dataState"
import { settingsState } from "@/store/settingsState"
import { checkIsInLast24Hours } from "@/utils/date"

const updateEntries = (entries, updatedEntries) => {
  const updatedEntryIds = updatedEntries.map((entry) => entry.id)
  return entries.map((entry) => {
    if (updatedEntryIds.includes(entry.id)) {
      const updatedEntry = updatedEntries.find((e) => e.id === entry.id)
      return updatedEntry || entry
    }
    return entry
  })
}

export const handleEntriesStatusUpdate = (entries, newStatus) => {
  const feedCountChanges = {}
  let unreadTodayCountChange = 0
  const filteredEntries = entries.filter((entry) => entry.status !== newStatus)
  if (filteredEntries.length === 0) {
    return
  }

  const { showStatus } = settingsState.get()
  if (newStatus === "read") {
    setHistoryCount((prev) => prev + filteredEntries.length)
    if (showStatus === "unread") {
      setOffset((prev) => prev - filteredEntries.length)
    }
  } else {
    setHistoryCount((prev) => Math.max(0, prev - filteredEntries.length))
    if (showStatus === "unread") {
      setOffset((prev) => prev + filteredEntries.length)
    }
  }

  for (const entry of filteredEntries) {
    const feedId = entry.feed.id
    const isRecent = checkIsInLast24Hours(entry.published_at)
    const statusDelta = newStatus === "read" ? -1 : 1

    feedCountChanges[feedId] = (feedCountChanges[feedId] ?? 0) + statusDelta
    unreadTodayCountChange += isRecent ? statusDelta : 0
  }

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

const useEntryActions = () => {
  const { activeContent } = useStore(contentState)
  const { polyglot } = useStore(polyglotState)

  const handleEntryStatusUpdate = (entry, newStatus) => {
    handleEntriesStatusUpdate([entry], newStatus)
  }

  const handleEntryStarredUpdate = (entry, newStarred) => {
    if (newStarred) {
      setStarredCount((prev) => prev + 1)
      Confetti({
        particleCount: 100,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 1 },
      })
    } else {
      setStarredCount((prev) => Math.max(0, prev - 1))
    }

    const updatedEntry = { ...entry, starred: newStarred }
    if (activeContent) {
      setActiveContent(updatedEntry)
    }
    setEntries((prev) => updateEntries(prev, [updatedEntry]))
  }

  const handleToggleStatus = async (entry) => {
    const prevStatus = entry.status
    const newStatus = prevStatus === "read" ? "unread" : "read"
    handleEntryStatusUpdate(entry, newStatus)

    updateEntriesStatus([entry.id], newStatus).catch(() => {
      Message.error(
        newStatus === "read"
          ? polyglot.t("actions.mark_as_read_error")
          : polyglot.t("actions.mark_as_unread_error"),
      )
      handleEntryStatusUpdate(entry, prevStatus)
    })
  }

  const handleToggleStarred = async (entry) => {
    const newStarred = !entry.starred
    handleEntryStarredUpdate(entry, newStarred)

    toggleEntryStarred(entry.id).catch(() => {
      Message.error(
        newStarred ? polyglot.t("actions.star_error") : polyglot.t("actions.unstar_error"),
      )
      handleEntryStarredUpdate(entry, !newStarred)
    })
  }

  const handleFetchContent = async () => {
    try {
      const response = await getOriginalContent(activeContent.id)
      Message.success(polyglot.t("actions.fetched_content_success"))
      setActiveContent({ ...activeContent, content: response.content })
    } catch (error) {
      console.error("Failed to fetch content: ", error)
      Message.error(polyglot.t("actions.fetched_content_error"))
    }
  }

  const handleSaveToThirdPartyServices = async () => {
    try {
      const response = await saveToThirdPartyServices(activeContent.id)
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
      console.error("Failed to save to third-party services: ", error)
      Notification.error({
        title: polyglot.t("actions.saved_to_third-party_services_error"),
        content: error.message,
      })
    }
  }

  const handleOpenLinkExternally = () => {
    window.open(activeContent.url, "_blank")
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

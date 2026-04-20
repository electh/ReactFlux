import Confetti from "canvas-confetti"

import {
  getOriginalContent,
  saveToThirdPartyServices,
  toggleEntryStarred,
  updateEntriesStatus,
} from "@/apis"
import { polyglotState } from "@/hooks/useLanguage"
import { contentState, setActiveContent, setEntries } from "@/store/contentState"
import {
  setHistoryCount,
  setStarredCount,
  setUnreadInfo,
  setUnreadTodayCount,
} from "@/store/dataState"
import { getSettings } from "@/store/settingsState"
import { AI_PROVIDERS, formatSummaryHtml, summarizeWithProvider } from "@/utils/ai"
import { checkIsInLast24Hours } from "@/utils/date"
import { extractTextFromHtml } from "@/utils/dom"
import { Message, Notification } from "@/utils/feedback"
import { parseCoverImage } from "@/utils/images"

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

export const handleEntriesStatusUpdate = (entries, newStatus) => {
  const feedCountChanges = {}
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

const handleEntryStatusUpdate = (entry, newStatus) => {
  handleEntriesStatusUpdate([entry], newStatus)
}

const handleOpenLinkExternally = (entry) => {
  window.open(entry.url, "_blank")
}

const handleEntryStarredUpdate = (entry, newStarred) => {
  const { activeContent } = contentState.get()
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
  if (activeContent?.id === entry.id) {
    setActiveContent(updatedEntry)
  }
  setEntries((prev) => updateEntries(prev, [updatedEntry]))
}

const handleToggleStatus = async (entry) => {
  const prevStatus = entry.status
  const newStatus = prevStatus === "read" ? "unread" : "read"
  handleEntryStatusUpdate(entry, newStatus)

  updateEntriesStatus([entry.id], newStatus).catch(() => {
    const { polyglot } = polyglotState.get()
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
    const { polyglot } = polyglotState.get()
    Message.error(
      newStarred ? polyglot.t("actions.star_error") : polyglot.t("actions.unstar_error"),
    )
    handleEntryStarredUpdate(entry, !newStarred)
  })
}

const updateEntryContent = (entry, updates) => {
  const updatedEntry = parseCoverImage({ ...entry, ...updates })
  const { activeContent } = contentState.get()

  if (activeContent?.id === entry.id) {
    setActiveContent(updatedEntry)
  }

  setEntries((prev) => updateEntries(prev, [updatedEntry]))
  return updatedEntry
}

const handleFetchContent = async (entry = contentState.get().activeContent) => {
  if (!entry) {
    return null
  }

  try {
    const response = await getOriginalContent(entry.id)
    const { polyglot } = polyglotState.get()
    Message.success(polyglot.t("actions.fetched_content_success"))
    const newContent = response.content
    const newReadingTime = response.reading_time ?? entry.reading_time
    return updateEntryContent(entry, { content: newContent, reading_time: newReadingTime })
  } catch (error) {
    console.error("Failed to fetch content:", error)
    const { polyglot } = polyglotState.get()
    Message.error(polyglot.t("actions.fetched_content_error"))
    return null
  }
}

const handleSummarizeContent = async (entry = contentState.get().activeContent) => {
  const aiProvider = getSettings("aiProvider")
  const aiApiKeys = getSettings("aiApiKeys") || {}
  const aiApiKey = aiApiKeys?.[aiProvider] || ""
  const aiModels = getSettings("aiModels") || {}
  const aiModel = aiModels?.[aiProvider] || ""
  const { polyglot } = polyglotState.get()

  if (!entry) {
    return null
  }

  if (aiProvider === AI_PROVIDERS.NONE) {
    Message.warning(polyglot.t("actions.ai_summary_provider_missing"))
    return null
  }

  if (!aiApiKey) {
    Message.warning(polyglot.t("actions.ai_summary_api_key_missing"))
    return null
  }

  if (!aiModel) {
    Message.warning(polyglot.t("actions.ai_summary_model_missing"))
    return null
  }

  const textContent = extractTextFromHtml(entry.content)
  if (!textContent) {
    Message.error(polyglot.t("actions.ai_summary_error"))
    return null
  }

  const trimmedContent = textContent.slice(0, 12_000)

  try {
    const startTime = performance.now()
    const summary = await summarizeWithProvider({
      provider: aiProvider,
      apiKey: aiApiKey,
      model: aiModel,
      title: entry.title,
      content: trimmedContent,
    })
    const elapsedSeconds = ((performance.now() - startTime) / 1000).toFixed(1)

    const summaryHtml = formatSummaryHtml(summary, polyglot.t("article_card.ai_summary_heading"))

    if (!summaryHtml) {
      Message.error(polyglot.t("actions.ai_summary_error"))
      return null
    }

    updateEntryContent(entry, { content: summaryHtml })
    Message.success(
      polyglot.t("actions.ai_summary_success", {
        model: aiModel,
        seconds: elapsedSeconds,
      }),
    )
    return summaryHtml
  } catch (error) {
    console.error("Failed to summarize content:", error)
    Message.error(polyglot.t("actions.ai_summary_error"))
    return null
  }
}

const handleSaveToThirdPartyServices = async (entry) => {
  const { polyglot } = polyglotState.get()
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

const useEntryActions = () => ({
  handleEntryStatusUpdate,
  handleFetchContent,
  handleOpenLinkExternally,
  handleSaveToThirdPartyServices,
  handleSummarizeContent,
  handleToggleStarred,
  handleToggleStatus,
})

export default useEntryActions

import { Message, Notification } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { batch } from "nanostores"

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
import { extractHeadings } from "@/utils/dom"
import {
  getEntryMutationSessionRevision,
  notifyEntryMutationIdle,
  recordEntryMutationIntent,
  recordEntryMutationRequestEnd,
  recordEntryMutationRequestStart,
  registerEntryMutationSessionReset,
} from "@/utils/entry-mutation-state"

const updateEntries = (entries, updatedEntries) => {
  const updatedEntriesById = new Map(updatedEntries.map((entry) => [entry.id, entry]))
  let hasChanges = false
  const nextEntries = entries.map((entry) => {
    const updatedEntry = updatedEntriesById.get(entry.id)
    if (updatedEntry) {
      hasChanges = true
      return updatedEntry
    }
    return entry
  })

  return hasChanges ? nextEntries : entries
}

const handleEntriesStatusUpdate = (entries, newStatus) => {
  const feedCountChanges = {}
  let unreadStarredCountChange = 0
  let unreadTodayCountChange = 0
  const filteredEntries = entries.filter((entry) => entry.status !== newStatus)
  if (filteredEntries.length === 0) {
    return
  }

  const statusDelta = newStatus === "read" ? -1 : 1
  for (const entry of filteredEntries) {
    const feedId = entry.feed.id
    const isRecent = checkIsInLast24Hours(entry.published_at)

    feedCountChanges[feedId] = (feedCountChanges[feedId] ?? 0) + statusDelta
    unreadStarredCountChange += entry.starred ? statusDelta : 0
    unreadTodayCountChange += isRecent ? statusDelta : 0
  }

  const updatedEntries = filteredEntries.map((entry) => ({
    ...entry,
    status: newStatus,
  }))
  const { activeContent } = contentState.get()
  const hasActiveEntry = updatedEntries.some((entry) => entry.id === activeContent?.id)

  batch(() => {
    if (newStatus === "read") {
      setHistoryCount((prev) => prev + filteredEntries.length)
    } else {
      setHistoryCount((prev) => Math.max(0, prev - filteredEntries.length))
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

    if (hasActiveEntry && activeContent?.status !== newStatus) {
      setActiveContent({ ...activeContent, status: newStatus })
    }
    setEntries((prev) => updateEntries(prev, updatedEntries))
  })
}

let nextStarMutationVersion = 0
let nextStatusMutationVersion = 0
const starMutationByEntryId = new Map()
const statusMutationByEntryId = new Map()

registerEntryMutationSessionReset(() => {
  starMutationByEntryId.clear()
  statusMutationByEntryId.clear()
})

const getCurrentEntry = (entryId, fallbackEntry, optimisticFields) => {
  const content = contentState.get()
  return (
    content.entries.find(({ id }) => id === entryId) ??
    (content.activeContent?.id === entryId
      ? content.activeContent
      : { ...fallbackEntry, ...optimisticFields })
  )
}

function startStatusMutationBatch(states, targetStatus) {
  const currentSessionRevision = getEntryMutationSessionRevision()
  const attempts = states
    .filter(
      (state) =>
        statusMutationByEntryId.get(state.entryId) === state &&
        state.sessionRevision === currentSessionRevision &&
        !state.inFlight &&
        state.desiredStatus === targetStatus &&
        state.confirmedStatus !== targetStatus,
    )
    .map((state) => {
      state.inFlight = true
      return { state, version: state.version }
    })

  if (attempts.length === 0) {
    return
  }

  const { sessionRevision } = attempts[0].state
  recordEntryMutationRequestStart(sessionRevision)
  void updateEntriesStatus(
    attempts.map(({ state }) => state.entryId),
    targetStatus,
  ).then(
    () => settleStatusMutationBatch(attempts, targetStatus, true),
    (error) => settleStatusMutationBatch(attempts, targetStatus, false, error),
  )
}

function settleStatusMutationBatch(attempts, targetStatus, succeeded, error) {
  const { sessionRevision } = attempts[0].state
  recordEntryMutationRequestEnd(sessionRevision)
  if (sessionRevision !== getEntryMutationSessionRevision()) {
    for (const { state } of attempts) {
      state.inFlight = false
    }
    notifyEntryMutationIdle(sessionRevision)
    return
  }

  const errorCallbacks = new Set()
  const nextStatesByStatus = new Map()
  const rollbackEntriesByStatus = new Map()

  for (const attempt of attempts) {
    const { state, version } = attempt
    if (statusMutationByEntryId.get(state.entryId) !== state || !state.inFlight) {
      continue
    }

    state.inFlight = false
    if (succeeded) {
      state.confirmedStatus = targetStatus
    } else if (state.version === version) {
      const rollbackEntry = getCurrentEntry(state.entryId, state.fallbackEntry, {
        status: targetStatus,
      })
      if (rollbackEntry.status !== state.confirmedStatus) {
        const rollbackEntries = rollbackEntriesByStatus.get(state.confirmedStatus) ?? []
        rollbackEntries.push(rollbackEntry)
        rollbackEntriesByStatus.set(state.confirmedStatus, rollbackEntries)
      }
      if (state.onError) {
        errorCallbacks.add(state.onError)
      }
      state.desiredStatus = state.confirmedStatus
    }

    if (state.desiredStatus === state.confirmedStatus) {
      statusMutationByEntryId.delete(state.entryId)
    } else {
      const nextStates = nextStatesByStatus.get(state.desiredStatus) ?? []
      nextStates.push(state)
      nextStatesByStatus.set(state.desiredStatus, nextStates)
    }
  }

  for (const [rollbackStatus, rollbackEntries] of rollbackEntriesByStatus) {
    handleEntriesStatusUpdate(rollbackEntries, rollbackStatus)
  }
  for (const onError of errorCallbacks) {
    onError(error)
  }
  for (const [nextStatus, nextStates] of nextStatesByStatus) {
    startStatusMutationBatch(nextStates, nextStatus)
  }
  notifyEntryMutationIdle(sessionRevision)
}

export const updateEntriesStatusOptimistically = (entries, newStatus, onError) => {
  const entriesById = new Map(
    entries.filter((entry) => entry.status !== newStatus).map((entry) => [entry.id, entry]),
  )
  const optimisticEntries = [...entriesById.values()]
  if (optimisticEntries.length === 0) {
    return
  }

  const sessionRevision = recordEntryMutationIntent()
  const version = ++nextStatusMutationVersion
  const statesToStart = []
  for (const entry of optimisticEntries) {
    let state = statusMutationByEntryId.get(entry.id)
    if (state) {
      state.desiredStatus = newStatus
      state.fallbackEntry = entry
      state.onError = onError
      state.version = version
    } else {
      state = {
        confirmedStatus: entry.status,
        desiredStatus: newStatus,
        entryId: entry.id,
        fallbackEntry: entry,
        inFlight: false,
        onError,
        sessionRevision,
        version,
      }
      statusMutationByEntryId.set(entry.id, state)
    }

    if (state.inFlight) {
      continue
    }
    if (state.desiredStatus === state.confirmedStatus) {
      statusMutationByEntryId.delete(state.entryId)
    } else {
      statesToStart.push(state)
    }
  }

  handleEntriesStatusUpdate(optimisticEntries, newStatus)
  startStatusMutationBatch(statesToStart, newStatus)
}

// Keeps duplicate-entry side effects out of the pure deduplication utility.
export const markDuplicatesAsRead = (duplicateEntries) => {
  const unreadDuplicateEntries = duplicateEntries.filter(({ status }) => status === "unread")
  if (unreadDuplicateEntries.length === 0) {
    return
  }

  const { polyglot } = polyglotState.get()
  void updateEntriesStatusOptimistically(unreadDuplicateEntries, "read", () => {
    Message.error(polyglot.t("deduplicate.mark_as_read_error"))
  })
}

export const markEntriesAsRead = (entries) => {
  const requestedEntriesById = new Map(entries.map((entry) => [entry.id, entry]))
  const content = contentState.get()
  const currentEntriesById = new Map(content.entries.map((entry) => [entry.id, entry]))
  const unreadEntries = [...requestedEntriesById.values()]
    .map(
      (entry) =>
        currentEntriesById.get(entry.id) ??
        (content.activeContent?.id === entry.id ? content.activeContent : entry),
    )
    .filter(({ status }) => status === "unread")
  if (unreadEntries.length === 0) {
    return
  }

  void updateEntriesStatusOptimistically(unreadEntries, "read", () => {
    const { polyglot } = polyglotState.get()
    Message.error(polyglot.t("actions.mark_as_read_error"))
  })
}

const handleOpenLinkExternally = (entry) => {
  window.open(entry.url, "_blank")
}

const handleEntryStarredUpdate = (entry, newStarred) => {
  const starredCountChange = newStarred ? 1 : -1
  setStarredCount((prev) => Math.max(0, prev + starredCountChange))

  if (entry.status === "unread") {
    setUnreadStarredCount((prev) => Math.max(0, prev + starredCountChange))
  }

  const updatedEntry = { ...entry, starred: newStarred }
  const currentActiveContent = contentState.get().activeContent
  if (currentActiveContent?.id === entry.id) {
    setActiveContent({ ...currentActiveContent, starred: newStarred })
  }
  setEntries((prev) => updateEntries(prev, [updatedEntry]))
}

const removeUnstarredEntryFromStarredList = (entryId) => {
  if (contentState.get().infoFrom === "starred") {
    setEntries((prev) =>
      prev.filter((currentEntry) => currentEntry.id !== entryId || currentEntry.starred),
    )
  }
}

function startStarMutation(state) {
  const currentSessionRevision = getEntryMutationSessionRevision()
  if (
    starMutationByEntryId.get(state.entryId) !== state ||
    state.sessionRevision !== currentSessionRevision ||
    state.inFlight ||
    state.desiredStarred === state.confirmedStarred
  ) {
    return
  }

  const { desiredStarred: targetStarred, sessionRevision, version } = state
  state.inFlight = true
  recordEntryMutationRequestStart(sessionRevision)
  void setEntriesStarred([state.entryId], targetStarred).then(
    () => settleStarMutation(state, version, targetStarred, true),
    (error) => settleStarMutation(state, version, targetStarred, false, error),
  )
}

function settleStarMutation(state, version, targetStarred, succeeded, error) {
  recordEntryMutationRequestEnd(state.sessionRevision)
  if (state.sessionRevision !== getEntryMutationSessionRevision()) {
    state.inFlight = false
    notifyEntryMutationIdle(state.sessionRevision)
    return
  }
  if (starMutationByEntryId.get(state.entryId) !== state || !state.inFlight) {
    notifyEntryMutationIdle(state.sessionRevision)
    return
  }

  state.inFlight = false
  if (succeeded) {
    state.confirmedStarred = targetStarred
  } else if (state.version === version) {
    const rollbackEntry = getCurrentEntry(state.entryId, state.fallbackEntry, {
      starred: targetStarred,
    })
    if (rollbackEntry.starred !== state.confirmedStarred) {
      handleEntryStarredUpdate(rollbackEntry, state.confirmedStarred)
    }
    state.desiredStarred = state.confirmedStarred
    state.onError?.(error)
  }

  if (state.desiredStarred === state.confirmedStarred) {
    starMutationByEntryId.delete(state.entryId)
    if (!state.confirmedStarred) {
      removeUnstarredEntryFromStarredList(state.entryId)
    }
  } else {
    startStarMutation(state)
  }
  notifyEntryMutationIdle(state.sessionRevision)
}

const updateEntryStarredOptimistically = (entry, newStarred, onError) => {
  const sessionRevision = recordEntryMutationIntent()
  let state = starMutationByEntryId.get(entry.id)
  const version = ++nextStarMutationVersion
  if (state) {
    state.desiredStarred = newStarred
    state.fallbackEntry = entry
    state.onError = onError
    state.version = version
  } else {
    state = {
      confirmedStarred: entry.starred,
      desiredStarred: newStarred,
      entryId: entry.id,
      fallbackEntry: entry,
      inFlight: false,
      onError,
      sessionRevision,
      version,
    }
    starMutationByEntryId.set(entry.id, state)
  }

  handleEntryStarredUpdate(entry, newStarred)
  if (state.inFlight) {
    return
  }
  if (state.desiredStarred === state.confirmedStarred) {
    starMutationByEntryId.delete(state.entryId)
  } else {
    startStarMutation(state)
  }
}

const useEntryActions = () => {
  const { polyglot } = useStore(polyglotState)

  const handleToggleStatus = (entry) => {
    const newStatus = entry.status === "read" ? "unread" : "read"
    void updateEntriesStatusOptimistically([entry], newStatus, () => {
      Message.error(
        newStatus === "read"
          ? polyglot.t("actions.mark_as_read_error")
          : polyglot.t("actions.mark_as_unread_error"),
      )
    })
  }

  const handleToggleStarred = (entry) => {
    const newStarred = !entry.starred
    updateEntryStarredOptimistically(entry, newStarred, () => {
      Message.error(
        newStarred ? polyglot.t("actions.star_error") : polyglot.t("actions.unstar_error"),
      )
    })
  }

  const handleFetchContent = async () => {
    const { activeContent } = contentState.get()
    if (!activeContent) {
      return
    }

    try {
      const { content: newContent, reading_time: readingTime } = await getOriginalContent(
        activeContent.id,
      )
      const currentActiveContent = contentState.get().activeContent
      if (currentActiveContent?.id !== activeContent.id) {
        return
      }

      Message.success(polyglot.t("actions.fetched_content_success"))
      const newReadingTime = readingTime ?? currentActiveContent.reading_time
      setActiveContent({
        ...currentActiveContent,
        content: newContent,
        headings: extractHeadings(newContent),
        reading_time: newReadingTime,
      })
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
    handleFetchContent,
    handleOpenLinkExternally,
    handleSaveToThirdPartyServices,
    handleToggleStarred,
    handleToggleStatus,
  }
}

export default useEntryActions

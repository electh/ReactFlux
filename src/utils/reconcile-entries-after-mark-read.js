const reconcileEntriesAfterMarkRead = (entries, markedIds, showStatus) => {
  const markedIdSet = new Set(markedIds)
  if (markedIdSet.size === 0) {
    return entries
  }

  if (showStatus === "unread") {
    const remainingEntries = entries.filter((entry) => !markedIdSet.has(entry.id))
    return remainingEntries.length === entries.length ? entries : remainingEntries
  }

  let hasUpdatedEntries = false
  const reconciledEntries = entries.map((entry) => {
    if (!markedIdSet.has(entry.id) || entry.status === "read") {
      return entry
    }

    hasUpdatedEntries = true
    return { ...entry, status: "read" }
  })

  return hasUpdatedEntries ? reconciledEntries : entries
}

export default reconcileEntriesAfterMarkRead

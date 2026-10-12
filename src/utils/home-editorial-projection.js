const isValidEntityId = (value) => Number.isSafeInteger(value) && value > 0

const uniqueById = (entries) => {
  const seen = new Set()
  return entries.filter((entry) => {
    if (entry?.id === undefined || entry?.id === null || seen.has(entry.id)) {
      return false
    }
    seen.add(entry.id)
    return true
  })
}

const sourceId = (entry) => (isValidEntityId(entry?.feed?.id) ? entry.feed.id : null)
const categoryId = (entry) =>
  isValidEntityId(entry?.feed?.category?.id) ? entry.feed.category.id : null

const hasUsableImage = (entry) => {
  if (
    Array.isArray(entry?.coverCandidates) &&
    entry.coverCandidates.some((candidate) => candidate?.src)
  ) {
    return true
  }
  return typeof entry?.coverSource === "string" && entry.coverSource.trim().length > 0
}

const timestamp = (entry) => {
  const value = Date.parse(entry?.published_at)
  return Number.isNaN(value) ? Number.NEGATIVE_INFINITY : value
}

const compareId = (left, right) => {
  const leftNumber = Number(left.id)
  const rightNumber = Number(right.id)
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber !== rightNumber) {
    return leftNumber - rightNumber
  }
  return String(left.id).localeCompare(String(right.id))
}

const isNewDiversity = (candidateId, representedIds) =>
  candidateId !== null && !representedIds.has(candidateId)

const compareCandidates = (left, right, represented) => {
  const leftSource = isNewDiversity(sourceId(left), represented.sources)
  const rightSource = isNewDiversity(sourceId(right), represented.sources)
  if (leftSource !== rightSource) {
    return leftSource ? -1 : 1
  }

  const leftCategory = isNewDiversity(categoryId(left), represented.categories)
  const rightCategory = isNewDiversity(categoryId(right), represented.categories)
  if (leftCategory !== rightCategory) {
    return leftCategory ? -1 : 1
  }

  const recencyDifference = timestamp(right) - timestamp(left)
  if (recencyDifference !== 0 && !Number.isNaN(recencyDifference)) {
    return recencyDifference
  }

  const imageDifference = Number(hasUsableImage(right)) - Number(hasUsableImage(left))
  if (imageDifference !== 0) {
    return imageDifference
  }
  return compareId(left, right)
}

const representedBy = (entries) => ({
  sources: new Set(entries.map((entry) => sourceId(entry)).filter((id) => id !== null)),
  categories: new Set(entries.map((entry) => categoryId(entry)).filter((id) => id !== null)),
})

const eligibleUnreadEntries = (entries) =>
  uniqueById(entries.filter((entry) => entry?.status === "unread"))

export const selectInitialHighlightIds = (entries, { maxHighlights = 3 } = {}) => {
  const candidates = eligibleUnreadEntries(entries)
  const maximum = Number.isFinite(maxHighlights) ? Math.max(0, Math.floor(maxHighlights)) : 3
  if (maximum === 0 || candidates.length === 0) {
    return []
  }

  const primary = [...candidates].toSorted(
    (left, right) => timestamp(right) - timestamp(left) || compareId(left, right),
  )[0]
  const selected = [primary]
  while (selected.length < maximum && selected.length < candidates.length) {
    const represented = representedBy(selected)
    const remaining = candidates.filter(
      (candidate) => !selected.some(({ id }) => id === candidate.id),
    )
    selected.push(
      remaining.toSorted((left, right) => compareCandidates(left, right, represented))[0],
    )
  }
  return selected.map(({ id }) => id)
}

export const selectBackfillCandidate = (recentEntries, survivingHighlights) => {
  const survivingIds = new Set(survivingHighlights.map(({ id }) => id))
  const candidates = eligibleUnreadEntries(recentEntries).filter(({ id }) => !survivingIds.has(id))
  if (candidates.length === 0) {
    return null
  }
  const represented = representedBy(survivingHighlights)
  return candidates.toSorted((left, right) => compareCandidates(left, right, represented))[0]
}

export const projectRecentEntries = (entries, highlightIds) => {
  const highlightedIds = new Set(highlightIds)
  return uniqueById(entries).filter(({ id }) => !highlightedIds.has(id))
}

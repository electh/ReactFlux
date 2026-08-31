export const HOME_PAGE_VIEWS = ["all", "today", "starred", "history"]
export const DEFAULT_HOME_TARGET = Object.freeze({ type: "view", id: "all" })

const HOME_PAGE_VIEW_SET = new Set(HOME_PAGE_VIEWS)
const MAX_SERVER_LENGTH = 2048

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value)

const isValidEntityId = (value) => Number.isSafeInteger(value) && value > 0

const normalizeHomeServer = (value) => {
  if (typeof value !== "string" || value.length > MAX_SERVER_LENGTH) {
    return null
  }

  try {
    const url = new URL(value.trim())
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      return null
    }

    const pathname = url.pathname.replace(/\/+$/u, "")
    return `${url.protocol}//${url.host}${pathname}`
  } catch {
    return null
  }
}

export const createHomeIdentity = (server, userId) => {
  const normalizedServer = normalizeHomeServer(server)
  if (!normalizedServer || !isValidEntityId(userId)) {
    return null
  }

  return { server: normalizedServer, userId }
}

export const getHomeIdentityKey = (identity) =>
  identity ? JSON.stringify([identity.server, identity.userId]) : ""

const normalizeHomeTarget = (value) => {
  if (!isObject(value)) {
    return null
  }

  if (value.type === "view" && HOME_PAGE_VIEW_SET.has(value.id)) {
    return { type: "view", id: value.id }
  }
  if ((value.type === "category" || value.type === "feed") && isValidEntityId(value.id)) {
    return { type: value.type, id: value.id }
  }

  return null
}

const sanitizeHomeTarget = (value, fallback = DEFAULT_HOME_TARGET) => {
  const target = normalizeHomeTarget(value)
  if (target || fallback === null) {
    return target
  }

  return normalizeHomeTarget(fallback) ?? { ...DEFAULT_HOME_TARGET }
}

export const createDefaultHomePages = () => ({
  legacyMigrated: false,
  entries: [],
})

export const sanitizeHomePages = (value, fallback = createDefaultHomePages()) => {
  const source = isObject(value) ? value : fallback
  const entries = Array.isArray(source?.entries) ? source.entries : []
  const entriesByIdentity = new Map()

  for (const entry of entries) {
    if (!isObject(entry)) {
      continue
    }

    const identity = createHomeIdentity(entry.server, entry.userId)
    if (!identity) {
      continue
    }

    const target = sanitizeHomeTarget(entry.target, null)
    if (!target) {
      continue
    }

    entriesByIdentity.set(getHomeIdentityKey(identity), { ...identity, target })
  }

  return {
    legacyMigrated: source?.legacyMigrated === true,
    entries: [...entriesByIdentity.values()],
  }
}

export const createViewHomeTarget = (id) => sanitizeHomeTarget({ type: "view", id })

export const createEntityHomeTarget = (type, id) => sanitizeHomeTarget({ type, id })

export const isSameHomeTarget = (first, second) =>
  Boolean(first && second && first.type === second.type && first.id === second.id)

export const getHomeTargetKey = (target) => (target ? `${target.type}:${target.id}` : "")

export const getHomeTargetPath = (target) => {
  const sanitizedTarget = sanitizeHomeTarget(target)
  return sanitizedTarget.type === "view"
    ? `/${sanitizedTarget.id}`
    : `/${sanitizedTarget.type}/${sanitizedTarget.id}`
}

export const getHomeTargetForIdentity = (homePages, identity, legacyHomePage = "all") => {
  if (!identity) {
    return { ...DEFAULT_HOME_TARGET }
  }

  const sanitizedHomePages = sanitizeHomePages(homePages)
  const identityKey = getHomeIdentityKey(identity)
  const entry = sanitizedHomePages.entries.find(
    (candidate) => getHomeIdentityKey(candidate) === identityKey,
  )

  if (entry) {
    return { ...entry.target }
  }

  if (!sanitizedHomePages.legacyMigrated) {
    return createViewHomeTarget(legacyHomePage)
  }

  return { ...DEFAULT_HOME_TARGET }
}

export const setHomeTargetForIdentity = (homePages, identity, target) => {
  if (!identity) {
    return sanitizeHomePages(homePages)
  }

  const sanitizedHomePages = sanitizeHomePages(homePages)
  const identityKey = getHomeIdentityKey(identity)
  const nextEntry = { ...identity, target: sanitizeHomeTarget(target) }
  const entries = sanitizedHomePages.entries.filter(
    (entry) => getHomeIdentityKey(entry) !== identityKey,
  )

  entries.push(nextEntry)
  return sanitizeHomePages({ legacyMigrated: true, entries })
}

export const ensureHomeIdentity = (homePages, identity, legacyHomePage = "all") => {
  if (!identity) {
    return sanitizeHomePages(homePages)
  }

  const target = getHomeTargetForIdentity(homePages, identity, legacyHomePage)
  const sanitizedHomePages = sanitizeHomePages(homePages)
  const identityKey = getHomeIdentityKey(identity)
  const hasIdentity = sanitizedHomePages.entries.some(
    (entry) => getHomeIdentityKey(entry) === identityKey,
  )

  if (hasIdentity && sanitizedHomePages.legacyMigrated) {
    return sanitizedHomePages
  }

  return setHomeTargetForIdentity(sanitizedHomePages, identity, target)
}

export const isHomeTargetInCatalog = (target, feeds, categories) => {
  const sanitizedTarget = sanitizeHomeTarget(target)
  if (sanitizedTarget.type === "view") {
    return true
  }

  const entities = sanitizedTarget.type === "feed" ? feeds : categories
  return Array.isArray(entities) && entities.some((entity) => entity.id === sanitizedTarget.id)
}

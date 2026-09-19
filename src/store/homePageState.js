import { computed } from "nanostores"

import { authState } from "@/store/authState"
import { dataState, visibleCategoriesState, visibleFeedsState } from "@/store/dataState"
import { settingsState, updateSettings } from "@/store/settingsState"
import {
  createHomeIdentity,
  DEFAULT_HOME_TARGET,
  ensureHomeIdentity,
  getHomeIdentityKey,
  getHomeTargetForIdentity,
  getHomeTargetPath,
  isHomeTargetInCatalog,
  isSameHomeTarget,
  setHomeTargetForIdentity,
} from "@/utils/home-page"

export const homeIdentityState = computed([authState, dataState], (auth, data) =>
  createHomeIdentity(auth.server, data.currentUser?.id),
)

export const currentHomeTargetState = computed(
  [settingsState, homeIdentityState],
  (settings, identity) => getHomeTargetForIdentity(settings.homePages, identity, settings.homePage),
)

const getCurrentHomeIdentity = () => homeIdentityState.get()

export const getCurrentHomeTarget = () => currentHomeTargetState.get()

export const getCurrentHomePath = () => {
  if (!getCurrentHomeIdentity()) {
    return null
  }

  const target = getCurrentHomeTarget()
  const targetIsVisible = isHomeTargetInCatalog(
    target,
    visibleFeedsState.get(),
    visibleCategoriesState.get(),
  )
  return targetIsVisible ? getHomeTargetPath(target) : "/all"
}

export const ensureCurrentHomePage = () => {
  const identity = getCurrentHomeIdentity()
  if (!identity) {
    return false
  }

  const settings = settingsState.get()
  const identityKey = getHomeIdentityKey(identity)
  const hasCurrentIdentity = settings.homePages.entries.some(
    (entry) => getHomeIdentityKey(entry) === identityKey,
  )
  if (settings.homePages.legacyMigrated && hasCurrentIdentity) {
    return false
  }

  updateSettings({
    homePage: "all",
    homePages: ensureHomeIdentity(settings.homePages, identity, settings.homePage),
  })
  return true
}

export const setCurrentHomeTarget = (target) => {
  const identity = getCurrentHomeIdentity()
  if (!identity) {
    return false
  }

  const settings = settingsState.get()
  updateSettings({
    homePage: "all",
    homePages: setHomeTargetForIdentity(settings.homePages, identity, target),
  })
  return true
}

export const resetCurrentHomeTarget = () => setCurrentHomeTarget(DEFAULT_HOME_TARGET)

export const resetCurrentHomeTargetIfMatches = (target) => {
  if (!isSameHomeTarget(getCurrentHomeTarget(), target)) {
    return false
  }

  return resetCurrentHomeTarget()
}

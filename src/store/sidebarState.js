import { persistentAtom } from "@nanostores/persistent"

import {
  decodeDesktopSidebarCollapsed,
  decodeExpandedCategories,
  encodeDesktopSidebarCollapsed,
  encodeExpandedCategories,
  sanitizeExpandedCategories,
} from "@/utils/sidebar-schema"

export const desktopSidebarCollapsedState = persistentAtom("desktopSidebarCollapsed", false, {
  encode: encodeDesktopSidebarCollapsed,
  decode: decodeDesktopSidebarCollapsed,
})

export const expandedCategoriesState = persistentAtom("expandedCategories", [], {
  encode: encodeExpandedCategories,
  decode: decodeExpandedCategories,
})

export const toggleDesktopSidebar = () => {
  desktopSidebarCollapsedState.set(!desktopSidebarCollapsedState.get())
}

export const setExpandedCategories = (keys) => {
  expandedCategoriesState.set(sanitizeExpandedCategories(keys))
}

export const replaceExpandedCategories = (keys) => {
  setExpandedCategories(keys)
}

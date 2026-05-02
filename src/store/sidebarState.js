import { persistentAtom } from "@nanostores/persistent"

import sanitizeExpandedCategories from "@/utils/settingsTransfer/sidebar-config"

export const expandedCategoriesState = persistentAtom("expandedCategories", [], {
  encode: JSON.stringify,
  decode: (value) => sanitizeExpandedCategories(JSON.parse(value)),
})

export const setExpandedCategories = (keys) => {
  expandedCategoriesState.set(sanitizeExpandedCategories(keys))
}

export const replaceExpandedCategories = (keys) =>
  expandedCategoriesState.set(sanitizeExpandedCategories(keys))

export { sanitizeExpandedCategories } from "@/utils/settingsTransfer/sidebar-config"

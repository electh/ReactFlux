import { persistentAtom } from "@nanostores/persistent"

import {
  decodeExpandedCategories,
  encodeExpandedCategories,
  sanitizeExpandedCategories,
} from "@/utils/sidebar-schema"

export const expandedCategoriesState = persistentAtom("expandedCategories", [], {
  encode: encodeExpandedCategories,
  decode: decodeExpandedCategories,
})

export const setExpandedCategories = (keys) => {
  expandedCategoriesState.set(sanitizeExpandedCategories(keys))
}

export const replaceExpandedCategories = (keys) => {
  setExpandedCategories(keys)
}

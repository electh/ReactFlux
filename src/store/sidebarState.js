import { persistentAtom } from "@nanostores/persistent"

export const expandedCategoriesState = persistentAtom("expandedCategories", [], {
  encode: JSON.stringify,
  decode: JSON.parse,
})

export const setExpandedCategories = (keys) => {
  expandedCategoriesState.set(keys)
}

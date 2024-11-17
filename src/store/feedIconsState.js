import { map } from "nanostores"

export const defaultIcon = { url: null, width: null, height: null }
export const feedIconsState = map({ 0: defaultIcon })

export const updateFeedIcon = (id, feedIconChanges) =>
  feedIconsState.setKey(id, { ...feedIconsState.get()[id], ...feedIconChanges })
export const resetFeedIcons = () => feedIconsState.set({ 0: defaultIcon })

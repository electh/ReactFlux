import { computed } from "nanostores"

export const shallowEqual = (left, right) => {
  if (Object.is(left, right)) {
    return true
  }
  if (!left || !right || typeof left !== "object" || typeof right !== "object") {
    return false
  }

  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key) => Object.hasOwn(right, key) && Object.is(left[key], right[key]))
  )
}

export const selectStore = (store, selector, isEqual = Object.is) => {
  let hasSelection = false
  let selection

  return computed(store, (value) => {
    const nextSelection = selector(value)
    if (hasSelection && isEqual(selection, nextSelection)) {
      return selection
    }

    hasSelection = true
    selection = nextSelection
    return selection
  })
}

const createSetter =
  (store, key = null) =>
  (updater) => {
    const state = store.get()

    if (typeof state === "object" && state !== null) {
      if (key === null) {
        return
      }

      const nextValue = typeof updater === "function" ? updater(state[key]) : updater
      if (!Object.is(state[key], nextValue)) {
        store.set({ ...state, [key]: nextValue })
      }
    } else {
      const nextValue = typeof updater === "function" ? updater(state) : updater
      if (!Object.is(state, nextValue)) {
        store.set(nextValue)
      }
    }
  }

export default createSetter

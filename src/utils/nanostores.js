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

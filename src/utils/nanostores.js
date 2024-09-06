export const createSetter =
  (store, key = null) =>
  (updater) => {
    const state = store.get();

    if (typeof state === "object" && state !== null) {
      if (key === null) {
        return;
      }
      if (typeof updater === "function") {
        store.set({ ...state, [key]: updater(state[key]) });
      } else {
        store.set({ ...state, [key]: updater });
      }
    } else if (typeof updater === "function") {
      store.set(updater(state));
    } else {
      store.set(updater);
    }
  };

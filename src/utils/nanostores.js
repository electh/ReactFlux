export const createSetter = (store, key) => (updater) => {
  const state = store.get();
  if (typeof updater === "function") {
    store.set({ ...state, [key]: updater(state[key]) });
  } else {
    store.set({ ...state, [key]: updater });
  }
};

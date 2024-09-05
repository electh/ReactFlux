export const createSetter = (state, key) => (updater) => {
  if (typeof updater === "function") {
    state[key] = updater(state[key]);
  } else {
    state[key] = updater;
  }
};

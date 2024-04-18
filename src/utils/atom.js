import { atom } from "jotai";

export const atomWithLocalStorage = (key, initialValue) => {
  const getInitialValue = () => {
    const item = localStorage.getItem(key);
    if (item !== null) {
      return JSON.parse(item);
    }
    return initialValue;
  };
  const baseAtom = atom(getInitialValue());

  return atom(
    (get) => get(baseAtom),
    (get, set, update) => {
      const nextValue =
        typeof update === "function" ? update(get(baseAtom)) : update;
      set(baseAtom, nextValue);
      localStorage.setItem(key, JSON.stringify(nextValue));
    },
  );
};

export const atomWithRefreshAndDefault = (refreshAtom, getDefault) => {
  const stateAtom = atom({ refresh: null, value: null });

  return atom(
    (get) => {
      const { refresh, value } = get(stateAtom);
      const currentRefresh = get(refreshAtom);

      if (value !== null && refresh === currentRefresh) {
        return value;
      }
      return getDefault(get);
    },
    (get, set, update) => {
      let newValue;
      const { refresh, value } = get(stateAtom);
      const currentRefresh = get(refreshAtom);
      const isCurrent = value !== null && refresh === currentRefresh;

      if (typeof update === "function") {
        newValue = update(isCurrent ? value : getDefault(get));
      } else {
        newValue = update;
      }

      set(stateAtom, { refresh: currentRefresh, value: newValue });
    },
  );
};

import { atom } from "jotai";

export const atomWithLocalStorage = (key, defaultValue) => {
  const getStoredValue = () => {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : defaultValue;
  };
  const baseAtom = atom(getStoredValue());

  return atom(
    (get) => get(baseAtom),
    (get, set, update) => {
      const newValue =
        typeof update === "function" ? update(get(baseAtom)) : update;
      set(baseAtom, newValue);
      localStorage.setItem(key, JSON.stringify(newValue));
    },
  );
};

export const atomWithRefreshAndDefault = (refreshAtom, getDefaultValue) => {
  const stateAtom = atom({ refresh: null, value: null });

  return atom(
    (get) => {
      const { refresh, value } = get(stateAtom);
      const currentRefresh = get(refreshAtom);

      if (value !== null && refresh === currentRefresh) {
        return value;
      }
      return getDefaultValue(get);
    },
    (get, set, update) => {
      let newValue;
      const { refresh, value } = get(stateAtom);
      const currentRefresh = get(refreshAtom);
      const isCurrent = value !== null && refresh === currentRefresh;

      if (typeof update === "function") {
        newValue = update(isCurrent ? value : getDefaultValue(get));
      } else {
        newValue = update;
      }

      set(stateAtom, { refresh: currentRefresh, value: newValue });
    },
  );
};

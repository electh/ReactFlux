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

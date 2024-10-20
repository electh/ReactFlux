import { persistentAtom } from "@nanostores/persistent";
import { computed } from "nanostores";
import { createSetter } from "../utils/nanostores";

const defaultValue = {
  exitDetailView: ["esc"],
  fetchOriginalArticle: ["d"],
  navigateToNextArticle: ["n", "j", "right"],
  navigateToNextUnreadArticle: ["shift+n", "shift+j", "ctrl+right"],
  navigateToPreviousArticle: ["p", "k", "left"],
  navigateToPreviousUnreadArticle: ["shift+p", "shift+k", "ctrl+left"],
  openLinkExternally: ["v"],
  openPhotoSlider: ["i"],
  saveToThirdPartyServices: ["s"],
  showHotkeysSettings: ["shift+?"],
  toggleReadStatus: ["m"],
  toggleStarStatus: ["f"],
};

export const hotkeysState = persistentAtom("hotkeys", defaultValue, {
  encode: (value) => {
    const filteredValue = Object.keys(value).reduce((acc, key) => {
      if (key in defaultValue) {
        acc[key] = value[key];
      }
      return acc;
    }, {});
    return JSON.stringify(filteredValue);
  },
  decode: (str) => {
    const storedValue = JSON.parse(str);
    return { ...defaultValue, ...storedValue };
  },
});

export const duplicateHotkeysState = computed(hotkeysState, (hotkeys) => {
  const allKeys = Object.values(hotkeys).flat();
  const keyCount = allKeys.reduce((acc, key) => {
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(keyCount)
    .filter(([_key, count]) => count > 1)
    .map(([key]) => key);
});

export const updateHotkey = (action, keys) => {
  const setter = createSetter(hotkeysState, action);
  setter(keys);
};
export const resetHotkey = (action) =>
  updateHotkey(action, defaultValue[action]);

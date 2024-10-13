import { persistentAtom } from "@nanostores/persistent";
import { computed } from "nanostores";
import { createSetter } from "../utils/nanostores";

const defaultValue = {
  exitDetailView: ["esc"],
  fetchOriginalArticle: ["d"],
  navigateToNextArticle: ["n", "j", "right"],
  navigateToNextUnreadArticle: ["N", "J", "ctrl+right"],
  navigateToPreviousArticle: ["p", "k", "left"],
  navigateToPreviousUnreadArticle: ["P", "K", "ctrl+left"],
  openLinkExternally: ["v"],
  openPhotoSlider: ["i"],
  saveToThirdPartyServices: ["s"],
  toggleReadStatus: ["m"],
  toggleStarStatus: ["f"],
};

export const hotkeysState = persistentAtom("hotkeys", defaultValue, {
  encode: JSON.stringify,
  decode: JSON.parse,
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

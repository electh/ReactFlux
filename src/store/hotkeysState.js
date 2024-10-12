import { persistentAtom } from "@nanostores/persistent";
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

export const updateHotkey = (action, keys) => {
  const setter = createSetter(hotkeysState, action);
  setter(keys);
};
export const resetHotkey = (action) =>
  updateHotkey(action, defaultValue[action]);

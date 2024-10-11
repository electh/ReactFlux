import { persistentAtom } from "@nanostores/persistent";

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

export const getHotkeys = (key) => hotkeysState.get()[key];

export const updateHotkeys = (hotkeysChanges) =>
  hotkeysState.set({ ...hotkeysState.get(), ...hotkeysChanges });

export const resetHotkeys = () => hotkeysState.set(defaultValue);

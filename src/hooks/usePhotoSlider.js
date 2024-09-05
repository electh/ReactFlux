import { proxy, useSnapshot } from "valtio";
import { createSetter } from "../utils/valtio";

const state = proxy({ isPhotoSliderVisible: false, selectedIndex: 0 });

const setIsPhotoSliderVisible = createSetter(state, "isPhotoSliderVisible");
const setSelectedIndex = createSetter(state, "selectedIndex");

export const usePhotoSlider = () => {
  const { isPhotoSliderVisible, selectedIndex } = useSnapshot(state);

  return {
    isPhotoSliderVisible,
    setIsPhotoSliderVisible,
    selectedIndex,
    setSelectedIndex,
  };
};

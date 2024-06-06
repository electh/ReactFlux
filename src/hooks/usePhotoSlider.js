import { atom, useAtom } from "jotai";

const isPhotoSliderVisibleAtom = atom(false);
const selectedIndexAtom = atom(0);

export const usePhotoSlider = () => {
  const [isPhotoSliderVisible, setIsPhotoSliderVisible] = useAtom(
    isPhotoSliderVisibleAtom,
  );
  const [selectedIndex, setSelectedIndex] = useAtom(selectedIndexAtom);

  return {
    isPhotoSliderVisible,
    setIsPhotoSliderVisible,
    selectedIndex,
    setSelectedIndex,
  };
};

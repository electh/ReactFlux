import { useStore } from "@nanostores/react"
import { map } from "nanostores"

import createSetter from "@/utils/nanostores"

const state = map({ isPhotoSliderVisible: false, selectedIndex: 0 })

const setIsPhotoSliderVisible = createSetter(state, "isPhotoSliderVisible")
const setSelectedIndex = createSetter(state, "selectedIndex")

const usePhotoSlider = () => {
  const { isPhotoSliderVisible, selectedIndex } = useStore(state)

  return {
    isPhotoSliderVisible,
    setIsPhotoSliderVisible,
    selectedIndex,
    setSelectedIndex,
  }
}

export default usePhotoSlider

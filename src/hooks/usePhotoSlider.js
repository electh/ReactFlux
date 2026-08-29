import { useStore } from "@nanostores/react"
import { map } from "nanostores"

import createSetter from "@/utils/nanostores"

const state = map({
  isPhotoSliderCloseRequested: false,
  isPhotoSliderClosing: false,
  isPhotoSliderVisible: false,
  selectedIndex: 0,
})

const setSelectedIndex = createSetter(state, "selectedIndex")

const updatePhotoSliderState = (updates) => {
  state.set({ ...state.get(), ...updates })
}

const openPhotoSlider = (index) => {
  updatePhotoSliderState({
    isPhotoSliderCloseRequested: false,
    isPhotoSliderClosing: false,
    isPhotoSliderVisible: true,
    selectedIndex: index,
  })
}

const requestPhotoSliderClose = () => {
  const { isPhotoSliderCloseRequested, isPhotoSliderClosing, isPhotoSliderVisible } = state.get()
  if (!isPhotoSliderVisible || isPhotoSliderClosing || isPhotoSliderCloseRequested) {
    return
  }

  updatePhotoSliderState({ isPhotoSliderCloseRequested: true })
}

const markPhotoSliderClosing = () => {
  updatePhotoSliderState({
    isPhotoSliderCloseRequested: false,
    isPhotoSliderClosing: true,
  })
}

const completePhotoSliderClose = () => {
  updatePhotoSliderState({
    isPhotoSliderCloseRequested: false,
    isPhotoSliderClosing: false,
    isPhotoSliderVisible: false,
  })
}

const usePhotoSlider = () => {
  const { isPhotoSliderCloseRequested, isPhotoSliderVisible, selectedIndex } = useStore(state)

  return {
    completePhotoSliderClose,
    isPhotoSliderCloseRequested,
    isPhotoSliderVisible,
    markPhotoSliderClosing,
    openPhotoSlider,
    requestPhotoSliderClose,
    selectedIndex,
    setSelectedIndex,
  }
}

export default usePhotoSlider

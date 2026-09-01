import { useStore } from "@nanostores/react"
import { map } from "nanostores"

import createSetter from "@/utils/nanostores"

const state = map({
  isPhotoSliderCloseRequested: false,
  isPhotoSliderClosing: false,
  isPhotoSliderVisible: false,
  photoSliderSessionId: 0,
  selectedIndex: 0,
})

const setSelectedIndex = createSetter(state, "selectedIndex")

const updatePhotoSliderState = (updates) => {
  state.set({ ...state.get(), ...updates })
}

const openPhotoSlider = (index) => {
  const { photoSliderSessionId: currentSessionId } = state.get()

  updatePhotoSliderState({
    isPhotoSliderCloseRequested: false,
    isPhotoSliderClosing: false,
    isPhotoSliderVisible: true,
    photoSliderSessionId: currentSessionId + 1,
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
  const { isPhotoSliderCloseRequested, isPhotoSliderVisible, photoSliderSessionId, selectedIndex } =
    useStore(state)

  return {
    completePhotoSliderClose,
    isPhotoSliderCloseRequested,
    isPhotoSliderVisible,
    markPhotoSliderClosing,
    openPhotoSlider,
    photoSliderSessionId,
    requestPhotoSliderClose,
    selectedIndex,
    setSelectedIndex,
  }
}

export default usePhotoSlider

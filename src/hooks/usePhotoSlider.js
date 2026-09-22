import { useStore } from "@nanostores/react"
import { map } from "nanostores"

import createSetter from "@/utils/nanostores"

const createDefaultPhotoSliderState = (photoSliderSessionId = 0) => ({
  isPhotoSliderCloseRequested: false,
  isPhotoSliderClosing: false,
  isPhotoSliderVisible: false,
  photoSliderSessionId,
  selectedIndex: 0,
})

const state = map(createDefaultPhotoSliderState())

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

const resetPhotoSlider = () => {
  // Preserve the monotonic session id so stale tooltip state cannot match a later lightbox session.
  state.set(createDefaultPhotoSliderState(state.get().photoSliderSessionId))
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
    resetPhotoSlider,
    selectedIndex,
    setSelectedIndex,
  }
}

export default usePhotoSlider

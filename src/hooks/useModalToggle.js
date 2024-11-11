import { useStore } from "@nanostores/react"
import { map } from "nanostores"

import createSetter from "@/utils/nanostores"

const state = map({
  addFeedModalVisible: false,
  settingsModalVisible: false,
  settingsTabsActiveTab: "1",
})

const setAddFeedModalVisible = createSetter(state, "addFeedModalVisible")
const setSettingsModalVisible = createSetter(state, "settingsModalVisible")
const setSettingsTabsActiveTab = createSetter(state, "settingsTabsActiveTab")

const useModalToggle = () => {
  const { addFeedModalVisible, settingsModalVisible, settingsTabsActiveTab } = useStore(state)

  return {
    addFeedModalVisible,
    setAddFeedModalVisible,
    settingsModalVisible,
    setSettingsModalVisible,
    settingsTabsActiveTab,
    setSettingsTabsActiveTab,
  }
}

export default useModalToggle

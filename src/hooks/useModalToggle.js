import { proxy, useSnapshot } from "valtio";
import { createSetter } from "../utils/valtio";

const state = proxy({
  addFeedModalVisible: false,
  settingsModalVisible: false,
});

const setAddFeedModalVisible = createSetter(state, "addFeedModalVisible");
const setSettingsModalVisible = createSetter(state, "settingsModalVisible");

export const useModalToggle = () => {
  const { addFeedModalVisible, settingsModalVisible } = useSnapshot(state);

  return {
    addFeedModalVisible,
    setAddFeedModalVisible,
    settingsModalVisible,
    setSettingsModalVisible,
  };
};

import { useStore } from "@nanostores/react";
import { map } from "nanostores";
import { createSetter } from "../utils/nanostores";

const state = map({
  addFeedModalVisible: false,
  settingsModalVisible: false,
});

const setAddFeedModalVisible = createSetter(state, "addFeedModalVisible");
const setSettingsModalVisible = createSetter(state, "settingsModalVisible");

export const useModalToggle = () => {
  const { addFeedModalVisible, settingsModalVisible } = useStore(state);

  return {
    addFeedModalVisible,
    setAddFeedModalVisible,
    settingsModalVisible,
    setSettingsModalVisible,
  };
};

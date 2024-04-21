import { atom, useAtom } from "jotai";

const addFeedModalVisibleAtom = atom(false);
const settingsModalVisibleAtom = atom(false);

export const useModalToggle = () => {
  const [addFeedModalVisible, setAddFeedModalVisible] = useAtom(
    addFeedModalVisibleAtom,
  );
  const [settingsModalVisible, setSettingsModalVisible] = useAtom(
    settingsModalVisibleAtom,
  );

  return {
    addFeedModalVisible,
    setAddFeedModalVisible,
    settingsModalVisible,
    setSettingsModalVisible,
  };
};

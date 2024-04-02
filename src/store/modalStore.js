import { create } from "zustand";

const useModalStore = create((set) => ({
  newFeedVisible: false,
  editFeedVisible: false,
  deleteFeedVisible: false,
  editCategoryVisible: false,
  modalLoading: false,
  activeFeed: null,
  activeCategory: null,
  settingsVisible: false,
  setNewFeedVisible: (value) => {
    set({ newFeedVisible: value });
  },
  setEditFeedVisible: (value) => {
    set({ editFeedVisible: value });
  },
  setDeleteFeedVisible: (value) => {
    set({ deleteFeedVisible: value });
  },
  setEditCategoryVisible: (value) => {
    set({ editCategoryVisible: value });
  },
  setModalLoading: (value) => {
    set({ modalLoading: value });
  },
  setActiveFeed: (value) => {
    set({ activeFeed: value });
  },
  setActiveCategory: (value) => {
    set({ activeCategory: value });
  },
  setSettingsVisible: (value) => {
    set({ settingsVisible: value });
  },
}));

export { useModalStore };

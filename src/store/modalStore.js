import { create } from "zustand";

const useModalStore = create((set) => ({
  newFeedVisible: false,
  editFeedVisible: false,
  deleteFeedVisible: false,
  editCategoryVisible: false,
  modalLoading: false,
  activeFeed: null,
  activeCategory: null,
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
}));

export { useModalStore };

import { create } from "zustand";

const useModalStore = create((set) => ({
  newFeedVisible: false,
  editFeedVisible: false,
  deleteFeedVisible: false,
  newCategoryVisible: false,
  modalLoading: false,
  setNewFeedVisible: (value) => {
    set({ newFeedVisible: value });
  },
  setEditFeedVisible: (value) => {
    set({ editFeedVisible: value });
  },
  setDeleteFeedVisible: (value) => {
    set({ deleteFeedVisible: value });
  },
  setNewCategoryVisible: (value) => {
    set({ newCategoryVisible: value });
  },
  setModalLoading: (value) => {
    set({ modalLoading: value });
  },
}));

export { useModalStore };

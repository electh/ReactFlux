import { create } from "zustand";

const useModalStore = create((set) => ({
  newFeedVisible: false,
  editFeedVisible: false,
  deleteFeedVisible: false,
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
  setModalLoading: (value) => {
    set({ modalLoading: value });
  },
}));

export { useModalStore };

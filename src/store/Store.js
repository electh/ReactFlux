import { create } from "zustand";
import {
  getCategories,
  getEntries,
  getFeeds,
  toggleEntryBookmark,
  updateEntries,
} from "../api/api";
import Confetti from "canvas-confetti";
import { Message } from "@arco-design/web-react";

const getFirstImage = (entry) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(entry.content, "text/html");
  const firstImg = doc.querySelector("img");
  if (firstImg) {
    entry.imgSrc = firstImg.getAttribute("src");
  }
  return entry;
};

const useStore = create((set) => ({
  collapsed: window.innerWidth <= 700,
  loading: false,
  entries: [],
  feeds: [],
  categories: [],
  isDarkMode:
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  activeEntry: null,
  isMobile: window.innerWidth <= 700,
  setIsMobile: (value) => set({ isMobile: value }),
  filterString: "",
  unreadOnly: false,
  searchType: "title",
  offset: 0,
  setOffset: (value) => set({ offset: value }),
  showEntries: [],
  setShowEntries: (value) => set({ showEntries: value }),
  setCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
  setEntries: (value) => set({ entries: value }),
  setIsDarkMode: (value) => set({ isDarkMode: value }),
  setActiveEntry: (entry) => {
    console.log(entry);
    set({ activeEntry: entry });
  },
  setFilterString: (value) => set({ filterString: value }),
  setUnreadOnly: () => set((state) => ({ unreadOnly: !state.unreadOnly })),
  setSearchType: () =>
    set((state) => ({
      searchType: state.searchType === "title" ? "content" : "title",
    })),
  initData: async () => {
    set({ loading: true });
    try {
      const [entriesResp, feedsResp, categoriesResp] = await Promise.all([
        getEntries(),
        getFeeds(),
        getCategories(),
      ]);
      set({
        entries: entriesResp?.data.entries.map((entry) => getFirstImage(entry)),
        feeds: feedsResp?.data,
        categories: categoriesResp?.data,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      set({ loading: false });
    }
  },
  toggleStar: async (entry) => {
    const resp = await toggleEntryBookmark(entry);
    if (resp?.status === 204) {
      set((state) => ({
        // activeEntry: { ...entry, starred: !entry.starred },
        entries: state.entries.map((a) => {
          return a.id === entry.id ? { ...a, starred: !entry.starred } : a;
        }),
        showEntries: state.showEntries.map((a) => {
          return a.id === entry.id ? { ...a, starred: !entry.starred } : a;
        }),
      }));
      !entry.starred &&
        Confetti({
          particleCount: 100,
          angle: 220,
          spread: 70,
          origin: { x: 1, y: 0 },
        });
    }
  },
  toggleUnreadStatus: async (entry) => {
    const newStatus = entry.status === "unread" ? "read" : "unread";
    const resp = await updateEntries(entry.id, newStatus);
    if (resp?.status === 204) {
      set((state) => ({
        // activeEntry: {
        //   ...entry,
        //   status: newStatus,
        // },
        entries: state.entries.map((a) => {
          return a.id === entry.id ? { ...a, status: newStatus } : a;
        }),
        showEntries: state.showEntries.map((a) => {
          return a.id === entry.id ? { ...a, status: newStatus } : a;
        }),
      }));
      Message.success(newStatus.toUpperCase());
    }
  },
  clickCard: async (entry) => {
    set((state) => ({
      // activeEntry: { ...entry, status: "read" },
      entries: state.entries.map((a) => {
        return a.id === entry.id ? { ...a, status: "read" } : a;
      }),
      showEntries: state.showEntries.map((a) => {
        return a.id === entry.id ? { ...a, status: "read" } : a;
      }),
    }));
    if (entry.status === "unread") {
      await updateEntries(entry.id, "read");
    }
  },
}));

export { useStore };

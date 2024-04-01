import { create } from "zustand";

import {
  getFeeds,
  getGroups,
  getHistoryEntries,
  getStarredEntries,
  getTodayEntries,
  getUnreadInfo,
} from "./apis";
import { getConfig } from "./utils/config";

const calculateUnreadCount = (prevCount, status) => {
  if (status === "read") {
    return Math.max(0, prevCount - 1);
  }
  return prevCount + 1;
};

const updateUnreadCount = (items, itemId, countOrStatus) => {
  return items.map((item) => {
    if (item.id === itemId) {
      let newUnreadCount;

      if (typeof countOrStatus === "string") {
        newUnreadCount = calculateUnreadCount(item.unreadCount, countOrStatus);
      } else {
        newUnreadCount = countOrStatus;
      }

      return {
        ...item,
        unreadCount: newUnreadCount,
      };
    }
    return item;
  });
};

const useStore = create((set, get) => ({
  feeds: [],
  groups: [],
  unreadTotal: 0,
  unreadToday: 0,
  starredCount: 0,
  readCount: 0,
  hiddenFeedIds: [],
  hiddenGroupIds: [],
  showStatus: getConfig("showStatus"),
  homePage: getConfig("homePage"),
  orderBy: getConfig("orderBy"),
  orderDirection: getConfig("orderDirection"),
  pageSize: getConfig("pageSize"),
  showAllFeeds: getConfig("showAllFeeds"),
  loading: true,
  visible: {
    settings: false,
    addFeed: false,
  },
  theme: getConfig("theme"),
  layout: getConfig("layout"),
  fontSize: getConfig("fontSize"),
  showFeedIcon: getConfig("showFeedIcon"),
  collapsed: window.innerWidth <= 992,
  activeContent: null,
  isSysDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
  themeColor: getConfig("themeColor"),
  isInitCompleted: false,

  setFeeds: (value) => set({ feeds: value }),
  setGroups: (value) => set({ groups: value }),
  setUnreadTotal: (updater) =>
    set((state) => ({ unreadTotal: updater(state.unreadTotal) })),
  setUnreadToday: (updater) =>
    set((state) => ({ unreadToday: updater(state.unreadToday) })),
  setStarredCount: (updater) =>
    set((state) => ({ starredCount: updater(state.starredCount) })),
  setReadCount: (updater) =>
    set((state) => ({ readCount: updater(state.readCount) })),
  setShowStatus: (value) => set({ showStatus: value }),
  setHomePage: (value) => set({ homePage: value }),
  setOrderBy: (value) => set({ orderBy: value }),
  setOrderDirection: (value) => set({ orderDirection: value }),
  setPageSize: (value) => set({ pageSize: value }),
  toggleShowAllFeeds: () =>
    set((state) => ({ showAllFeeds: !state.showAllFeeds })),
  setActiveContent: (activeContent) => {
    set({ activeContent: activeContent });
  },
  setIsSysDarkMode: (value) => set({ isSysDarkMode: value }),
  setThemeColor: (value) => {
    set({ themeColor: value });
  },
  setTheme: (value) => {
    set({ theme: value });
  },

  initData: async () => {
    set({ loading: true });
    const [
      feedResponse,
      groupResponse,
      historyResponse,
      starredResponse,
      todayUnreadResponse,
      unreadResponse,
    ] = await Promise.all([
      getFeeds(),
      getGroups(),
      getHistoryEntries(),
      getStarredEntries(),
      getTodayEntries(0, "unread"),
      getUnreadInfo(),
    ]);

    if (
      feedResponse &&
      groupResponse &&
      historyResponse &&
      starredResponse &&
      todayUnreadResponse &&
      unreadResponse
    ) {
      const hiddenFeedIds = feedResponse.data
        .filter((feed) => feed.hide_globally || feed.category.hide_globally)
        .map((feed) => feed.id);
      const hiddenGroupIds = groupResponse.data
        .filter((group) => group.hide_globally)
        .map((group) => group.id);

      set({ hiddenFeedIds });
      set({ hiddenGroupIds });

      const unreadInfo = unreadResponse.data.unreads;

      const unreadTotal = Object.keys(unreadInfo).reduce((acc, id) => {
        if (
          get().showAllFeeds ||
          !hiddenFeedIds.includes(Number.parseInt(id))
        ) {
          return acc + unreadInfo[id];
        }
        return acc;
      }, 0);

      set({ unreadTotal });

      const feedsWithUnread = feedResponse.data.map((feed) => ({
        ...feed,
        unreadCount: unreadInfo[feed.id] || 0,
      }));

      set({
        feeds: feedsWithUnread.sort((a, b) =>
          a.title.localeCompare(b.title, "en"),
        ),
      });

      const groupsWithUnread = groupResponse.data.map((group) => {
        let unreadCount = 0;
        let feedCount = 0;

        for (const feed of feedsWithUnread) {
          if (feed.category.id === group.id) {
            unreadCount += feed.unreadCount;
            feedCount += 1;
          }
        }

        return { ...group, unreadCount, feedCount };
      });

      set({
        groups: groupsWithUnread.sort((a, b) =>
          a.title.localeCompare(b.title, "en"),
        ),
      });

      set({ readCount: historyResponse.data.total });
      set({ starredCount: starredResponse.data.total });
      set({ unreadToday: todayUnreadResponse.data.total });
      set({ isInitCompleted: true });
      set({ loading: false });
    }
  },

  updateFeedUnreadCount: (feedId, countOrStatus) => {
    set((state) => ({
      feeds: updateUnreadCount(state.feeds, feedId, countOrStatus),
    }));
  },

  updateGroupUnreadCount: (groupId, countOrStatus) => {
    set((state) => ({
      groups: updateUnreadCount(state.groups, groupId, countOrStatus),
    }));
  },

  toggleLayout: () => {
    const newLayout = get().layout === "large" ? "small" : "large";
    set({ layout: newLayout });
  },

  setFontSize: (sizeStr) => set({ fontSize: sizeStr }),

  toggleShowFeedIcon: () =>
    set((state) => ({ showFeedIcon: !state.showFeedIcon })),

  setVisible: (modalName, visible) => {
    set((state) => ({ visible: { ...state.visible, [modalName]: visible } }));
  },

  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
}));

export default useStore;

import { create } from "zustand";

import {
  getFeeds,
  getGroups,
  getHistoryEntries,
  getStarredEntries,
  getTodayEntries,
  getUnreadInfo,
} from "./apis";
import { applyColor } from "./utils/Colors";
import { getConfig, setConfig } from "./utils/Config";

const calculateUnread = (currentUnread, status) => {
  if (status === "read") {
    return Math.max(0, currentUnread - 1);
  }
  return currentUnread + 1;
};

const updateUnreadCount = (items, itemId, status) => {
  return items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          unread: calculateUnread(item.unread, status),
        }
      : item,
  );
};

const useStore = create((set, get) => ({
  feeds: [],
  groups: [],
  unreadTotal: 0,
  unreadToday: 0,
  starredCount: 0,
  readCount: 0,
  loading: true,
  visible: {
    settings: false,
    addFeed: false,
  },
  theme: getConfig("theme") || "light",
  layout: getConfig("layout") || "large",
  fontSize: getConfig("fontSize") || 1.05,
  showFeedIcon: getConfig("showFeedIcon") || true,
  collapsed: window.innerWidth <= 992,
  activeContent: null,

  setUnreadTotal: (unreadTotal) => {
    set({ unreadTotal: unreadTotal });
  },
  setUnreadToday: (unreadToday) => {
    set({ unreadToday: unreadToday });
  },
  setStarredCount: (starredCount) => {
    set({ starredCount: starredCount });
  },
  setReadCount: (readCount) => {
    set({ readCount: readCount });
  },
  setActiveContent: (activeContent) => {
    set({ activeContent: activeContent });
  },

  initData: async () => {
    set({ loading: true });
    const [
      feedResponse,
      groupResponse,
      unreadResponse,
      historyResponse,
      starredResponse,
      todayUnreadResponse,
    ] = await Promise.all([
      getFeeds(),
      getGroups(),
      getUnreadInfo(),
      getHistoryEntries(),
      getStarredEntries(),
      getTodayEntries(0, "unread"),
    ]);

    if (
      feedResponse &&
      unreadResponse &&
      groupResponse &&
      historyResponse &&
      starredResponse &&
      todayUnreadResponse
    ) {
      const unreadInfo = unreadResponse.data.unreads;
      const unreadTotal = Object.values(unreadInfo).reduce(
        (acc, cur) => acc + cur,
        0,
      );

      set({ unreadTotal });

      const feedsWithUnread = feedResponse.data.map((feed) => ({
        ...feed,
        unread: unreadInfo[feed.id] || 0,
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
            unreadCount += feed.unread;
            feedCount += 1;
          }
        }

        return {
          ...group,
          unread: unreadCount,
          feed: feedCount,
        };
      });

      set({
        groups: groupsWithUnread.sort((a, b) =>
          a.title.localeCompare(b.title, "en"),
        ),
      });

      set({ readCount: historyResponse.data.total });
      set({ starredCount: starredResponse.data.total });
      set({ unreadToday: todayUnreadResponse.data.total });
      set({ loading: false });
    }
  },

  updateFeedUnread: (feedId, status) => {
    set((state) => ({
      feeds: updateUnreadCount(state.feeds, feedId, status),
    }));
  },

  updateGroupUnread: (groupId, status) => {
    set((state) => ({
      groups: updateUnreadCount(state.groups, groupId, status),
    }));
  },

  toggleTheme: () => {
    const newTheme = get().theme === "dark" ? "light" : "dark";
    set({ theme: newTheme });
    setConfig("theme", newTheme);
    if (newTheme === "dark") {
      document.body.setAttribute("arco-theme", "dark");
      document.body.style.colorScheme = "dark";
    } else {
      document.body.removeAttribute("arco-theme");
      document.body.style.colorScheme = "light";
    }
    applyColor(getConfig("themeColor") || "Blue");
  },

  toggleLayout: () => {
    const newLayout = get().layout === "large" ? "small" : "large";
    set({ layout: newLayout });
    setConfig("layout", newLayout);
  },

  setFontSize: (sizeStr) => {
    set({ fontSize: sizeStr });
    setConfig("fontSize", sizeStr);
  },

  setShowFeedIcon: (showFeedIcon) => {
    set({ showFeedIcon: showFeedIcon });
    setConfig("showFeedIcon", showFeedIcon);
  },

  setVisible: (modalName, visible) => {
    set((state) => ({ visible: { ...state.visible, [modalName]: visible } }));
  },

  setCollapsed: (collapsed) => {
    set({ collapsed: collapsed });
  },
}));

export default useStore;

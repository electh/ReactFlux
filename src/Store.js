import _ from "lodash";
import { create } from "zustand";

import { getFeeds, getGroups, getUnreadInfo } from "./apis";
import { applyColor } from "./utils/Colors";
import { getConfig, setConfig } from "./utils/Config";

export const useStore = create((set, get) => ({
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
  collapsed: false,

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

  initData: async () => {
    set({ loading: true });
    const feedResponse = await getFeeds();
    const groupResponse = await getGroups();
    const unreadResponse = await getUnreadInfo();

    if (feedResponse && unreadResponse && groupResponse) {
      const unreadInfo = unreadResponse.data.unreads;
      const unreadTotal = Object.values(unreadInfo).reduce(
        (acc, cur) => acc + cur,
        0,
      );
      const feedsWithUnread = feedResponse.data.map((feed) => ({
        ...feed,
        unread: unreadInfo[feed.id] || 0,
      }));

      const groupsWithUnread = groupResponse.data.map((group) => {
        let unreadCount = 0;
        let feedCount = 0;

        feedsWithUnread.forEach((feed) => {
          if (feed.category.id === group.id) {
            unreadCount += feed.unread;
            feedCount += 1;
          }
        });

        return {
          ...group,
          unread: unreadCount,
          feed: feedCount,
        };
      });

      set({ feeds: _.orderBy(feedsWithUnread, ["title"], ["asc"]) });
      set({ groups: _.orderBy(groupsWithUnread, ["title"], ["asc"]) });
      set({ unreadTotal });
      set({ loading: false });
    }
  },

  updateFeedUnread: (feedId, status) => {
    set((state) => {
      const updatedFeeds = state.feeds.map((feed) =>
        feed.id === feedId
          ? {
              ...feed,
              unread:
                status === "read"
                  ? Math.max(0, feed.unread - 1)
                  : feed.unread + 1,
            }
          : feed,
      );
      return { feeds: updatedFeeds };
    });
  },

  updateGroupUnread: (groupId, status) => {
    set((state) => {
      const updatedGroups = state.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              unread:
                status === "read"
                  ? Math.max(0, group.unread - 1)
                  : group.unread + 1,
            }
          : group,
      );
      return { groups: updatedGroups };
    });
  },

  toggleTheme: () => {
    const newTheme = get().theme === "dark" ? "light" : "dark";
    set({ theme: newTheme });
    setConfig("theme", newTheme);
    if (newTheme === "dark") {
      document.body.setAttribute("arco-theme", "dark");
    } else {
      document.body.removeAttribute("arco-theme");
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

  setVisible: (modalName, visible) => {
    set((state) => ({ visible: { ...state.visible, [modalName]: visible } }));
  },

  setCollapsed: (collapsed) => {
    set({ collapsed: collapsed });
  },
}));

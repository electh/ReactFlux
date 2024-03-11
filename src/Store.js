import _ from "lodash";
import { create } from "zustand";
import { getFeeds, getGroups, getUnreadInfo } from "./apis";

export const useStore = create((set, get) => ({
  feeds: [],
  groups: [],
  loading: true,
  visible: {
    settings: false,
    addFeed: false,
  },
  theme: localStorage.getItem("theme") || "light",
  collapsed: false,
  initData: async () => {
    set({ loading: true });
    const feedResponse = await getFeeds();
    const groupResponse = await getGroups();
    const unreadResponse = await getUnreadInfo();

    if (feedResponse && unreadResponse && groupResponse) {
      const unreadInfo = unreadResponse.data.unreads;
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
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.body.setAttribute("arco-theme", "dark");
    } else {
      document.body.removeAttribute("arco-theme");
    }
  },

  setVisible: (modalName, visible) => {
    set((state) => ({ visible: { ...state.visible, [modalName]: visible } }));
  },

  setCollapsed: (collapsed) => {
    set({ collapsed });
  },
}));

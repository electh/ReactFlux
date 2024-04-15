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

const updateHidden = (items, itemId, hidden) => {
  return items.map((item) => {
    if (item.id === itemId) {
      return {
        ...item,
        hide_globally: hidden,
      };
    }
    return item;
  });
};

const updateHiddenIds = (hiddenIds, id, hidden) => {
  return hidden
    ? [...hiddenIds, id]
    : hiddenIds.filter((hiddenId) => hiddenId !== id);
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
  loading: true,
  visible: {
    settings: false,
    addFeed: false,
  },
  collapsed: window.innerWidth <= 992,
  activeContent: null,
  isSysDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
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
  setActiveContent: (activeContent) => {
    set({ activeContent: activeContent });
  },
  setIsSysDarkMode: (value) => set({ isSysDarkMode: value }),

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

      const showAllFeeds = getConfig("showAllFeeds");
      const unreadTotal = Object.keys(unreadInfo).reduce((acc, id) => {
        if (showAllFeeds || !hiddenFeedIds.includes(Number.parseInt(id))) {
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

  updateFeedHidden: (feedId, hidden) => {
    set((state) => {
      let { unreadTotal } = state;
      const showAllFeeds = getConfig("showAllFeeds");
      if (!showAllFeeds) {
        const feed = state.feeds.find((f) => f.id === feedId);
        if (feed) {
          unreadTotal += hidden ? -feed.unreadCount : feed.unreadCount;
          unreadTotal = Math.max(0, unreadTotal);
        }
      }

      return {
        feeds: updateHidden(state.feeds, feedId, hidden),
        hiddenFeedIds: updateHiddenIds(state.hiddenFeedIds, feedId, hidden),
        unreadTotal,
      };
    });
  },

  updateGroupHidden: (groupId, hidden) => {
    set((state) => {
      let { unreadTotal } = state;
      let updatedHiddenFeedIds = [...state.hiddenFeedIds];

      const showAllFeeds = getConfig("showAllFeeds");
      if (!showAllFeeds) {
        const group = state.groups.find((g) => g.id === groupId);
        if (group) {
          unreadTotal += hidden ? -group.unreadCount : group.unreadCount;
          unreadTotal = Math.max(0, unreadTotal);
        }
      }

      const feedIdsInGroup = state.feeds
        .filter((feed) => feed.category.id === groupId)
        .map((feed) => feed.id);

      updatedHiddenFeedIds = hidden
        ? [...updatedHiddenFeedIds, ...feedIdsInGroup]
        : updatedHiddenFeedIds.filter((id) => !feedIdsInGroup.includes(id));

      return {
        groups: updateHidden(state.groups, groupId, hidden),
        hiddenGroupIds: updateHiddenIds(state.hiddenGroupIds, groupId, hidden),
        hiddenFeedIds: updatedHiddenFeedIds,
        unreadTotal,
      };
    });
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

  setVisible: (modalName, visible) => {
    set((state) => ({ visible: { ...state.visible, [modalName]: visible } }));
  },

  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
}));

export default useStore;

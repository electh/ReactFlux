import { computed, map } from "nanostores";
import { createSetter } from "../utils/nanostores";
import { settingsState } from "./settingsState";

const defaultValue = {
  isAppDataReady: false,
  unreadInfo: {},
  unreadTodayCount: 0,
  starredCount: 0,
  historyCount: 0,
  feedsData: [],
  categoriesData: [],
  isVersionAtLeast2_2_0: false,
};

export const dataState = map(defaultValue);

export const feedsState = computed(dataState, (data) => {
  const { unreadInfo, feedsData } = data;
  const feedsWithUnread = feedsData.map((feed) => ({
    ...feed,
    unreadCount: unreadInfo[feed.id] ?? 0,
  }));

  return feedsWithUnread.sort((a, b) => a.title.localeCompare(b.title, "en"));
});

export const categoriesState = computed(
  [dataState, feedsState],
  (data, feeds) => {
    const { categoriesData } = data;
    const categoriesWithUnread = categoriesData.map((category) => {
      const feedsInCategory = feeds.filter(
        (feed) => feed.category.id === category.id,
      );
      return {
        ...category,
        unreadCount: feedsInCategory.reduce(
          (acc, feed) => acc + (feed.unreadCount ?? 0),
          0,
        ),
        feedCount: feedsInCategory.length,
      };
    });

    return categoriesWithUnread.sort((a, b) =>
      a.title.localeCompare(b.title, "en"),
    );
  },
);

export const hiddenCategoryIdsState = computed(
  categoriesState,
  (categories) => {
    return categories
      .filter((category) => category.hide_globally)
      .map((category) => category.id);
  },
);

export const hiddenFeedIdsState = computed(
  [feedsState, hiddenCategoryIdsState],
  (feeds, hiddenCategoryIds) => {
    return feeds
      .filter(
        (feed) =>
          feed.hide_globally || hiddenCategoryIds.includes(feed.category.id),
      )
      .map((feed) => feed.id);
  },
);

export const filteredFeedsState = computed(
  [feedsState, hiddenFeedIdsState, settingsState],
  (feeds, hiddenFeedIds, settings) => {
    const { showAllFeeds } = settings;
    return feeds.filter(
      (feed) => showAllFeeds || !hiddenFeedIds.includes(feed.id),
    );
  },
);

export const filteredCategoriesState = computed(
  [categoriesState, hiddenCategoryIdsState, settingsState],
  (categories, hiddenCategoryIds, settings) => {
    const { showAllFeeds } = settings;
    return categories.filter(
      (category) => showAllFeeds || !hiddenCategoryIds.includes(category.id),
    );
  },
);

export const feedsGroupedByIdState = computed(
  filteredFeedsState,
  (filteredFeeds) => {
    return filteredFeeds.reduce((groupedFeeds, feed) => {
      const { id } = feed.category;
      if (!groupedFeeds[id]) {
        groupedFeeds[id] = [];
      }
      groupedFeeds[id].push(feed);
      return groupedFeeds;
    }, {});
  },
);

export const unreadTotalState = computed(
  [dataState, filteredFeedsState],
  (data, filteredFeeds) => {
    const { unreadInfo } = data;
    return Object.entries(unreadInfo).reduce((acc, [id, count]) => {
      if (filteredFeeds.some((feed) => feed.id === Number(id))) {
        return acc + count;
      }
      return acc;
    }, 0);
  },
);

export const setCategoriesData = createSetter(dataState, "categoriesData");
export const setFeedsData = createSetter(dataState, "feedsData");
export const setHistoryCount = createSetter(dataState, "historyCount");
export const setIsAppDataReady = createSetter(dataState, "isAppDataReady");
export const setStarredCount = createSetter(dataState, "starredCount");
export const setUnreadInfo = createSetter(dataState, "unreadInfo");
export const setUnreadTodayCount = createSetter(dataState, "unreadTodayCount");
export const setIsVersionAtLeast2_2_0 = createSetter(
  dataState,
  "isVersionAtLeast2_2_0",
);
export const resetData = () => dataState.set(defaultValue);

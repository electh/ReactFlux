import { computed, map } from "nanostores";
import {
  getCategories,
  getFeeds,
  getHistoryEntries,
  getStarredEntries,
  getTodayEntries,
  getUnreadInfo,
} from "../apis";
import { createSetter } from "../utils/nanostores";
import { settingsState } from "./settingsState";

export const dataState = map({
  isAppDataReady: false,
  unreadInfo: {},
  unreadTodayCount: 0,
  starredCount: 0,
  historyCount: 0,
  feedsData: [],
  categoriesData: [],
});

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

export const fetchData = async () => {
  setIsAppDataReady(false);
  const responses = await Promise.all([
    getUnreadInfo(),
    getTodayEntries(0, "unread"),
    getStarredEntries(),
    getHistoryEntries(),
    getFeeds(),
    getCategories(),
  ]);

  const [
    unreadInfoData,
    unreadTodayData,
    starredData,
    historyData,
    feedsData,
    categoriesData,
  ] = responses;

  const unreadInfo = feedsData.reduce((acc, feed) => {
    acc[feed.id] = unreadInfoData.unreads[feed.id] ?? 0;
    return acc;
  }, {});

  setUnreadInfo(unreadInfo);
  setUnreadTodayCount(unreadTodayData.total ?? 0);
  setStarredCount(starredData.total ?? 0);
  setHistoryCount(historyData.total ?? 0);
  setFeedsData(feedsData);
  setCategoriesData(categoriesData);
  setIsAppDataReady(true);
};

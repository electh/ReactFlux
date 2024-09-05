import { proxy, snapshot } from "valtio";
import {
  getCategories,
  getFeeds,
  getHistoryEntries,
  getStarredEntries,
  getTodayEntries,
  getUnreadInfo,
} from "../apis";
import { createSetter } from "../utils/valtio";
import { configState } from "./configState";

export const dataState = proxy({
  isAppDataReady: false,
  unreadInfo: {},
  unreadTodayCount: 0,
  starredCount: 0,
  historyCount: 0,
  feedsData: [],
  categoriesData: [],

  get feedsWithUnread() {
    const { unreadInfo, feedsData } = this;
    return feedsData.map((feed) => ({
      ...feed,
      unreadCount: unreadInfo[feed.id] ?? 0,
    }));
  },

  get feeds() {
    const { feedsWithUnread } = this;
    return feedsWithUnread.sort((a, b) => a.title.localeCompare(b.title, "en"));
  },

  get categoriesWithUnread() {
    const { categoriesData, feedsWithUnread } = this;
    return categoriesData.map((category) => {
      const feedsInCategory = feedsWithUnread.filter(
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
  },

  get categories() {
    const { categoriesWithUnread } = this;
    return categoriesWithUnread.sort((a, b) =>
      a.title.localeCompare(b.title, "en"),
    );
  },

  get hiddenCategoryIds() {
    const { categories } = this;
    return categories
      .filter((category) => category.hide_globally)
      .map((category) => category.id);
  },

  get hiddenFeedIds() {
    const { feeds, hiddenCategoryIds } = this;
    return feeds
      .filter(
        (feed) =>
          feed.hide_globally || hiddenCategoryIds.includes(feed.category.id),
      )
      .map((feed) => feed.id);
  },

  get filteredFeeds() {
    const { feeds, hiddenFeedIds } = this;
    const { showAllFeeds } = snapshot(configState);
    return feeds.filter(
      (feed) => showAllFeeds || !hiddenFeedIds.includes(feed.id),
    );
  },

  get feedsGroupedById() {
    const { filteredFeeds } = this;
    return filteredFeeds.reduce((groupedFeeds, feed) => {
      const { id } = feed.category;
      if (!groupedFeeds[id]) {
        groupedFeeds[id] = [];
      }
      groupedFeeds[id].push(feed);
      return groupedFeeds;
    }, {});
  },

  get unreadTotal() {
    const { filteredFeeds, unreadInfo } = this;
    return Object.entries(unreadInfo).reduce((acc, [id, count]) => {
      if (filteredFeeds.some((feed) => feed.id === Number(id))) {
        return acc + count;
      }
      return acc;
    }, 0);
  },
});

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

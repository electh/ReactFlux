import { atom } from "jotai";
import { atomWithRefreshAndDefault } from "../utils/atom";
import { configAtom } from "./configAtom";

export const isAppDataReadyAtom = atom(false);

export const unreadInfoRefreshAtom = atom(0);
export const unreadInfoDataAtom = atom({});
export const unreadInfoAtom = atomWithRefreshAndDefault(
  unreadInfoRefreshAtom,
  (get) => {
    const data = get(unreadInfoDataAtom);
    return data.unreads ?? {};
  },
);

export const unreadTodayRefreshAtom = atom(0);
export const unreadTodayDataAtom = atom({});
export const unreadTodayAtom = atomWithRefreshAndDefault(
  unreadTodayRefreshAtom,
  (get) => {
    const data = get(unreadTodayDataAtom);
    return data.total ?? 0;
  },
);

export const starredRefreshAtom = atom(0);
export const starredDataAtom = atom({});
export const starredCountAtom = atomWithRefreshAndDefault(
  starredRefreshAtom,
  (get) => {
    const data = get(starredDataAtom);
    return data.total ?? 0;
  },
);

export const historyRefreshAtom = atom(0);
export const historyDataAtom = atom({});
export const historyCountAtom = atomWithRefreshAndDefault(
  historyRefreshAtom,
  (get) => {
    const data = get(historyDataAtom);
    return data.total ?? 0;
  },
);

export const feedsRefreshAtom = atom(0);
export const feedsDataAtom = atom([]);
export const feedsWithUnreadAtom = atomWithRefreshAndDefault(
  feedsRefreshAtom,
  (get) => {
    const unreadInfo = get(unreadInfoAtom);
    const feeds = get(feedsDataAtom);
    return feeds.map((feed) => ({
      ...feed,
      unreadCount: unreadInfo[feed.id] ?? 0,
    }));
  },
);
export const feedsAtom = atom((get) => {
  const feedsWithUnread = get(feedsWithUnreadAtom);
  return feedsWithUnread.sort((a, b) => a.title.localeCompare(b.title, "en"));
});

export const categoriesRefreshAtom = atom(0);
export const categoriesDataAtom = atom([]);
export const categoriesWithUnreadAtom = atomWithRefreshAndDefault(
  categoriesRefreshAtom,
  (get) => {
    const feedsWithUnread = get(feedsWithUnreadAtom);
    const categories = get(categoriesDataAtom);
    return categories.map((category) => {
      const feedsInCategory = feedsWithUnread.filter(
        (feed) => feed.category.id === category.id,
      );
      return {
        ...category,
        unreadCount: feedsInCategory.reduce(
          (acc, feed) => acc + feed.unreadCount,
          0,
        ),
        feedCount: feedsInCategory.length,
      };
    });
  },
);

export const categoriesAtom = atom((get) => {
  const categoriesWithUnread = get(categoriesWithUnreadAtom);
  return categoriesWithUnread.sort((a, b) =>
    a.title.localeCompare(b.title, "en"),
  );
});

export const hiddenCategoryIdsAtom = atom((get) => {
  const categories = get(categoriesAtom);
  return categories
    .filter((category) => category.hide_globally)
    .map((category) => category.id);
});

export const hiddenFeedIdsAtom = atom((get) => {
  const hiddenCategoryIds = get(hiddenCategoryIdsAtom);
  const feeds = get(feedsAtom);
  return feeds
    .filter(
      (feed) =>
        feed.hide_globally || hiddenCategoryIds.includes(feed.category.id),
    )
    .map((feed) => feed.id);
});

export const unreadTotalAtom = atom((get) => {
  const unreadInfo = get(unreadInfoAtom);
  const config = get(configAtom);
  const { showAllFeeds } = config;
  const hiddenFeedIds = get(hiddenFeedIdsAtom);

  return Object.entries(unreadInfo).reduce((acc, [id, count]) => {
    if (showAllFeeds || !hiddenFeedIds.includes(Number(id))) {
      return acc + count;
    }
    return acc;
  }, 0);
});

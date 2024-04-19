import { atom } from "jotai";
import isURL from "validator/es/lib/isURL";
import { atomWithRefreshAndDefault } from "../utils/atom";
import { extractProtocolAndHostname } from "../utils/url";
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

const createAtomSet = () => {
  const refreshAtom = atom(0);
  const dataAtom = atom({});
  const countAtom = atomWithRefreshAndDefault(refreshAtom, (get) => {
    const data = get(dataAtom);
    return data.total ?? 0;
  });

  return [refreshAtom, dataAtom, countAtom];
};

export const [
  unreadTodayRefreshAtom,
  unreadTodayDataAtom,
  unreadTodayCountAtom,
] = createAtomSet();
export const [starredRefreshAtom, starredDataAtom, starredCountAtom] =
  createAtomSet();
export const [historyRefreshAtom, historyDataAtom, historyCountAtom] =
  createAtomSet();

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

export const filteredFeedsAtom = atom((get) => {
  const { showAllFeeds } = get(configAtom);
  const hiddenFeedIds = get(hiddenFeedIdsAtom);
  const feeds = get(feedsAtom);
  return feeds.filter(
    (feed) => showAllFeeds || !hiddenFeedIds.includes(feed.id),
  );
});

export const feedsGroupedByIdAtom = atom((get) => {
  const feeds = get(filteredFeedsAtom);
  return feeds.reduce((groupedFeeds, feed) => {
    if (!isURL(feed.site_url)) {
      feed.site_url = extractProtocolAndHostname(feed.feed_url);
    }
    const { id } = feed.category;
    if (!groupedFeeds[id]) {
      groupedFeeds[id] = [];
    }
    groupedFeeds[id].push(feed);
    return groupedFeeds;
  }, {});
});

export const unreadTotalAtom = atom((get) => {
  const unreadInfo = get(unreadInfoAtom);
  const filteredFeeds = get(filteredFeedsAtom);

  return Object.entries(unreadInfo).reduce((acc, [id, count]) => {
    if (filteredFeeds.some((feed) => feed.id === Number(id))) {
      return acc + count;
    }
    return acc;
  }, 0);
});

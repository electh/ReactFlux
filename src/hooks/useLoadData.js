import { useAtom, useSetAtom } from "jotai";

import { useEffect } from "react";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";
import {
  getCategories,
  getFeedIcon,
  getFeeds,
  getHistoryEntries,
  getStarredEntries,
  getTodayEntries,
  getUnreadInfo,
} from "../apis";
import {
  categoriesDataAtom,
  categoriesRefreshAtom,
  feedsDataAtom,
  feedsRefreshAtom,
  historyCountAtom,
  isAppDataReadyAtom,
  starredCountAtom,
  unreadInfoAtom,
  unreadTodayCountAtom,
} from "../atoms/dataAtom";

const createDataSyncHook = (dataAtom, refreshAtom, fetchFunc) => (key) => {
  const setData = useSetAtom(dataAtom);
  const triggerRefresh = useSetAtom(refreshAtom);
  const { data } = useSWR(key, fetchFunc);

  useEffect(() => {
    if (data) {
      setData(data.data);
      triggerRefresh((prev) => prev + 1);
    }
  }, [data, setData, triggerRefresh]);

  return data;
};

const useFeedsSync = createDataSyncHook(feedsDataAtom, feedsRefreshAtom, () =>
  getFeeds(),
);
const useCategoriesSync = createDataSyncHook(
  categoriesDataAtom,
  categoriesRefreshAtom,
  () => getCategories(),
);

export const useFeedIcon = (feedId) =>
  useSWRImmutable(`/v1/feeds/${feedId}/icon`, () => getFeedIcon(feedId));

export const useLoadData = () => {
  const [isAppDataReady, setIsAppDataReady] = useAtom(isAppDataReadyAtom);
  const setUnreadInfo = useSetAtom(unreadInfoAtom);
  const setUnreadTodayCount = useSetAtom(unreadTodayCountAtom);
  const setStarredCount = useSetAtom(starredCountAtom);
  const setHistoryCount = useSetAtom(historyCountAtom);

  const unreadInfoData = useSWR("/v1/feeds/counters", getUnreadInfo).data;
  const unreadTodayData = useSWR("/v1/entries?status=unread", () =>
    getTodayEntries(0, "unread"),
  ).data;
  const starredData = useSWR(
    "/v1/entries?starred=true",
    getStarredEntries,
  ).data;
  const historyData = useSWR("/v1/entries?status=read", getHistoryEntries).data;
  const feedsData = useFeedsSync("/v1/feeds");
  const categoriesData = useCategoriesSync("/v1/categories");

  useEffect(() => {
    if (unreadInfoData) {
      setUnreadInfo(unreadInfoData.data.unreads ?? {});
    }
    if (unreadTodayData) {
      setUnreadTodayCount(unreadTodayData.data.total ?? 0);
    }
    if (starredData) {
      setStarredCount(starredData.data.total ?? 0);
    }
    if (historyData) {
      setHistoryCount(historyData.data.total ?? 0);
    }
    if (
      !isAppDataReady &&
      [
        unreadInfoData,
        unreadTodayData,
        starredData,
        historyData,
        feedsData,
        categoriesData,
      ].every(Boolean)
    ) {
      setIsAppDataReady(true);
    }
  }, [
    isAppDataReady,
    setIsAppDataReady,
    setUnreadInfo,
    setUnreadTodayCount,
    setStarredCount,
    setHistoryCount,
    unreadInfoData,
    unreadTodayData,
    starredData,
    historyData,
    feedsData,
    categoriesData,
  ]);

  const loadData = () => setIsAppDataReady(false);

  return { loadData };
};

import { useAtom, useSetAtom } from "jotai";

import { useEffect } from "react";
import useSWR from "swr";
import {
  getCategories,
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
  historyDataAtom,
  historyRefreshAtom,
  isAppDataReadyAtom,
  starredDataAtom,
  starredRefreshAtom,
  unreadInfoDataAtom,
  unreadInfoRefreshAtom,
  unreadTodayDataAtom,
  unreadTodayRefreshAtom,
} from "../atoms/dataAtom";

const createDataSyncHook = (dataAtom, refreshAtom, fetchFunc) => (key) => {
  const setData = useSetAtom(dataAtom);
  const triggerRefresh = useSetAtom(refreshAtom);
  const { data } = useSWR(key, fetchFunc, { revalidateOnFocus: false });

  useEffect(() => {
    if (data) {
      setData(data.data);
      triggerRefresh((prev) => prev + 1);
    }
  }, [data, setData, triggerRefresh]);

  return data;
};

const useUnreadInfoSync = createDataSyncHook(
  unreadInfoDataAtom,
  unreadInfoRefreshAtom,
  () => getUnreadInfo(),
);
const useUnreadTodaySync = createDataSyncHook(
  unreadTodayDataAtom,
  unreadTodayRefreshAtom,
  () => getTodayEntries(0, "unread"),
);
const useStarredSync = createDataSyncHook(
  starredDataAtom,
  starredRefreshAtom,
  () => getStarredEntries(),
);
const useHistorySync = createDataSyncHook(
  historyDataAtom,
  historyRefreshAtom,
  () => getHistoryEntries(),
);
const useFeedsSync = createDataSyncHook(feedsDataAtom, feedsRefreshAtom, () =>
  getFeeds(),
);
const useCategoriesSync = createDataSyncHook(
  categoriesDataAtom,
  categoriesRefreshAtom,
  () => getCategories(),
);

export const useLoadData = () => {
  const [isAppDataReady, setIsAppDataReady] = useAtom(isAppDataReadyAtom);
  const unreadInfoData = useUnreadInfoSync("/v1/feeds/counters");
  const unreadTodayData = useUnreadTodaySync("/v1/entries?status=unread");
  const starredData = useStarredSync("/v1/entries?starred=true");
  const historyData = useHistorySync("/v1/entries?status=read");
  const feedsData = useFeedsSync("/v1/feeds");
  const categoriesData = useCategoriesSync("/v1/categories");

  const loadData = () => {
    setIsAppDataReady(false);
  };

  useEffect(() => {
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
    unreadInfoData,
    unreadTodayData,
    starredData,
    historyData,
    feedsData,
    categoriesData,
  ]);

  return { loadData };
};

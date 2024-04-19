import { useAtom, useSetAtom } from "jotai";

import { useEffect, useState } from "react";
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

const createDataSyncHook = (dataAtom, refreshAtom, fetchFunc) => () => {
  const [data, setData] = useState(null);
  const setAtomData = useSetAtom(dataAtom);
  const triggerRefresh = useSetAtom(refreshAtom);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetchFunc();
      setData(response.data);
    };
    fetchData();
  }, [fetchFunc]);

  useEffect(() => {
    if (data) {
      setAtomData(data);
      triggerRefresh((prev) => prev + 1);
    }
  }, [data, setAtomData, triggerRefresh]);

  return data;
};

const useUnreadInfoSync = createDataSyncHook(
  unreadInfoDataAtom,
  unreadInfoRefreshAtom,
  getUnreadInfo,
);
const useUnreadTodaySync = createDataSyncHook(
  unreadTodayDataAtom,
  unreadTodayRefreshAtom,
  () => getTodayEntries(0, "unread"),
);
const useStarredSync = createDataSyncHook(
  starredDataAtom,
  starredRefreshAtom,
  getStarredEntries,
);
const useHistorySync = createDataSyncHook(
  historyDataAtom,
  historyRefreshAtom,
  getHistoryEntries,
);
const useFeedsSync = createDataSyncHook(
  feedsDataAtom,
  feedsRefreshAtom,
  getFeeds,
);
const useCategoriesSync = createDataSyncHook(
  categoriesDataAtom,
  categoriesRefreshAtom,
  getCategories,
);

export const useLoadData = () => {
  const [isAppDataReady, setIsAppDataReady] = useAtom(isAppDataReadyAtom);
  const unreadInfoData = useUnreadInfoSync();
  const unreadTodayData = useUnreadTodaySync();
  const starredData = useStarredSync();
  const historyData = useHistorySync();
  const feedsData = useFeedsSync();
  const categoriesData = useCategoriesSync();

  useEffect(() => {
    const allDataLoaded = [
      unreadInfoData,
      unreadTodayData,
      starredData,
      historyData,
      feedsData,
      categoriesData,
    ].every(Boolean);

    if (allDataLoaded && !isAppDataReady) {
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

  const loadData = () => {
    setIsAppDataReady(false);
  };

  return { loadData };
};

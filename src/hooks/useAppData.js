import { useRef } from "react";
import {
  getCategories,
  getFeeds,
  getHistoryEntries,
  getStarredEntries,
  getTodayEntries,
  getUnreadInfo,
  getVersion,
} from "../apis";
import {
  setCategoriesData,
  setFeedsData,
  setHistoryCount,
  setIsAppDataReady,
  setIsVersionAtLeast2_2_0,
  setStarredCount,
  setUnreadInfo,
  setUnreadTodayCount,
} from "../store/dataState";
import { compareVersions } from "../utils/version";

const useAppData = () => {
  const isLoading = useRef(false);

  const fetchAppData = async () => {
    if (isLoading.current) {
      return;
    }

    isLoading.current = true;
    setIsAppDataReady(false);

    try {
      const responses = await Promise.all([
        getUnreadInfo(),
        getTodayEntries(0, "unread"),
        getStarredEntries(),
        getHistoryEntries(),
        getFeeds(),
        getCategories(),
        getVersion(),
      ]);

      const [
        unreadInfoData,
        unreadTodayData,
        starredData,
        historyData,
        feedsData,
        categoriesData,
        versionData,
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
      setIsVersionAtLeast2_2_0(
        compareVersions(versionData.version, "2.2.0") >= 0,
      );
      setIsAppDataReady(true);
    } catch (error) {
      console.error("Error fetching app data: ", error);
    } finally {
      isLoading.current = false;
    }
  };

  return { fetchAppData };
};

export default useAppData;

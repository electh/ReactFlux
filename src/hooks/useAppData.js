import { useRef } from "react";
import {
  getCategories,
  getCounters,
  getFeeds,
  getStarredEntries,
  getTodayEntries,
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
        getCounters(),
        getTodayEntries(0, "unread"),
        getStarredEntries(),
        getFeeds(),
        getCategories(),
        getVersion(),
      ]);

      const [
        countersData,
        unreadTodayData,
        starredData,
        feedsData,
        categoriesData,
        versionData,
      ] = responses;

      const unreadInfo = feedsData.reduce((acc, feed) => {
        acc[feed.id] = countersData.unreads[feed.id] ?? 0;
        return acc;
      }, {});

      const historyCount = Object.values(countersData.reads).reduce(
        (acc, count) => acc + count,
        0,
      );

      setUnreadInfo(unreadInfo);
      setUnreadTodayCount(unreadTodayData.total ?? 0);
      setStarredCount(starredData.total ?? 0);
      setHistoryCount(historyCount);
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

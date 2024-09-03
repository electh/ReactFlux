import { useSetAtom } from "jotai";
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
  feedsDataAtom,
  historyCountAtom,
  isAppDataReadyAtom,
  starredCountAtom,
  unreadInfoAtom,
  unreadTodayCountAtom,
} from "../atoms/dataAtom";

export const useFetchData = () => {
  const setIsAppDataReady = useSetAtom(isAppDataReadyAtom);
  const setUnreadInfo = useSetAtom(unreadInfoAtom);
  const setUnreadTodayCount = useSetAtom(unreadTodayCountAtom);
  const setStarredCount = useSetAtom(starredCountAtom);
  const setHistoryCount = useSetAtom(historyCountAtom);
  const setFeedsData = useSetAtom(feedsDataAtom);
  const setCategoriesData = useSetAtom(categoriesDataAtom);

  const fetchData = async () => {
    setIsAppDataReady(false);

    try {
      const [
        unreadInfoData,
        unreadTodayData,
        starredData,
        historyData,
        feedsData,
        categoriesData,
      ] = await Promise.all([
        getUnreadInfo(),
        getTodayEntries(0, "unread"),
        getStarredEntries(),
        getHistoryEntries(),
        getFeeds(),
        getCategories(),
      ]);

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
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsAppDataReady(true);
    }
  };

  return { fetchData };
};

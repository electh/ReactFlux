import { atom, useAtomValue, useSetAtom } from "jotai";
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
  historyCountAtom,
  isAppDataReadyAtom,
  starredCountAtom,
  unreadInfoAtom,
  unreadTodayCountAtom,
} from "../atoms/dataAtom";

const fetchDataAtom = atom(async () => {
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
  ] = responses.map((res) => res.data);

  return {
    unreadInfo: unreadInfoData.unreads ?? {},
    unreadTodayCount: unreadTodayData.total ?? 0,
    starredCount: starredData.total ?? 0,
    historyCount: historyData.total ?? 0,
    feedsData,
    categoriesData,
  };
});

export const useFetchData = () => {
  const setIsAppDataReady = useSetAtom(isAppDataReadyAtom);
  const fetchedData = useAtomValue(fetchDataAtom);

  const setUnreadInfo = useSetAtom(unreadInfoAtom);
  const setUnreadTodayCount = useSetAtom(unreadTodayCountAtom);
  const setStarredCount = useSetAtom(starredCountAtom);
  const setHistoryCount = useSetAtom(historyCountAtom);

  const setFeedsData = useSetAtom(feedsDataAtom);
  const triggerFeedsRefresh = useSetAtom(feedsRefreshAtom);
  const setCategoriesData = useSetAtom(categoriesDataAtom);
  const triggerCategoriesRefresh = useSetAtom(categoriesRefreshAtom);

  const fetchData = () => {
    setIsAppDataReady(false);
    const {
      unreadInfo,
      unreadTodayCount,
      starredCount,
      historyCount,
      feedsData,
      categoriesData,
    } = fetchedData;
    setUnreadInfo(unreadInfo);
    setUnreadTodayCount(unreadTodayCount);
    setStarredCount(starredCount);
    setHistoryCount(historyCount);
    setFeedsData(feedsData);
    triggerFeedsRefresh((prev) => prev + 1);
    setCategoriesData(categoriesData);
    triggerCategoriesRefresh((prev) => prev + 1);
    setIsAppDataReady(true);
  };

  return { fetchData };
};

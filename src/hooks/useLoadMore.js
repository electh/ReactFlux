import { useContext, useState } from "react";

import useStore from "../Store.js";
import ContentContext from "../components/Content/ContentContext";
import { filterEntries } from "../utils/filter";

const useLoadMore = () => {
  const pageSize = useStore((state) => state.pageSize);

  const {
    entries,
    filterStatus,
    filterString,
    filterType,
    offset,
    setEntries,
    setFilteredEntries,
    setLoadMoreUnreadVisible,
    setLoadMoreVisible,
    setOffset,
    setUnreadEntries,
    total,
    unreadCount,
    unreadEntries,
  } = useContext(ContentContext);

  /* 加载更多 loading*/
  const [loadingMore, setLoadingMore] = useState(false);

  const getFirstImage = (entry) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(entry.content, "text/html");
    const firstImg = doc.querySelector("img");
    if (firstImg) {
      entry.imgSrc = firstImg.getAttribute("src");
    }
    return entry;
  };

  const handleLoadMore = async (getEntries) => {
    setLoadingMore(true);

    try {
      let response;
      // if (filterStatus === "unread" && location.pathname !== "history") {
      if (filterStatus === "unread") {
        response = await getEntries(offset + pageSize, filterStatus);
      } else {
        response = await getEntries(offset + pageSize);
      }
      if (response?.data?.entries) {
        setOffset((current) => current + pageSize);
        const newArticlesWithImage = response.data.entries.map(getFirstImage);
        const updatedAllArticles = [
          ...new Map(
            [
              ...(filterStatus === "unread" ? entries : unreadEntries),
              ...newArticlesWithImage,
            ].map((entry) => [entry.id, entry]),
          ).values(),
        ];
        if (filterStatus === "unread") {
          setEntries(updatedAllArticles);
        } else {
          setUnreadEntries(updatedAllArticles);
        }

        const filteredByString = filterString
          ? filterEntries(
              updatedAllArticles,
              filterType,
              filterStatus,
              filterString,
            )
          : updatedAllArticles;

        setFilteredEntries(filteredByString);
        if (filterStatus === "unread") {
          setLoadMoreUnreadVisible(updatedAllArticles.length < unreadCount);
        } else {
          setLoadMoreVisible(updatedAllArticles.length < total);
        }
      }
    } catch (error) {
      console.error("Error fetching more articles:", error);
    }

    setLoadingMore(false);
  };

  return { getFirstImage, handleLoadMore, loadingMore };
};

export default useLoadMore;

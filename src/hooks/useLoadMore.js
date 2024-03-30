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
    setUnreadOffset,
    total,
    unreadCount,
    unreadEntries,
    unreadOffset,
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
      if (filterStatus === "all") {
        response = await getEntries(offset + pageSize);
      } else {
        response = await getEntries(unreadOffset + pageSize, filterStatus);
      }
      if (response?.data?.entries) {
        if (filterStatus === "all") {
          setOffset((current) => current + pageSize);
        } else {
          setUnreadOffset((current) => current + pageSize);
        }
        const newArticlesWithImage = response.data.entries.map(getFirstImage);
        const updatedAllArticles = [
          ...new Map(
            [
              ...(filterStatus === "all" ? entries : unreadEntries),
              ...newArticlesWithImage,
            ].map((entry) => [entry.id, entry]),
          ).values(),
        ];
        if (filterStatus === "all") {
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
        if (filterStatus === "all") {
          setLoadMoreVisible(updatedAllArticles.length < total);
        } else {
          setLoadMoreUnreadVisible(updatedAllArticles.length < unreadCount);
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

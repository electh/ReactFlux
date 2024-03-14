import { useContext, useState } from "react";

import { ContentContext } from "../components/ContentContext";
import { filterEntries } from "../utils/Filter";

export default function useLoadMore() {
  const {
    allEntries,
    filterStatus,
    filterString,
    filterType,
    offset,
    setAllEntries,
    setEntries,
    setLoadMoreUnreadVisible,
    setLoadMoreVisible,
    setOffset,
    total,
    unreadTotal,
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
      const response = await getEntries(offset + 100);
      if (response?.data?.entries) {
        setOffset(offset + 100);
        const newArticlesWithImage = response.data.entries.map(getFirstImage);
        const updatedAllArticles = [
          ...new Map(
            [...allEntries, ...newArticlesWithImage].map((entry) => [
              entry.id,
              entry,
            ]),
          ).values(),
        ];
        setAllEntries(updatedAllArticles);

        const filteredArticles =
          filterStatus === "all"
            ? updatedAllArticles
            : updatedAllArticles.filter((a) => a.status === "unread");

        const filteredByString = filterString
          ? filterEntries(
              filteredArticles,
              filterType,
              filterStatus,
              filterString,
            )
          : filteredArticles;

        setEntries(filteredByString);
        setLoadMoreVisible(updatedAllArticles.length < total);
        setLoadMoreUnreadVisible(
          filteredArticles.length < unreadTotal && filterStatus === "unread",
        );
      }
    } catch (error) {
      console.error("Error fetching more articles:", error);
    }

    setLoadingMore(false);
  };

  return { getFirstImage, handleLoadMore, loadingMore };
}

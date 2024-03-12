import { useContext, useState } from "react";

import { ContentContext } from "../components/ContentContext";

export default function useLoadMore() {
  const {
    allEntries,
    filterStatus,
    getEntries,
    getFirstImage,
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

  const handleLoadMore = async () => {
    try {
      setLoadingMore(true);
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
        setEntries(filteredArticles);
        setLoadMoreVisible(updatedAllArticles.length < total);
        setLoadMoreUnreadVisible(filteredArticles.length < unreadTotal);
      }
    } catch (error) {
      console.error("Error fetching more articles:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return { loadingMore, handleLoadMore };
}

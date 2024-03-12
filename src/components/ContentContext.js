import { createContext, useMemo, useState } from "react";

import { useStore } from "../Store";

export const ContentContext = createContext(null);

export const ContentProvider = ({ children }) => {
  /* 接口返回文章总数原始值，不受接口返回数据长度限制 */
  const [total, setTotal] = useState(0);
  /* 接口返回未读文章数原始值，不受接口返回数据长度限制 */
  const [unreadTotal, setUnreadTotal] = useState(0);
  /* 分页参数 */
  const [offset, setOffset] = useState(0);
  /*all 页签加载更多按钮可见性 */
  const [loadMoreVisible, setLoadMoreVisible] = useState(false);
  /*unread 页签加载更多按钮可见性 */
  const [loadMoreUnreadVisible, setLoadMoreUnreadVisible] = useState(false);
  /* 页面显示的文章 */
  const [entries, setEntries] = useState([]);
  /* 接口返回的文章 */
  const [allEntries, setAllEntries] = useState([]);
  /* 选中的文章 */
  const [activeContent, setActiveContent] = useState(null);
  /* 文章详情进入动画 */
  const [animation, setAnimation] = useState(null);
  /*all unread*/
  const [filterStatus, setFilterStatus] = useState("all");
  /*0-title 1-content*/
  const [filterType, setFilterType] = useState("0");
  /* 搜索文本 */
  const [filterString, setFilterString] = useState("");
  /* 初始 loading*/
  const [loading, setLoading] = useState(true);
  /* 更新 menu 中 feed 未读数 */
  const updateFeedUnread = useStore((state) => state.updateFeedUnread);
  /* 更新 menu 中 group 未读数 */
  const updateGroupUnread = useStore((state) => state.updateGroupUnread);

  const value = useMemo(
    () => ({
      activeContent,
      allEntries,
      animation,
      entries,
      filterStatus,
      filterString,
      filterType,
      loading,
      loadMoreUnreadVisible,
      loadMoreVisible,
      offset,
      setActiveContent,
      setAllEntries,
      setAnimation,
      setEntries,
      setFilterStatus,
      setFilterString,
      setFilterType,
      setLoading,
      setLoadMoreUnreadVisible,
      setLoadMoreVisible,
      setOffset,
      setTotal,
      setUnreadTotal,
      total,
      unreadTotal,
      updateFeedUnread,
      updateGroupUnread,
    }),
    [
      activeContent,
      allEntries,
      animation,
      entries,
      filterStatus,
      filterString,
      filterType,
      loading,
      loadMoreUnreadVisible,
      loadMoreVisible,
      offset,
      setActiveContent,
      setAllEntries,
      setAnimation,
      setEntries,
      setFilterStatus,
      setFilterString,
      setFilterType,
      setLoading,
      setLoadMoreUnreadVisible,
      setLoadMoreVisible,
      setOffset,
      setTotal,
      setUnreadTotal,
      total,
      unreadTotal,
      updateFeedUnread,
      updateGroupUnread,
    ],
  );

  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  );
};

import React, { createContext, useMemo, useState } from "react";

const ContentContext = createContext(null);

const ContentProvider = ({ children }) => {
  // 接口返回文章总数原始值，不受接口返回数据长度限制
  const [total, setTotal] = useState(0);
  // 接口返回未读文章数原始值，不受接口返回数据长度限制
  const [unreadCount, setUnreadCount] = useState(0);
  // 分页参数
  const [offset, setOffset] = useState(0);
  // all 页签加载更多按钮可见性
  const [loadMoreVisible, setLoadMoreVisible] = useState(false);
  // unread 页签加载更多按钮可见性
  const [loadMoreUnreadVisible, setLoadMoreUnreadVisible] = useState(false);
  // 接口返回的文章
  const [entries, setEntries] = useState([]);
  // 页面显示的文章
  const [filteredEntries, setFilteredEntries] = useState([]);
  // all | unread
  const [filterStatus, setFilterStatus] = useState("all");
  // 0: title | 1: content
  const [filterType, setFilterType] = useState("0");
  // 搜索文本
  const [filterString, setFilterString] = useState("");
  // 初始 loading
  const [loading, setLoading] = useState(true);

  const value = useMemo(
    () => ({
      entries,
      filteredEntries,
      filterStatus,
      filterString,
      filterType,
      loading,
      loadMoreUnreadVisible,
      loadMoreVisible,
      offset,
      setEntries,
      setFilteredEntries,
      setFilterStatus,
      setFilterString,
      setFilterType,
      setLoading,
      setLoadMoreUnreadVisible,
      setLoadMoreVisible,
      setOffset,
      setTotal,
      setUnreadCount,
      total,
      unreadCount,
    }),
    [
      entries,
      filteredEntries,
      filterStatus,
      filterString,
      filterType,
      loading,
      loadMoreUnreadVisible,
      loadMoreVisible,
      offset,
      total,
      unreadCount,
    ],
  );

  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  );
};

export default ContentContext;
export { ContentProvider };

import React, { createContext, useMemo, useRef, useState } from "react";
import { getConfig } from "../../utils/config";

const ContentContext = createContext(null);

const ContentProvider = ({ children }) => {
  // 接口返回文章总数原始值，不受接口返回数据长度限制
  const [total, setTotal] = useState(0);
  // 接口返回未读文章数原始值，不受接口返回数据长度限制
  const [unreadCount, setUnreadCount] = useState(0);
  // 所有文章分页参数
  const [offset, setOffset] = useState(0);
  // 未读文章分页参数
  const [unreadOffset, setUnreadOffset] = useState(0);
  // all 页签加载更多按钮可见性
  const [loadMoreVisible, setLoadMoreVisible] = useState(false);
  // unread 页签加载更多按钮可见性
  const [loadMoreUnreadVisible, setLoadMoreUnreadVisible] = useState(false);
  // 接口返回的所有文章
  const [entries, setEntries] = useState([]);
  // 接口返回的未读文章
  const [unreadEntries, setUnreadEntries] = useState([]);
  // 页面显示的文章
  const [filteredEntries, setFilteredEntries] = useState([]);
  // all | unread
  const [filterStatus, setFilterStatus] = useState(getConfig("showStatus"));
  // 0: title | 1: content
  const [filterType, setFilterType] = useState("0");
  // 搜索文本
  const [filterString, setFilterString] = useState("");
  // 初始 loading
  const [loading, setLoading] = useState(true);
  // 文章是否被聚焦
  const [isArticleFocused, setIsArticleFocused] = useState(false);
  // 文章详情页的引用
  const entryDetailRef = useRef(null);

  const value = useMemo(
    () => ({
      entries,
      entryDetailRef,
      filteredEntries,
      filterStatus,
      filterString,
      filterType,
      isArticleFocused,
      loading,
      loadMoreUnreadVisible,
      loadMoreVisible,
      offset,
      setEntries,
      setFilteredEntries,
      setFilterStatus,
      setFilterString,
      setFilterType,
      setIsArticleFocused,
      setLoading,
      setLoadMoreUnreadVisible,
      setLoadMoreVisible,
      setOffset,
      setTotal,
      setUnreadCount,
      setUnreadEntries,
      setUnreadOffset,
      total,
      unreadCount,
      unreadEntries,
      unreadOffset,
    }),
    [
      entries,
      filteredEntries,
      filterStatus,
      filterString,
      filterType,
      isArticleFocused,
      loading,
      loadMoreUnreadVisible,
      loadMoreVisible,
      offset,
      total,
      unreadCount,
      unreadEntries,
      unreadOffset,
    ],
  );

  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  );
};

export default ContentContext;
export { ContentProvider };

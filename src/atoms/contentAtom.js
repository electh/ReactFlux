import { atom } from "jotai";
import { atomWithDefault } from "jotai/utils";
import { proxy } from "valtio";
import { atomWithProxy } from "../utils/atomWithProxy";
import {
  filterEntries,
  filterEntriesByVisibility,
  removeDuplicateEntries,
} from "../utils/filter";
import { configAtom } from "./configAtom";
import { hiddenFeedIdsAtom } from "./dataAtom";

export const contentState = proxy({
  activeContent: null,
  entries: [],
  unreadCount: 0,
  unreadEntries: [],
  unreadOffset: 0,
});

// 当前打开的文章
export const activeContentAtom = atomWithProxy(contentState, "activeContent");
// 接口返回文章总数原始值，不受接口返回数据长度限制
export const totalAtom = atom(0);
// 接口返回未读文章数原始值，不受接口返回数据长度限制
export const unreadCountAtom = atomWithProxy(contentState, "unreadCount");
// 所有文章分页参数
export const offsetAtom = atom(0);
// 未读文章分页参数
export const unreadOffsetAtom = atomWithProxy(contentState, "unreadOffset");
// all 页签加载更多按钮可见性
export const loadMoreVisibleAtom = atom(false);
// unread 页签加载更多按钮可见性
export const loadMoreUnreadVisibleAtom = atom(false);
// 接口返回的所有文章
export const entriesAtom = atomWithProxy(contentState, "entries");
// 接口返回的未读文章
export const unreadEntriesAtom = atomWithProxy(contentState, "unreadEntries");
export const infoFromAtom = atomWithDefault((get) => get(configAtom).homePage);
// all | unread
export const filterStatusAtom = atomWithDefault((get) => {
  const infoFrom = get(infoFromAtom);
  if (["starred", "history"].includes(infoFrom)) {
    return "all";
  }
  return get(configAtom).showStatus;
});
export const currentEntriesAtom = atom((get) => {
  const filterStatus = get(filterStatusAtom);
  return filterStatus === "all" ? get(entriesAtom) : get(unreadEntriesAtom);
});
// title | content | author
export const filterTypeAtom = atom("Title");
// 搜索文本
export const filterStringAtom = atom("");
// 页面显示的文章
export const filteredEntriesAtom = atom((get) => {
  const entries = get(currentEntriesAtom);
  const filterType = get(filterTypeAtom);
  const filterString = get(filterStringAtom);
  const filteredEntries = filterEntries(entries, filterType, filterString);

  const infoFrom = get(infoFromAtom);
  const { removeDuplicates, showAllFeeds } = get(configAtom);
  const hiddenFeedIds = get(hiddenFeedIdsAtom);

  const visibleEntries = filterEntriesByVisibility(
    filteredEntries,
    infoFrom,
    showAllFeeds,
    hiddenFeedIds,
  );
  if (["starred", "history"].includes(infoFrom)) {
    return visibleEntries;
  }
  return removeDuplicateEntries(visibleEntries, removeDuplicates);
});
// 初始 loading
export const loadingAtom = atom(true);
// 文章是否被聚焦
export const isArticleFocusedAtom = atom(false);

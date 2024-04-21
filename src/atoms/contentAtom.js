import { atom } from "jotai";
import { atomWithDefault } from "jotai/utils";
import { configAtom } from "./configAtom";

// 接口返回文章总数原始值，不受接口返回数据长度限制
export const totalAtom = atom(0);
// 接口返回未读文章数原始值，不受接口返回数据长度限制
export const unreadCountAtom = atom(0);
// 所有文章分页参数
export const offsetAtom = atom(0);
// 未读文章分页参数
export const unreadOffsetAtom = atom(0);
// all 页签加载更多按钮可见性
export const loadMoreVisibleAtom = atom(false);
// unread 页签加载更多按钮可见性
export const loadMoreUnreadVisibleAtom = atom(false);
// 接口返回的所有文章
export const entriesAtom = atom([]);
// 接口返回的未读文章
export const unreadEntriesAtom = atom([]);
// 页面显示的文章
export const filteredEntriesAtom = atom([]);
// all | unread
export const filterStatusAtom = atomWithDefault(
  (get) => get(configAtom).showStatus,
);
// 0: title | 1: content
export const filterTypeAtom = atom("0");
// 搜索文本
export const filterStringAtom = atom("");
// 初始 loading
export const loadingAtom = atom(true);
// 文章是否被聚焦
export const isArticleFocusedAtom = atom(false);

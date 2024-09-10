import { computed, map } from "nanostores";
import { removeDuplicateEntries } from "../utils/deduplicate";
import { filterEntries } from "../utils/filter";
import { createSetter } from "../utils/nanostores";
import { dataState, hiddenFeedIdsState } from "./dataState";
import { getSettings, settingsState } from "./settingsState";

export const contentState = map({
  activeContent: null, // 当前打开的文章
  entries: [], // 接口返回的所有文章
  filterString: "", // 搜索文本
  filterType: "Title", // title | content | author
  infoFrom: getSettings("homePage"), // all | today | starred | history
  isArticleFocused: false, // 文章是否被聚焦
  isArticleListReady: false, // 文章列表是否加载完成
  offset: 0, // 文章分页参数
  total: 0, // 接口返回文章总数原始值，不受接口返回数据长度限制
});

// 加载更多元素可见性
export const loadMoreVisibleState = computed(contentState, (content) => {
  const { entries, total } = content;
  return entries.length < total;
});

export const filteredEntriesState = computed(
  [contentState, dataState, hiddenFeedIdsState, settingsState],
  (content, data, hiddenFeedIds, settings) => {
    const { entries, filterString, filterType, infoFrom } = content;
    const filteredEntries = filterEntries(entries, filterType, filterString);

    const { isVersionAtLeast2_2_0 } = data;
    const { removeDuplicates, showAllFeeds } = settings;
    const isValidFilter = !["starred", "history"].includes(infoFrom);
    const isVisible = (entry) =>
      isVersionAtLeast2_2_0 ||
      showAllFeeds ||
      !hiddenFeedIds.includes(entry.feed.id);
    const visibleEntries = isValidFilter
      ? filteredEntries.filter(isVisible)
      : filteredEntries;

    if (
      removeDuplicates === "none" ||
      ["starred", "history"].includes(infoFrom)
    ) {
      return visibleEntries;
    }
    return removeDuplicateEntries(visibleEntries, removeDuplicates);
  },
);

export const setActiveContent = createSetter(contentState, "activeContent");
export const setEntries = createSetter(contentState, "entries");
export const setFilterString = createSetter(contentState, "filterString");
export const setFilterType = createSetter(contentState, "filterType");
export const setInfoFrom = createSetter(contentState, "infoFrom");
export const setIsArticleFocused = createSetter(
  contentState,
  "isArticleFocused",
);
export const setIsArticleListReady = createSetter(
  contentState,
  "isArticleListReady",
);
export const setOffset = createSetter(contentState, "offset");
export const setTotal = createSetter(contentState, "total");

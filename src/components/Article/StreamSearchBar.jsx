import { Button, Menu, Tooltip } from "@arco-design/web-react"
import {
  IconAlignLeft,
  IconArrowLeft,
  IconArrowRight,
  IconRecord,
  IconRefresh,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconStarFill,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router"

import {
  MarkReadControl,
  SearchModal,
  ToolbarActionButton,
  ToolbarMenuButton,
} from "./SearchBarShared"
import SidebarTrigger from "./SidebarTrigger.jsx"

import { LayoutColumnIcon, LayoutExpandedIcon } from "@/components/icons/LayoutModeIcons"
import CustomTooltip from "@/components/ui/CustomTooltip"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import useStreamKeyHandlers from "@/hooks/useStreamKeyHandlers"
import {
  contentState,
  dynamicCountState,
  nextContentState,
  prevContentState,
  setFilterString,
  setFilterType,
} from "@/store/contentState"
import { categoriesState, feedsState } from "@/store/dataState"
import { draftFilterTypeState } from "@/store/searchBarState"
import { settingsState, updateSettings } from "@/store/settingsState"
import createSetter from "@/utils/nanostores"

import "./StreamSearchBar.css"

const setDraftFilterType = createSetter(draftFilterTypeState)
const MAX_PAGE_INFO_INLINE_WIDTH = 220
const getHorizontalMargin = (element) => {
  const style = globalThis.getComputedStyle(element)
  return (Number.parseFloat(style.marginLeft) || 0) + (Number.parseFloat(style.marginRight) || 0)
}

const getHorizontalGap = (element) =>
  Number.parseFloat(globalThis.getComputedStyle(element).columnGap) || 0

const getPageInfoRequiredWidth = (pageInfo, titleRow) => {
  const minWidth = Number.parseFloat(globalThis.getComputedStyle(pageInfo).minWidth) || 0
  const titleRowWidth = titleRow ? Math.min(titleRow.scrollWidth, MAX_PAGE_INFO_INLINE_WIDTH) : 0
  return Math.max(minWidth, titleRowWidth)
}

const getToolbarMainRequiredWidth = (toolbarMain, pageInfo, titleRow) => {
  const toolbarMainRect = toolbarMain.getBoundingClientRect()
  const pageInfoRect = pageInfo.getBoundingClientRect()
  const fixedWidth = Math.max(0, pageInfoRect.left - toolbarMainRect.left)

  return fixedWidth + getPageInfoRequiredWidth(pageInfo, titleRow)
}

const getInlineControlsWidth = (buttonGroup) =>
  buttonGroup.scrollWidth + getHorizontalMargin(buttonGroup)

const StreamSearchBar = ({ info, markAllAsRead, refreshArticleList, streamVirtualizerRef }) => {
  const { filterString, filterType, infoFrom, isArticleListReady } = useStore(contentState)
  const { layoutMode, orderDirection, showStatus } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const feeds = useStore(feedsState)
  const categories = useStore(categoriesState)
  const dynamicCount = useStore(dynamicCountState)
  const prevContent = useStore(prevContentState)
  const nextContent = useStore(nextContentState)

  const { id } = useParams()
  const { isBelowMedium } = useScreenWidth()
  const { navigateToNextArticle, navigateToPreviousArticle } = useStreamKeyHandlers({
    streamVirtualizerRef,
  })

  const [searchModalVisible, setSearchModalVisible] = useState(false)
  const [modalInputValue, setModalInputValue] = useState("")
  const [isCompactToolbar, setIsCompactToolbar] = useState(false)

  const toolbarRef = useRef(null)
  const toolbarMainRef = useRef(null)
  const buttonGroupRef = useRef(null)
  const pageInfoRef = useRef(null)
  const titleRowRef = useRef(null)

  const { title, count } = useMemo(() => {
    if (id) {
      if (infoFrom === "category") {
        const category = categories.find((c) => c.id === Number(id))
        return { title: category?.title, count: dynamicCount }
      }
      if (infoFrom === "feed") {
        const feed = feeds.find((f) => f.id === Number(id))
        return { title: feed?.title, count: dynamicCount }
      }
    }

    const infoMap = {
      all: { key: "sidebar.all", count: dynamicCount },
      today: { key: "sidebar.today", count: dynamicCount },
      starred: { key: "sidebar.starred", count: dynamicCount },
      history: { key: "sidebar.history", count: dynamicCount },
    }

    const info = infoMap[infoFrom] || { key: "", count: 0 }
    return { title: info.key ? polyglot.t(info.key) : "", count: info.count }
  }, [infoFrom, id, categories, feeds, dynamicCount, polyglot])

  const openSearchModal = () => {
    setModalInputValue(filterString)
    setDraftFilterType(filterType)
    setSearchModalVisible(true)
  }

  const closeSearchModal = () => {
    setSearchModalVisible(false)
  }

  const handleConfirmSearch = (value) => {
    setFilterString(value)
    closeSearchModal()
  }

  const statusOptions = useMemo(() => {
    const options = [
      {
        label: polyglot.t("article_list.filter_status_unread"),
        value: "unread",
        icon: <IconRecord />,
      },
      {
        label: polyglot.t("article_list.filter_status_all"),
        value: "all",
        icon: <IconAlignLeft />,
      },
    ]

    if (["category", "feed"].includes(infoFrom)) {
      options.push({
        label: polyglot.t("article_list.filter_status_starred"),
        value: "starred",
        icon: <IconStarFill />,
      })
    }

    return options
  }, [infoFrom, polyglot])

  const layoutOptions = useMemo(
    () => [
      {
        icon: <LayoutColumnIcon />,
        label: polyglot.t("appearance.layout_mode_classic"),
        value: "classic",
      },
      {
        icon: <LayoutExpandedIcon />,
        label: polyglot.t("appearance.layout_mode_stream"),
        value: "stream",
      },
    ],
    [polyglot],
  )

  const currentStatus =
    statusOptions.find((option) => option.value === showStatus) ?? statusOptions[0]
  const currentLayout =
    layoutOptions.find((option) => option.value === layoutMode) ?? layoutOptions[0]
  const sortDirectionLabel =
    orderDirection === "desc"
      ? polyglot.t("article_list.sort_direction_desc")
      : polyglot.t("article_list.sort_direction_asc")
  const statusControlLabel =
    showStatus === "unread"
      ? polyglot.t("article_list.filter_status_unread_only")
      : showStatus === "all"
        ? polyglot.t("article_list.filter_status_all_items")
        : currentStatus.label
  const sortControlLabel = `${polyglot.t("article_list.sort_label")}: ${sortDirectionLabel}`
  const viewControlLabel = `${polyglot.t("article_list.view_label")}: ${currentLayout.label}`

  useEffect(() => {
    if (infoFrom === "starred" && showStatus === "starred") {
      updateSettings({ showStatus: "all" })
    }
  }, [infoFrom, showStatus])

  useLayoutEffect(() => {
    const toolbar = toolbarRef.current
    const toolbarMain = toolbarMainRef.current
    const buttonGroup = buttonGroupRef.current
    const pageInfo = pageInfoRef.current
    const titleRow = titleRowRef.current

    if (
      !toolbar ||
      !toolbarMain ||
      !buttonGroup ||
      !pageInfo ||
      !titleRow ||
      typeof ResizeObserver === "undefined"
    ) {
      return
    }

    let frameId = null

    const applyToolbarClasses = (isCompact) => {
      toolbar.classList.toggle("stream-toolbar--compact", isCompact)
    }

    const updateToolbarLayout = () => {
      if (frameId != null) {
        cancelAnimationFrame(frameId)
      }

      frameId = requestAnimationFrame(() => {
        const availableWidth = toolbar.clientWidth

        applyToolbarClasses(false)
        const toolbarMainRequiredWidth = getToolbarMainRequiredWidth(
          toolbarMain,
          pageInfo,
          titleRow,
        )
        const toolbarGap = getHorizontalGap(toolbar)
        const fullControlsWidth = getInlineControlsWidth(buttonGroup)

        let nextIsCompact = false

        if (toolbarMainRequiredWidth + fullControlsWidth + toolbarGap > availableWidth + 1) {
          applyToolbarClasses(true)
          nextIsCompact = true
        }

        setIsCompactToolbar((prev) => (prev === nextIsCompact ? prev : nextIsCompact))
      })
    }

    const resizeObserver = new ResizeObserver(updateToolbarLayout)
    resizeObserver.observe(toolbar)
    resizeObserver.observe(toolbarMain)
    resizeObserver.observe(buttonGroup)
    resizeObserver.observe(pageInfo)
    resizeObserver.observe(titleRow)

    updateToolbarLayout()

    return () => {
      if (frameId != null) {
        cancelAnimationFrame(frameId)
      }
      resizeObserver.disconnect()
    }
  }, [])

  const toolbarClassName = [
    "search-and-sort-bar",
    "stream-toolbar",
    isCompactToolbar ? "stream-toolbar--compact" : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div ref={toolbarRef} className={toolbarClassName} style={{ width: "100%" }}>
      <div ref={toolbarMainRef} className="toolbar-main">
        <SidebarTrigger />
        <div className="stream-nav-group">
          <CustomTooltip mini content={polyglot.t("article_card.previous_tooltip")}>
            <Button
              disabled={!prevContent}
              icon={<IconArrowLeft />}
              shape="circle"
              size="small"
              onClick={navigateToPreviousArticle}
            />
          </CustomTooltip>
          <CustomTooltip mini content={polyglot.t("article_card.next_tooltip")}>
            <Button
              disabled={!nextContent}
              icon={<IconArrowRight />}
              shape="circle"
              size="small"
              onClick={navigateToNextArticle}
            />
          </CustomTooltip>
          <CustomTooltip mini content={polyglot.t("article_list.refresh_tooltip")}>
            <Button
              icon={<IconRefresh />}
              loading={!isArticleListReady}
              shape="circle"
              size="small"
              onClick={refreshArticleList}
            />
          </CustomTooltip>
        </div>
        <div ref={pageInfoRef} className="page-info">
          <div className="title-container">
            <div ref={titleRowRef} className="title-row">
              {title ? (
                <Tooltip content={title} disabled={isBelowMedium}>
                  <span className="toolbar-title">{title}</span>
                </Tooltip>
              ) : (
                <div className="placeholder-title"></div>
              )}
              {isArticleListReady && count > 0 ? (
                <span className="count-label">({count})</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div ref={buttonGroupRef} className="button-group">
        <div className="stream-primary-controls">
          <ToolbarActionButton
            active={!!filterString}
            icon={<IconSearch />}
            label={polyglot.t("search.search")}
            tooltip={polyglot.t("search.search")}
            onClick={openSearchModal}
          />
          <div className="stream-mark-read-control">
            <MarkReadControl info={info} markAllAsRead={markAllAsRead} variant="stream" />
          </div>
          <div className="stream-view-control mobile-only-view-control">
            <ToolbarMenuButton
              icon={currentLayout.icon}
              label={viewControlLabel}
              tooltip={viewControlLabel}
            >
              {layoutOptions.map((option) => (
                <Menu.Item
                  key={option.value}
                  className="toolbar-menu-item"
                  onClick={() => updateSettings({ layoutMode: option.value })}
                >
                  <span className="toolbar-menu-item-label">
                    {option.icon}
                    <span>
                      {polyglot.t("article_list.view_label")}: {option.label}
                    </span>
                  </span>
                </Menu.Item>
              ))}
            </ToolbarMenuButton>
          </div>
        </div>
        <div className="stream-secondary-controls">
          <div className="stream-view-control desktop-view-control">
            <ToolbarMenuButton
              icon={currentLayout.icon}
              label={viewControlLabel}
              tooltip={viewControlLabel}
            >
              {layoutOptions.map((option) => (
                <Menu.Item
                  key={option.value}
                  className="toolbar-menu-item"
                  onClick={() => updateSettings({ layoutMode: option.value })}
                >
                  <span className="toolbar-menu-item-label">
                    {option.icon}
                    <span>
                      {polyglot.t("article_list.view_label")}: {option.label}
                    </span>
                  </span>
                </Menu.Item>
              ))}
            </ToolbarMenuButton>
          </div>
          {infoFrom === "history" ? null : (
            <ToolbarMenuButton
              className={showStatus === "unread" ? "is-active" : ""}
              icon={currentStatus.icon}
              label={statusControlLabel}
              tooltip={statusControlLabel}
            >
              {statusOptions.map((option) => (
                <Menu.Item
                  key={option.value}
                  className="toolbar-menu-item"
                  onClick={() => updateSettings({ showStatus: option.value })}
                >
                  <span className="toolbar-menu-item-label">
                    {option.icon}
                    <span>
                      {option.value === "unread"
                        ? polyglot.t("article_list.filter_status_unread_only")
                        : option.value === "all"
                          ? polyglot.t("article_list.filter_status_all_items")
                          : option.label}
                    </span>
                  </span>
                </Menu.Item>
              ))}
            </ToolbarMenuButton>
          )}
          <ToolbarMenuButton
            icon={orderDirection === "desc" ? <IconSortDescending /> : <IconSortAscending />}
            label={sortControlLabel}
            tooltip={sortDirectionLabel}
          >
            <Menu.Item
              key="desc"
              className="toolbar-menu-item"
              onClick={() => updateSettings({ orderDirection: "desc" })}
            >
              <span className="toolbar-menu-item-label">
                <IconSortDescending />
                <span>
                  {polyglot.t("article_list.sort_label")}:{" "}
                  {polyglot.t("article_list.sort_direction_desc")}
                </span>
              </span>
            </Menu.Item>
            <Menu.Item
              key="asc"
              className="toolbar-menu-item"
              onClick={() => updateSettings({ orderDirection: "asc" })}
            >
              <span className="toolbar-menu-item-label">
                <IconSortAscending />
                <span>
                  {polyglot.t("article_list.sort_label")}:{" "}
                  {polyglot.t("article_list.sort_direction_asc")}
                </span>
              </span>
            </Menu.Item>
          </ToolbarMenuButton>
        </div>
      </div>
      <SearchModal
        value={modalInputValue}
        visible={searchModalVisible}
        onCancel={closeSearchModal}
        onChange={setModalInputValue}
        onConfirm={handleConfirmSearch}
      />
    </div>
  )
}

export default StreamSearchBar

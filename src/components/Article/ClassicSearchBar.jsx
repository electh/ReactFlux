import { Button, DatePicker, Menu, Typography } from "@arco-design/web-react"
import {
  IconCalendar,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useMemo, useState } from "react"
import { useParams } from "react-router"

import { ActiveButton, SearchModal, ToolbarMenuButton } from "./SearchBarShared"
import SidebarTrigger from "./SidebarTrigger.jsx"

import { LayoutColumnIcon, LayoutExpandedIcon } from "@/components/icons/LayoutModeIcons"
import CustomTooltip from "@/components/ui/CustomTooltip"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import {
  contentState,
  dynamicCountState,
  setFilterDate,
  setFilterString,
  setFilterType,
} from "@/store/contentState"
import { categoriesState, feedsState } from "@/store/dataState"
import { draftFilterTypeState } from "@/store/searchBarState"
import { settingsState, updateSettings } from "@/store/settingsState"
import { getStartOfToday } from "@/utils/date"
import createSetter from "@/utils/nanostores"

import "./ClassicSearchBar.css"

const setDraftFilterType = createSetter(draftFilterTypeState)

const ClassicSearchBar = ({ info, markAllAsRead, refreshArticleList }) => {
  const { filterDate, filterString, filterType, infoFrom, isArticleListReady } =
    useStore(contentState)
  const { layoutMode, orderDirection } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const feeds = useStore(feedsState)
  const categories = useStore(categoriesState)
  const dynamicCount = useStore(dynamicCountState)

  const { id } = useParams()
  const { isBelowMedium } = useScreenWidth()

  const [calendarVisible, setCalendarVisible] = useState(false)
  const [searchModalVisible, setSearchModalVisible] = useState(false)
  const [modalInputValue, setModalInputValue] = useState("")

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

  const toggleOrderDirection = () => {
    const newOrderDirection = orderDirection === "desc" ? "asc" : "desc"
    updateSettings({ orderDirection: newOrderDirection })
  }

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

  const handleSetToday = () => {
    setFilterDate(getStartOfToday())
    setCalendarVisible(false)
  }

  const handleClearDate = () => {
    setFilterDate(null)
    setCalendarVisible(false)
  }

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
  const currentLayout =
    layoutOptions.find((option) => option.value === layoutMode) ?? layoutOptions[0]
  const viewControlLabel = `${polyglot.t("article_list.view_label")}: ${currentLayout.label}`

  return (
    <div className="search-and-sort-bar classic-toolbar" style={{ width: "100%" }}>
      <SidebarTrigger />
      <div className="page-info">
        <div className="title-container">
          {title ? (
            <Typography.Ellipsis
              expandable={false}
              showTooltip={!isBelowMedium}
              style={{ fontWeight: 500 }}
            >
              {title}
            </Typography.Ellipsis>
          ) : (
            <div className="placeholder-title"></div>
          )}
        </div>
        {isArticleListReady && count > 0 && (
          <Typography.Text className="count-label">({count})</Typography.Text>
        )}
      </div>
      <div className="layout-selector-slot">
        <ToolbarMenuButton
          className="classic-layout-menu-button"
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
      <div className="button-group">
        <ActiveButton
          active={!!filterString}
          icon={<IconSearch />}
          tooltip={polyglot.t("search.search")}
          onClick={openSearchModal}
        />
        <DatePicker
          popupVisible={calendarVisible}
          position="bottom"
          showNowBtn={false}
          value={filterDate}
          extra={
            <div className="calendar-actions">
              <Button long size="mini" type="primary" onClick={handleSetToday}>
                {polyglot.t("search.today")}
              </Button>
              <Button long size="mini" onClick={handleClearDate}>
                {polyglot.t("search.clear_date")}
              </Button>
            </div>
          }
          triggerElement={
            <CustomTooltip mini content={polyglot.t("search.select_date")}>
              <Button
                icon={<IconCalendar />}
                shape="circle"
                size="small"
                style={{
                  backgroundColor: filterDate ? "rgb(var(--primary-6))" : "inherit",
                }}
              />
            </CustomTooltip>
          }
          onChange={(v) => setFilterDate(v)}
          onVisibleChange={setCalendarVisible}
        />
        <CustomTooltip
          mini
          content={
            orderDirection === "desc"
              ? polyglot.t("article_list.sort_direction_desc")
              : polyglot.t("article_list.sort_direction_asc")
          }
        >
          <Button
            icon={orderDirection === "desc" ? <IconSortDescending /> : <IconSortAscending />}
            shape="circle"
            size="small"
            onClick={toggleOrderDirection}
          />
        </CustomTooltip>
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

export default ClassicSearchBar

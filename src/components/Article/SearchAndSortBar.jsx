import { Button, DatePicker, Input, Tooltip, Typography } from "@arco-design/web-react"
import {
  IconCalendar,
  IconQuestionCircle,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { Fragment, memo, useMemo, useRef, useState } from "react"
import { useParams } from "react-router"

import SidebarTrigger from "./SidebarTrigger.jsx"

import AccessibleModal from "@/components/ui/AccessibleModal"
import CustomTooltip from "@/components/ui/CustomTooltip"
import useContentContext from "@/hooks/useContentContext"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import {
  contentState,
  dynamicCountState,
  setFilterDate,
  setFilterString,
} from "@/store/contentState"
import { categoriesState, feedsState } from "@/store/dataState"
import { settingsState, updateSettings } from "@/store/settingsState"
import { getStartOfToday } from "@/utils/date"
import "./SearchAndSortBar.css"

const SearchModal = memo(({ value, visible, onCancel, onConfirm, onChange }) => {
  const { polyglot } = useStore(polyglotState)
  const tooltipLines = polyglot.t("search.article_tooltip").split("\n")
  const searchInputRef = useRef(null)

  const handleAfterOpen = () => searchInputRef.current?.focus()

  const handleConfirm = () => onConfirm(value)

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleConfirm()
    }
  }

  const modalTitle = polyglot.t("search.search")

  return (
    <AccessibleModal
      afterOpen={handleAfterOpen}
      className="search-modal"
      closeLabel={polyglot.t("actions.close_dialog", { name: modalTitle })}
      title={modalTitle}
      visible={visible}
      footer={
        <>
          <Button onClick={onCancel}>{polyglot.t("search.cancel")}</Button>
          <Button type="primary" onClick={handleConfirm}>
            {polyglot.t("search.confirm")}
          </Button>
        </>
      }
      onCancel={onCancel}
    >
      <div className="search-modal-content">
        <Input.Search
          ref={searchInputRef}
          allowClear
          aria-label={polyglot.t("search.article_input_label")}
          placeholder={polyglot.t("search.article_placeholder")}
          value={value}
          prefix={
            <Tooltip
              mini
              trigger={["hover", "focus", "click"]}
              content={
                <div>
                  {tooltipLines.map((line, index) => (
                    <Fragment key={`tooltip-line-${index}`}>
                      {line}
                      {index < tooltipLines.length - 1 && <br />}
                    </Fragment>
                  ))}
                </div>
              }
            >
              <Button
                aria-label={polyglot.t("search.syntax_help")}
                className="search-syntax-help"
                icon={<IconQuestionCircle aria-hidden="true" />}
                shape="circle"
                size="mini"
                type="text"
              />
            </Tooltip>
          }
          onChange={onChange}
          onKeyDown={handleKeyDown}
        />
      </div>
    </AccessibleModal>
  )
})
SearchModal.displayName = "SearchModal"

const ActiveButton = ({ active, expanded, icon, tooltip, onClick }) => (
  <CustomTooltip mini content={tooltip}>
    <Button
      aria-expanded={expanded}
      aria-haspopup="dialog"
      aria-label={tooltip}
      icon={icon}
      shape="circle"
      size="small"
      style={{
        backgroundColor: active ? "rgb(var(--primary-6))" : "inherit",
      }}
      onClick={onClick}
    />
  </CustomTooltip>
)

const SearchAndSortBar = () => {
  const { filterDate, filterString, infoFrom, isArticleListReady } = useStore(contentState)
  const { orderDirection } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const feeds = useStore(feedsState)
  const categories = useStore(categoriesState)
  const dynamicCount = useStore(dynamicCountState)

  const { id } = useParams()
  const { closeActiveContent, entryListRef } = useContentContext()
  const { isBelowMedium } = useScreenWidth()

  const [calendarVisible, setCalendarVisible] = useState(false)
  const [searchModalVisible, setSearchModalVisible] = useState(false)
  const [modalInputValue, setModalInputValue] = useState("")

  const searchLabel = filterString
    ? polyglot.t("search.active_query", { query: filterString })
    : polyglot.t("search.search")
  const sortLabel =
    orderDirection === "desc"
      ? polyglot.t("article_list.sort_direction_desc")
      : polyglot.t("article_list.sort_direction_asc")

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
    setSearchModalVisible(true)
  }

  const closeSearchModal = () => {
    setSearchModalVisible(false)
  }

  const handleConfirmSearch = (value) => {
    const normalizedQuery = value.trim()
    if (normalizedQuery !== filterString) {
      closeActiveContent()
      entryListRef.current?.getScrollElement()?.scroll({ top: 0 })
      setFilterString(normalizedQuery)
    }
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

  return (
    <div className="search-and-sort-bar" style={{ width: isBelowMedium ? "100%" : 370 }}>
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
      <div className="button-group">
        <ActiveButton
          active={!!filterString}
          expanded={searchModalVisible}
          icon={<IconSearch aria-hidden="true" />}
          tooltip={searchLabel}
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
                aria-expanded={calendarVisible}
                aria-haspopup="dialog"
                aria-label={polyglot.t("search.select_date")}
                icon={<IconCalendar aria-hidden="true" />}
                shape="circle"
                size="small"
                style={{
                  backgroundColor: filterDate ? "rgb(var(--primary-6))" : "inherit",
                }}
              />
            </CustomTooltip>
          }
          triggerProps={{
            boundaryDistance: { bottom: 8, left: 8, right: 8, top: 8 },
            className: "mobile-date-picker-popup",
          }}
          onChange={(v) => setFilterDate(v)}
          onVisibleChange={setCalendarVisible}
        />
        <CustomTooltip mini content={sortLabel}>
          <Button
            aria-label={sortLabel}
            shape="circle"
            size="small"
            icon={
              orderDirection === "desc" ? (
                <IconSortDescending aria-hidden="true" />
              ) : (
                <IconSortAscending aria-hidden="true" />
              )
            }
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

export default SearchAndSortBar

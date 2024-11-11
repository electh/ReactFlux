import { Button, DatePicker, Input, Select, Tooltip } from "@arco-design/web-react"
import {
  IconCalendar,
  IconQuestionCircle,
  IconSortAscending,
  IconSortDescending,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { Fragment, useEffect, useState, useMemo } from "react"
import { useLocation } from "react-router-dom"

import SidebarTrigger from "./SidebarTrigger.jsx"

import CustomTooltip from "@/components/ui/CustomTooltip"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { contentState, setFilterDate, setFilterString, setFilterType } from "@/store/contentState"
import { settingsState, updateSettings } from "@/store/settingsState"
import { getStartOfToday } from "@/utils/date"
import { debounce } from "@/utils/time"

import "./SearchAndSortBar.css"

const SearchAndSortBar = () => {
  const { filterDate, filterString, filterType } = useStore(contentState)
  const { orderDirection, showStatus } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const tooltipLines = polyglot.t("search.tooltip").split("\n")

  const location = useLocation()

  const [currentFilterString, setCurrentFilterString] = useState("")
  const [isMount, setIsMount] = useState(false)

  const debouncedSetFilterString = useMemo(
    () => debounce((value) => setFilterString(value), 500),
    [],
  )

  const handleInputChange = (value) => {
    setCurrentFilterString(value)
    debouncedSetFilterString(value)
  }

  const { isBelowMedium } = useScreenWidth()

  const toggleOrderDirection = () => {
    const newOrderDirection = orderDirection === "desc" ? "asc" : "desc"
    updateSettings({ orderDirection: newOrderDirection })
  }

  useEffect(() => {
    setFilterDate(null)
    setFilterType("title")
    setFilterString("")
    setIsMount(false)
  }, [location.pathname, showStatus])

  useEffect(() => {
    if (!isMount) {
      setIsMount(true)
      return
    }

    if (filterString !== currentFilterString) {
      setCurrentFilterString(filterString)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString, isMount])

  return (
    <div className="search-and-sort-bar">
      <SidebarTrigger />
      <Input.Search
        allowClear
        placeholder={polyglot.t("search.placeholder")}
        style={{ width: isBelowMedium ? "100%" : 272, marginLeft: 8 }}
        value={currentFilterString}
        addBefore={
          <Select
            style={{ width: 80 }}
            value={filterType}
            triggerProps={{
              autoAlignPopupWidth: false,
              autoAlignPopupMinWidth: true,
              position: "bl",
            }}
            onChange={setFilterType}
          >
            <Select.Option value="title">{polyglot.t("search.type_title")}</Select.Option>
            <Select.Option value="content">{polyglot.t("search.type_content")}</Select.Option>
            <Select.Option value="author">{polyglot.t("search.type_author")}</Select.Option>
          </Select>
        }
        prefix={
          <Tooltip
            mini
            content={
              <div>
                {tooltipLines.map((line, index) => (
                  <Fragment key={`line-${index}-${line.length}`}>
                    {line}
                    {index < tooltipLines.length - 1 && <br />}
                  </Fragment>
                ))}
              </div>
            }
          >
            <IconQuestionCircle />
          </Tooltip>
        }
        onChange={handleInputChange}
      />
      <div className="button-group">
        <DatePicker
          position="bottom"
          showNowBtn={false}
          value={filterDate}
          extra={
            <div className="calendar-actions">
              <Button
                long
                size="mini"
                type="primary"
                onClick={() => setFilterDate(getStartOfToday())}
              >
                {polyglot.t("search.today")}
              </Button>
              <Button long size="mini" onClick={() => setFilterDate(null)}>
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
    </div>
  )
}

export default SearchAndSortBar

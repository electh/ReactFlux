import {
  Button,
  DatePicker,
  Input,
  Select,
  Tooltip,
} from "@arco-design/web-react";
import {
  IconCalendar,
  IconQuestionCircle,
  IconSortAscending,
  IconSortDescending,
} from "@arco-design/web-react/icon";

import { useStore } from "@nanostores/react";
import { Fragment, useCallback, useEffect, useState } from "react";
import { polyglotState } from "../../hooks/useLanguage";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import {
  contentState,
  setFilterDate,
  setFilterString,
  setFilterType,
} from "../../store/contentState";
import { settingsState, updateSettings } from "../../store/settingsState";
import { getStartOfToday } from "../../utils/date";
import { debounce } from "../../utils/time";
import CustomTooltip from "../ui/CustomTooltip";
import "./SearchAndSortBar.css";
import SidebarTrigger from "./SidebarTrigger.jsx";

const SearchAndSortBar = () => {
  const { filterDate, filterString, filterType } = useStore(contentState);
  const { orderDirection } = useStore(settingsState);
  const { polyglot } = useStore(polyglotState);
  const tooltipLines = polyglot.t("search.tooltip").split("\n");

  const [currentFilterString, setCurrentFilterString] = useState("");

  const debouncedSetFilterString = useCallback(
    debounce((value) => setFilterString(value), 500),
    [],
  );

  const handleInputChange = (value) => {
    setCurrentFilterString(value);
    debouncedSetFilterString(value);
  };

  const { isBelowMedium } = useScreenWidth();

  const toggleOrderDirection = () => {
    const newOrderDirection = orderDirection === "desc" ? "asc" : "desc";
    updateSettings({ orderDirection: newOrderDirection });
  };

  useEffect(() => {
    setFilterDate(null);
    setFilterType("title");
    setFilterString("");
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (filterString !== currentFilterString) {
      setCurrentFilterString(filterString);
    }
  }, [filterString]);

  return (
    <div className="search-and-sort-bar">
      <SidebarTrigger />
      <Input.Search
        allowClear
        onChange={handleInputChange}
        placeholder={polyglot.t("search.placeholder")}
        style={{ width: isBelowMedium ? "100%" : 272, marginLeft: 8 }}
        value={currentFilterString}
        addBefore={
          <Select
            onChange={setFilterType}
            style={{ width: 80 }}
            triggerProps={{
              autoAlignPopupWidth: false,
              autoAlignPopupMinWidth: true,
              position: "bl",
            }}
            value={filterType}
          >
            <Select.Option value="title">
              {polyglot.t("search.type_title")}
            </Select.Option>
            <Select.Option value="content">
              {polyglot.t("search.type_content")}
            </Select.Option>
            <Select.Option value="author">
              {polyglot.t("search.type_author")}
            </Select.Option>
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
      />
      <div className="button-group">
        <DatePicker
          position="bottom"
          triggerElement={
            <CustomTooltip mini content={polyglot.t("search.select_date")}>
              <Button
                shape="circle"
                size="small"
                icon={<IconCalendar />}
                type={filterDate ? "primary" : "default"}
              />
            </CustomTooltip>
          }
          showNowBtn={false}
          extra={
            <div className="calendar-actions">
              <Button
                onClick={() => setFilterDate(getStartOfToday())}
                type="primary"
                size="mini"
                long
              >
                {polyglot.t("search.today")}
              </Button>
              <Button onClick={() => setFilterDate(null)} size="mini" long>
                {polyglot.t("search.clear_date")}
              </Button>
            </div>
          }
          value={filterDate}
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
            shape="circle"
            size="small"
            icon={
              orderDirection === "desc" ? (
                <IconSortDescending />
              ) : (
                <IconSortAscending />
              )
            }
            onClick={toggleOrderDirection}
          />
        </CustomTooltip>
      </div>
    </div>
  );
};

export default SearchAndSortBar;

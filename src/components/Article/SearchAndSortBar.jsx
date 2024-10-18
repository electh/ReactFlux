import {
  Button,
  Calendar,
  Dropdown,
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
        <Dropdown
          position="bottom"
          trigger="click"
          droplist={
            <>
              <Calendar panel onChange={setFilterDate} value={filterDate} />
              <div className="calendar-actions">
                <button
                  className="calendar-action-button today"
                  onClick={() => setFilterDate(getStartOfToday())}
                  type="button"
                >
                  {polyglot.t("search.today")}
                </button>
                <button
                  className="calendar-action-button clear"
                  onClick={() => setFilterDate(null)}
                  type="button"
                >
                  {polyglot.t("search.clear_date")}
                </button>
              </div>
            </>
          }
        >
          <CustomTooltip content={polyglot.t("search.select_date")} mini>
            <Button shape="circle" size="small" icon={<IconCalendar />} />
          </CustomTooltip>
        </Dropdown>
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

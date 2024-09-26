import { Button, Input, Select, Tooltip } from "@arco-design/web-react";
import {
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
  setFilterString,
  setFilterType,
  setIsArticleFocused,
} from "../../store/contentState";
import { settingsState, updateSettings } from "../../store/settingsState";
import { debounce } from "../../utils/time";
import "./SearchAndSortBar.css";

const SearchAndSortBar = () => {
  const { orderDirection } = useStore(settingsState);
  const { filterType } = useStore(contentState);
  const { polyglot } = useStore(polyglotState);
  const tooltipLines = polyglot.t("search.tooltip").split("\n");

  const [currentFilterString, setCurrentFilterString] = useState("");

  const debouncedSetFilterString = useCallback(
    debounce((value) => setFilterString(value), 500),
    [],
  );

  const { isBelowMedium } = useScreenWidth();

  const toggleOrderDirection = () => {
    const newOrderDirection = orderDirection === "desc" ? "asc" : "desc";
    updateSettings({ orderDirection: newOrderDirection });
  };

  useEffect(() => {
    setFilterType("title");
  }, []);

  useEffect(() => {
    if (currentFilterString === "") {
      setFilterString(currentFilterString);
    } else {
      debouncedSetFilterString(currentFilterString);
    }
  }, [currentFilterString, debouncedSetFilterString]);

  return (
    <div className="search-and-sort-bar">
      <Input.Search
        allowClear
        onBlur={() => setIsArticleFocused(true)}
        onFocus={() => setIsArticleFocused(false)}
        onChange={setCurrentFilterString}
        placeholder={polyglot.t("search.placeholder")}
        style={{ width: isBelowMedium ? "100%" : 272, marginLeft: 8 }}
        addBefore={
          <Select
            onChange={setFilterType}
            style={{ width: 100 }}
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
      />
      <div className="button-group">
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
          <Button
            shape="circle"
            size="small"
            icon={<IconQuestionCircle />}
            onClick={() => setIsArticleFocused(false)}
          />
        </Tooltip>
        <Tooltip
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
        </Tooltip>
      </div>
    </div>
  );
};

export default SearchAndSortBar;

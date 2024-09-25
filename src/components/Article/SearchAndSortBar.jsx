import { Button, Input, Select, Tooltip } from "@arco-design/web-react";
import {
  IconQuestionCircle,
  IconSortAscending,
  IconSortDescending,
} from "@arco-design/web-react/icon";

import { useStore } from "@nanostores/react";
import { Fragment, useEffect } from "react";
import { polyglotState } from "../../hooks/useLanguage";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import {
  contentState,
  setFilterString,
  setFilterType,
  setIsArticleFocused,
} from "../../store/contentState";
import { settingsState, updateSettings } from "../../store/settingsState";
import "./SearchAndSortBar.css";

const SearchAndSortBar = () => {
  const { orderDirection } = useStore(settingsState);
  const { filterString, filterType } = useStore(contentState);
  const { polyglot } = useStore(polyglotState);

  const { isBelowMedium } = useScreenWidth();

  const toggleOrderDirection = () => {
    const newOrderDirection = orderDirection === "desc" ? "asc" : "desc";
    updateSettings({ orderDirection: newOrderDirection });
  };

  useEffect(() => {
    setFilterType("title");
    setFilterString("");
  }, []);

  return (
    <div className="search-and-sort-bar">
      <Input.Search
        allowClear
        onBlur={() => setIsArticleFocused(true)}
        onFocus={() => setIsArticleFocused(false)}
        onChange={setFilterString}
        placeholder={polyglot.t("article_list.search_placeholder")}
        style={{ width: isBelowMedium ? "100%" : 272, marginLeft: 8 }}
        value={filterString}
        addBefore={
          <Select
            onChange={setFilterType}
            style={{ width: 100 }}
            value={filterType}
          >
            <Select.Option value="title">
              {polyglot.t("article_list.search_type_title")}
            </Select.Option>
            <Select.Option value="content">
              {polyglot.t("article_list.search_type_content")}
            </Select.Option>
            <Select.Option value="author">
              {polyglot.t("article_list.search_type_author")}
            </Select.Option>
          </Select>
        }
      />
      <div className="button-group">
        <Tooltip
          mini
          content={
            <div>
              {polyglot
                .t("article_list.search_tooltip")
                .split("\n")
                .map((line, index) => (
                  <Fragment key={`line-${index}-${line.length}`}>
                    {line}
                    {index <
                      polyglot.t("article_list.search_tooltip").split("\n")
                        .length -
                        1 && <br />}
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

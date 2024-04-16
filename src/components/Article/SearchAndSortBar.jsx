import { Button, Input, Select, Tooltip } from "@arco-design/web-react";
import React, { useContext } from "react";

import {
  IconSortAscending,
  IconSortDescending,
} from "@arco-design/web-react/icon";
import { useConfig } from "../../hooks/useConfig";
import useFilterEntries from "../../hooks/useFilterEntries";
import ContentContext from "../Content/ContentContext";

import { useScreenWidth } from "../../hooks/useScreenWidth";
import "./SearchAndSortBar.css";

const SearchAndSortBar = (info) => {
  const { filterString, filterType } = useContext(ContentContext);
  const { isMobileView } = useScreenWidth();

  const { setFilterString, setFilterType } = useFilterEntries(info);

  const { config, updateConfig } = useConfig();
  const { orderDirection } = config;

  return (
    <div className="search-and-sort-bar">
      <Input.Search
        allowClear
        placeholder="Search..."
        value={filterString}
        addBefore={
          <Select
            placeholder="Select type"
            onChange={setFilterType}
            style={{ width: 100 }}
            value={filterType}
          >
            <Select.Option value="0">Title</Select.Option>
            <Select.Option value="1">Content</Select.Option>
          </Select>
        }
        onChange={setFilterString}
        style={{ width: isMobileView ? "100%" : 278, marginLeft: 8 }}
      />
      <Tooltip
        mini
        position="left"
        content={orderDirection === "desc" ? "Newest first" : "Oldest first"}
      >
        <Button
          shape="circle"
          size="small"
          style={{ margin: "0 8px", flexShrink: 0 }}
          icon={
            orderDirection === "desc" ? (
              <IconSortDescending />
            ) : (
              <IconSortAscending />
            )
          }
          onClick={() => {
            const newOrderDirection =
              orderDirection === "desc" ? "asc" : "desc";
            updateConfig({ orderDirection: newOrderDirection });
          }}
        />
      </Tooltip>
    </div>
  );
};

export default SearchAndSortBar;

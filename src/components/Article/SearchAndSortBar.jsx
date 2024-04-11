import { Button, Input, Select, Tooltip } from "@arco-design/web-react";
import React, { useContext } from "react";

import {
  IconSortAscending,
  IconSortDescending,
} from "@arco-design/web-react/icon";
import useStore from "../../Store";
import useFilterEntries from "../../hooks/useFilterEntries";
import { setConfig } from "../../utils/config.js";
import ContentContext from "../Content/ContentContext";

import "./SearchAndSortBar.css";

const SearchAndSortBar = (info) => {
  const { filterString, filterType } = useContext(ContentContext);
  const activeContent = useStore((state) => state.activeContent);
  const setActiveContent = useStore((state) => state.setActiveContent);
  const orderDirection = useStore((state) => state.orderDirection);
  const toggleOrderDirection = useStore((state) => state.toggleOrderDirection);

  const { setFilterString, setFilterType } = useFilterEntries(info);

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
        onFocus={() => activeContent && setActiveContent(null)}
        onChange={setFilterString}
        style={{ width: 278, marginLeft: 8 }}
      />
      <Tooltip
        mini
        position="left"
        content={orderDirection === "desc" ? "Newest first" : "Oldest first"}
      >
        <Button
          shape="circle"
          size="small"
          style={{ margin: "0 8px" }}
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
            toggleOrderDirection();
            setConfig("orderDirection", newOrderDirection);
          }}
        />
      </Tooltip>
    </div>
  );
};

export default SearchAndSortBar;

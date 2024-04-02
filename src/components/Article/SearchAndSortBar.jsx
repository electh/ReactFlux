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

const SearchAndSortBar = () => {
  const { filterString, filterType } = useContext(ContentContext);
  const activeContent = useStore((state) => state.activeContent);
  const setActiveContent = useStore((state) => state.setActiveContent);
  const orderDirection = useStore((state) => state.orderDirection);
  const toggleOrderDirection = useStore((state) => state.toggleOrderDirection);

  const { setFilterString, setFilterType } = useFilterEntries();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "8px",
        width: "100%",
      }}
    >
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
      />
      <Tooltip
        mini
        position="left"
        content={orderDirection === "desc" ? "Newest first" : "Oldest first"}
      >
        <Button
          shape="circle"
          size="small"
          style={{ flexShrink: 0 }}
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

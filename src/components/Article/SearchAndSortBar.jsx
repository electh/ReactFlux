import { Button, Input, Select, Tooltip } from "@arco-design/web-react";

import {
  IconSortAscending,
  IconSortDescending,
} from "@arco-design/web-react/icon";
import { useConfig } from "../../hooks/useConfig";
import useFilterEntries from "../../hooks/useFilterEntries";

import { useAtomValue } from "jotai";
import { configAtom } from "../../atoms/configAtom";
import { filterStringAtom, filterTypeAtom } from "../../atoms/contentAtom";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import "./SearchAndSortBar.css";

const SearchAndSortBar = (info) => {
  const filterString = useAtomValue(filterStringAtom);
  const filterType = useAtomValue(filterTypeAtom);
  const { isMobileView } = useScreenWidth();

  const { setFilterString, setFilterType } = useFilterEntries(info);

  const config = useAtomValue(configAtom);
  const { updateConfig } = useConfig();
  const { orderDirection } = config;

  const toggleOrderDirection = () => {
    const newOrderDirection = orderDirection === "desc" ? "asc" : "desc";
    updateConfig({ orderDirection: newOrderDirection });
  };

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
          onClick={toggleOrderDirection}
        />
      </Tooltip>
    </div>
  );
};

export default SearchAndSortBar;

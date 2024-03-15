import { Input, Select } from "@arco-design/web-react";
import { useContext } from "react";

import UseFilterEntries from "../../hooks/useFilterEntries";
import { ContentContext } from "../ContentContext";

export default function SearchInput() {
  const { filterStatus, filterString, filterType } = useContext(ContentContext);

  const { handleFilter } = UseFilterEntries();

  return (
    <Input.Search
      allowClear
      placeholder="filter"
      value={filterString}
      addBefore={
        <Select
          placeholder="Please select"
          onChange={(value) => {
            handleFilter(value, filterStatus, filterString);
          }}
          style={{ width: 100 }}
          value={filterType}
        >
          <Select.Option value="0">Title</Select.Option>
          <Select.Option value="1">Content</Select.Option>
        </Select>
      }
      onChange={(value) => {
        handleFilter(filterType, filterStatus, value);
      }}
      style={{
        marginBottom: "10px",
        width: "100%",
      }}
    />
  );
}

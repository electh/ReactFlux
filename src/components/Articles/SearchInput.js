import { Input, Select } from "@arco-design/web-react";
import { useContext } from "react";

import { ContentContext } from "../ContentContext";

export default function SearchInput() {
  const { filterStatus, filterString, filterType, handleFilterEntry } =
    useContext(ContentContext);

  return (
    <Input.Search
      allowClear
      placeholder="filter"
      value={filterString}
      addBefore={
        <Select
          placeholder="Please select"
          onChange={(value) => {
            handleFilterEntry(value, filterStatus, filterString);
          }}
          style={{ width: 100 }}
          value={filterType}
        >
          <Select.Option value="0">Title</Select.Option>
          <Select.Option value="1">Content</Select.Option>
        </Select>
      }
      onChange={(value) => {
        handleFilterEntry(filterType, filterStatus, value);
      }}
      style={{
        marginBottom: "10px",
        width: "300px",
      }}
    />
  );
}

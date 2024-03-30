import { Input, Select } from "@arco-design/web-react";
import React, { useContext } from "react";

import useStore from "../../Store";
import useFilterEntries from "../../hooks/useFilterEntries";
import ContentContext from "../Content/ContentContext";

const SearchInput = () => {
  const { filterString, filterType } = useContext(ContentContext);
  const activeContent = useStore((state) => state.activeContent);
  const setActiveContent = useStore((state) => state.setActiveContent);

  const { setFilterString, setFilterType } = useFilterEntries();

  return (
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
      style={{
        marginBottom: "10px",
        width: "100%",
      }}
    />
  );
};

export default SearchInput;

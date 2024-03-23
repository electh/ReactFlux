import { Input, Select } from "@arco-design/web-react";
import { useContext } from "react";

import useStore from "../../Store";
import useFilterEntries from "../../hooks/useFilterEntries";
import ContentContext from "../Content/ContentContext";

const SearchInput = () => {
  const { filterStatus, filterString, filterType } = useContext(ContentContext);
  const activeContent = useStore((state) => state.activeContent);
  const setActiveContent = useStore((state) => state.setActiveContent);

  const { handleFilter } = useFilterEntries();

  return (
    <Input.Search
      allowClear
      placeholder="Search..."
      value={filterString}
      addBefore={
        <Select
          placeholder="Select type"
          onChange={(type) => {
            handleFilter(type, filterStatus, filterString);
          }}
          style={{ width: 100 }}
          value={filterType}
        >
          <Select.Option value="0">Title</Select.Option>
          <Select.Option value="1">Content</Select.Option>
        </Select>
      }
      onFocus={() => activeContent && setActiveContent(null)}
      onChange={(text) => handleFilter(filterType, filterStatus, text)}
      style={{
        marginBottom: "10px",
        width: "100%",
      }}
    />
  );
};

export default SearchInput;

import { Input, Select } from "@arco-design/web-react";
import { useStore } from "../../../store/Store";

export default function SearchBar() {
  const filterString = useStore((state) => state.filterString);
  const setFilterString = useStore((state) => state.setFilterString);
  const searchType = useStore((state) => state.searchType);
  const setSearchType = useStore((state) => state.setSearchType);

  return (
    <div style={{ display: "flex", width: "calc(100% - 20px)", margin: 10 }}>
      <Select
        placeholder="Please select"
        style={{ width: 140, marginRight: 4 }}
        value={searchType}
        onChange={(value) => setSearchType(value)}
      >
        <Select.Option value={"title"}>Title</Select.Option>
        <Select.Option value={"content"}>Content</Select.Option>
      </Select>
      <Input.Search
        style={{ flexGrow: 1 }}
        value={filterString}
        onChange={(value) => setFilterString(value)}
        allowClear={true}
        placeholder="Search..."
      />
    </div>
  );
}

import { Input, Select } from "@arco-design/web-react";
import { useStore } from "../../../store/Store";

export default function SearchBar() {
  const filterString = useStore((state) => state.filterString);
  const setFilterString = useStore((state) => state.setFilterString);
  const searchType = useStore((state) => state.searchType);
  const setSearchType = useStore((state) => state.setSearchType);

  return (
    <Input
      style={{ width: "calc(100% - 20px)", margin: 10 }}
      value={filterString}
      onChange={(value) => setFilterString(value)}
      addBefore={
        <Select
          placeholder="Please select"
          style={{ width: 100 }}
          value={searchType}
          onChange={(value) => setSearchType(value)}
        >
          <Select.Option value={"title"}>Title</Select.Option>
          <Select.Option value={"content"}>Content</Select.Option>
        </Select>
      }
      allowClear={true}
      placeholder="Please enter"
    />
  );
}

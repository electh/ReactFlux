import { Button, Message, Popconfirm, Radio } from "@arco-design/web-react";
import { IconCheck } from "@arco-design/web-react/icon";
import { forwardRef, useCallback, useContext } from "react";

import useStore from "../../Store";
import useFilterEntries from "../../hooks/useFilterEntries";
import ContentContext from "./ContentContext";

const FilterAndMarkPanel = forwardRef(({ info, markAllAsRead }, ref) => {
  const {
    entries,
    filteredEntries,
    filterStatus,
    filterString,
    filterType,
    setEntries,
    setFilteredEntries,
    setUnreadCount,
  } = useContext(ContentContext);

  const { handleFilter } = useFilterEntries();

  /*menu 数据初始化函数 */
  const initData = useStore((state) => state.initData);

  const handleMarkAllAsRead = useCallback(async () => {
    const response = await markAllAsRead();
    if (response) {
      Message.success("Success");
      await initData();
      setEntries(entries.map((entry) => ({ ...entry, status: "read" })));
      setFilteredEntries(
        filteredEntries.map((entry) => ({ ...entry, status: "read" })),
      );
      setUnreadCount(0);
    }
  }, [
    entries,
    filteredEntries,
    initData,
    markAllAsRead,
    setEntries,
    setFilteredEntries,
    setUnreadCount,
  ]);

  return info.from !== "history" ? (
    <div
      className="entry-panel"
      style={{
        // position: "absolute",
        backgroundColor: "var(--color-bg-2)",
        bottom: "0",
        display: "flex",
        flexDirection: "row",
        padding: "8px 10px",
        // width: "302px",
        zIndex: "2",
        justifyContent: "space-between",
        borderTop: "1px solid var(--color-border-2)",
      }}
    >
      <Radio.Group
        type="button"
        name="lang"
        value={filterStatus}
        onChange={(value) => {
          if (ref.current) {
            ref.current.scrollTo(0, 0);
          }
          handleFilter(filterType, value, filterString);
        }}
      >
        <Radio value="all">ALL</Radio>
        <Radio value="unread">UNREAD</Radio>
      </Radio.Group>
      {info.from !== "starred" && (
        <Popconfirm
          focusLock
          title="Mark All As Read?"
          onOk={handleMarkAllAsRead}
        >
          <Button icon={<IconCheck />} shape="circle" />
        </Popconfirm>
      )}
    </div>
  ) : null;
});

export default FilterAndMarkPanel;

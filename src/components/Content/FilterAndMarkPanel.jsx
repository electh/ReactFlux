import { Button, Message, Popconfirm, Radio } from "@arco-design/web-react";
import { IconCheck } from "@arco-design/web-react/icon";
import { forwardRef, useContext } from "react";

import useStore from "../../Store";
import UseFilterEntries from "../../hooks/useFilterEntries";
import ContentContext from "./ContentContext";

const FilterAndMarkPanel = forwardRef(({ info, markAllAsRead }, ref) => {
  const {
    allEntries,
    entries,
    filterStatus,
    filterString,
    filterType,
    setAllEntries,
    setEntries,
    setUnreadCount,
  } = useContext(ContentContext);

  const { handleFilter } = UseFilterEntries();

  /*menu 数据初始化函数 */
  const initData = useStore((state) => state.initData);

  const handleMarkAllAsRead = () => {
    const readAll = async () => {
      const response = await markAllAsRead();
      response && Message.success("Success");
      await initData();
      setAllEntries(allEntries.map((e) => ({ ...e, status: "read" })));
      setEntries(entries.map((e) => ({ ...e, status: "read" })));
      setUnreadCount(0);
    };
    readAll();
  };

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
          onOk={() => handleMarkAllAsRead()}
        >
          <Button icon={<IconCheck />} shape="circle" />
        </Popconfirm>
      )}
    </div>
  ) : null;
});

export default FilterAndMarkPanel;

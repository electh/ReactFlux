import { Button, Message, Popconfirm, Radio } from "@arco-design/web-react";
import { IconCheck, IconRefresh } from "@arco-design/web-react/icon";
import React, { forwardRef, useCallback, useContext, useEffect } from "react";

import useStore from "../../Store";
import useFilterEntries from "../../hooks/useFilterEntries";
import ContentContext from "./ContentContext";

const FooterPanel = forwardRef(
  ({ info, refreshArticleList, markAllAsRead }, ref) => {
    const {
      entries,
      filteredEntries,
      filterStatus,
      filterString,
      filterType,
      loading,
      setEntries,
      setFilteredEntries,
      setFilterStatus,
      setUnreadCount,
    } = useContext(ContentContext);

    const { handleFilter } = useFilterEntries();

    /*menu 数据初始化函数 */
    const initData = useStore((state) => state.initData);

    const showStatus = useStore((state) => state.showStatus);

    const handleMarkAllAsRead = useCallback(async () => {
      markAllAsRead()
        .then(() => {
          Message.success("Marked all as read successfully");
          initData();
          setEntries(entries.map((entry) => ({ ...entry, status: "read" })));
          setFilteredEntries(
            filteredEntries.map((entry) => ({ ...entry, status: "read" })),
          );
          setUnreadCount(0);
        })
        .catch(() => {
          Message.error("Failed to mark all as read");
        });
    }, [
      entries,
      filteredEntries,
      initData,
      markAllAsRead,
      setEntries,
      setFilteredEntries,
      setUnreadCount,
    ]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
      setFilterStatus(showStatus);
    }, [showStatus]);

    return (
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
        {info.from !== "starred" && info.from !== "history" && (
          <Popconfirm
            focusLock
            title="Mark All As Read?"
            onOk={handleMarkAllAsRead}
          >
            <Button icon={<IconCheck />} shape="circle" />
          </Popconfirm>
        )}
        <Button
          icon={<IconRefresh />}
          loading={loading}
          shape="circle"
          onClick={refreshArticleList}
        />
      </div>
    );
  },
);

export default FooterPanel;

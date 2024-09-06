import { Button, Message, Popconfirm, Radio } from "@arco-design/web-react";
import { IconCheck, IconRefresh } from "@arco-design/web-react/icon";
import { forwardRef, useEffect } from "react";

import { useStore } from "@nanostores/react";
import {
  contentState,
  setEntries,
  setFilterStatus,
  setFilterString,
  setFilterType,
  setUnreadCount,
  setUnreadEntries,
} from "../../store/contentState";
import { fetchData } from "../../store/dataState";
import "./FooterPanel.css";

const updateAllEntriesAsRead = () => {
  setEntries((prev) => prev.map((entry) => ({ ...entry, status: "read" })));
  setUnreadEntries((prev) =>
    prev.map((entry) => ({
      ...entry,
      status: "read",
    })),
  );
  setUnreadCount(0);
};

const FooterPanel = forwardRef(
  ({ info, refreshArticleList, markAllAsRead }, ref) => {
    const { filterStatus, loading } = useStore(contentState);

    const handleMarkAllAsRead = async () => {
      try {
        await markAllAsRead();
        await fetchData();
        updateAllEntriesAsRead();
        Message.success("All articles marked as read");
      } catch (error) {
        Message.error("Failed to mark all as read");
      }
    };

    const handleFilterChange = (value) => {
      if (ref.current) {
        ref.current.scrollTo(0, 0);
      }
      setFilterStatus(value);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
      setFilterType("title");
      setFilterString("");
    }, [filterStatus]);

    return (
      <div className="entry-panel">
        {!["starred", "history"].includes(info.from) && (
          <Popconfirm
            focusLock
            title="Mark All As Read?"
            onOk={handleMarkAllAsRead}
          >
            <Button icon={<IconCheck />} shape="circle" />
          </Popconfirm>
        )}
        <Radio.Group
          disabled={info.from === "history"}
          onChange={handleFilterChange}
          options={[
            { label: "ALL", value: "all" },
            { label: "UNREAD", value: "unread" },
          ]}
          type="button"
          value={filterStatus}
        />
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

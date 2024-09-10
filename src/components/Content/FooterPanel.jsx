import { Button, Message, Popconfirm, Radio } from "@arco-design/web-react";
import { IconCheck, IconRefresh } from "@arco-design/web-react/icon";
import { forwardRef, useEffect } from "react";

import { useStore } from "@nanostores/react";
import {
  contentState,
  setEntries,
  setFilterString,
  setFilterType,
} from "../../store/contentState";
import { fetchData } from "../../store/dataState";
import { settingsState, updateSettings } from "../../store/settingsState";
import "./FooterPanel.css";

const updateAllEntriesAsRead = () => {
  setEntries((prev) => prev.map((entry) => ({ ...entry, status: "read" })));
};

const FooterPanel = forwardRef(
  ({ info, refreshArticleList, markAllAsRead }, ref) => {
    const { isArticleListReady } = useStore(contentState);
    const { showStatus } = useStore(settingsState);

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
      updateSettings({ showStatus: value });
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
      setFilterType("title");
      setFilterString("");
    }, [showStatus]);

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
          value={info.from === "history" ? "all" : showStatus}
        />
        <Button
          icon={<IconRefresh />}
          loading={!isArticleListReady}
          shape="circle"
          onClick={refreshArticleList}
        />
      </div>
    );
  },
);

export default FooterPanel;

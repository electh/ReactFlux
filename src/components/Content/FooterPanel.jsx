import { Button, Message, Popconfirm, Radio } from "@arco-design/web-react";
import { IconCheck, IconRefresh } from "@arco-design/web-react/icon";
import { forwardRef, useEffect } from "react";

import useFilterEntries from "../../hooks/useFilterEntries";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { configAtom } from "../../atoms/configAtom";
import {
  entriesAtom,
  filteredEntriesAtom,
  loadingAtom,
  unreadCountAtom,
  unreadEntriesAtom,
} from "../../atoms/contentAtom";
import { useFetchData } from "../../hooks/useFetchData";
import "./FooterPanel.css";

const FooterPanel = forwardRef(
  ({ info, refreshArticleList, markAllAsRead }, ref) => {
    const [entries, setEntries] = useAtom(entriesAtom);
    const [unreadEntries, setUnreadEntries] = useAtom(unreadEntriesAtom);
    const loading = useAtomValue(loadingAtom);
    const setFilteredEntries = useSetAtom(filteredEntriesAtom);
    const setUnreadCount = useSetAtom(unreadCountAtom);

    const { filterStatus, setFilterStatus } = useFilterEntries(info);

    /*menu 数据初始化函数 */
    const config = useAtomValue(configAtom);
    const { fetchData } = useFetchData();
    const { showStatus } = config;

    const handleMarkAllAsRead = async () => {
      try {
        await markAllAsRead();
        Message.success("Marked all as read successfully");
        fetchData();
        setEntries((prev) =>
          prev.map((entry) => ({ ...entry, status: "read" })),
        );
        setUnreadEntries([]);
        if (filterStatus === "all") {
          setFilteredEntries((prev) =>
            prev.map((entry) => ({ ...entry, status: "read" })),
          );
        } else {
          setFilteredEntries([]);
        }
        setUnreadCount(0);
      } catch (error) {
        Message.error("Failed to mark all as read");
      }
    };

    useEffect(() => {
      if (["starred", "history"].includes(info.from)) {
        setFilterStatus("all");
      } else {
        setFilterStatus(showStatus);
      }
    }, [info, setFilterStatus, showStatus]);

    const handleRadioChange = (value) => {
      if (ref.current) {
        ref.current.scrollTo(0, 0);
      }
      setFilterStatus(value);
      if (value === "all") {
        setFilteredEntries(entries);
      } else {
        setFilteredEntries(unreadEntries);
      }
    };

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
          onChange={(value) => handleRadioChange(value)}
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

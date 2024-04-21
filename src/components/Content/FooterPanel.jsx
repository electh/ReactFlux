import { Button, Message, Popconfirm, Radio } from "@arco-design/web-react";
import { IconCheck, IconRefresh } from "@arco-design/web-react/icon";
import { forwardRef, useEffect } from "react";

import useFilterEntries from "../../hooks/useFilterEntries";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { configAtom } from "../../atoms/configAtom";
import {
  entriesAtom,
  filterStatusAtom,
  filteredEntriesAtom,
  loadingAtom,
  unreadCountAtom,
  unreadEntriesAtom,
} from "../../atoms/contentAtom";
import { useLoadData } from "../../hooks/useLoadData";
import "./FooterPanel.css";

const FooterPanel = forwardRef(
  ({ info, refreshArticleList, markAllAsRead }, ref) => {
    const [entries, setEntries] = useAtom(entriesAtom);
    const [filteredEntries, setFilteredEntries] = useAtom(filteredEntriesAtom);
    const [unreadEntries, setUnreadEntries] = useAtom(unreadEntriesAtom);
    const filterStatus = useAtomValue(filterStatusAtom);
    const loading = useAtomValue(loadingAtom);
    const setUnreadCount = useSetAtom(unreadCountAtom);

    const { setFilterStatus } = useFilterEntries(info);

    /*menu 数据初始化函数 */
    const config = useAtomValue(configAtom);
    const { loadData } = useLoadData();
    const { showStatus } = config;

    const handleMarkAllAsRead = async () => {
      try {
        await markAllAsRead();
        Message.success("Marked all as read successfully");
        loadData();
        setEntries(entries.map((entry) => ({ ...entry, status: "read" })));
        setUnreadEntries([]);
        if (filterStatus === "all") {
          setFilteredEntries(
            filteredEntries.map((entry) => ({ ...entry, status: "read" })),
          );
        } else {
          setFilteredEntries([]);
        }
        setUnreadCount(0);
      } catch (error) {
        Message.error("Failed to mark all as read");
      }
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
      if (info.from === "history") {
        setFilterStatus("all");
      }
    }, []);

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
      if (info.from !== "history") {
        setFilterStatus(showStatus);
      }
    }, [showStatus]);

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
          name="lang"
          onChange={(value) => handleRadioChange(value)}
          type="button"
          value={info.from === "history" ? "all" : filterStatus}
        >
          <Radio value="all">ALL</Radio>
          <Radio value="unread">UNREAD</Radio>
        </Radio.Group>

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

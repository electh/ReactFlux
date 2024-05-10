import { Button, Message, Popconfirm, Radio } from "@arco-design/web-react";
import { IconCheck, IconRefresh } from "@arco-design/web-react/icon";
import { forwardRef, useEffect } from "react";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  entriesAtom,
  filterStatusAtom,
  filterStringAtom,
  filterTypeAtom,
  loadingAtom,
  unreadCountAtom,
  unreadEntriesAtom,
} from "../../atoms/contentAtom";
import { useFetchData } from "../../hooks/useFetchData";
import "./FooterPanel.css";

const FooterPanel = forwardRef(
  ({ info, refreshArticleList, markAllAsRead }, ref) => {
    const loading = useAtomValue(loadingAtom);
    const setEntries = useSetAtom(entriesAtom);
    const setUnreadEntries = useSetAtom(unreadEntriesAtom);
    const setFilterString = useSetAtom(filterStringAtom);
    const setFilterType = useSetAtom(filterTypeAtom);
    const setUnreadCount = useSetAtom(unreadCountAtom);
    const [filterStatus, setFilterStatus] = useAtom(filterStatusAtom);

    /*menu 数据初始化函数 */
    const { fetchData } = useFetchData();

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
          setEntries((prev) =>
            prev.map((entry) => ({ ...entry, status: "read" })),
          );
        } else {
          setUnreadEntries([]);
        }
        setUnreadCount(0);
      } catch (error) {
        Message.error("Failed to mark all as read");
      }
    };

    const handleRadioChange = (value) => {
      if (ref.current) {
        ref.current.scrollTo(0, 0);
      }
      setFilterStatus(value);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
      setFilterType("0");
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

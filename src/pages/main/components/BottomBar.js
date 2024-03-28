import { Button, Message, Popconfirm, Radio } from "@arco-design/web-react";
import { useStore } from "../../../store/Store";
import { IconCheck, IconRefresh } from "@arco-design/web-react/icon";
import {
  getCurrentUser,
  markCategoryEntriesAsRead,
  markFeedEntriesAsRead,
  markUserEntriesAsRead,
} from "../../../api/api";
import { useSearchParams } from "react-router-dom";

export default function BottomBar() {
  const unreadOnly = useStore((state) => state.unreadOnly);
  const setUnreadOnly = useStore((state) => state.setUnreadOnly);
  const entries = useStore((state) => state.entries);
  const setEntries = useStore((state) => state.setEntries);
  const loading = useStore((state) => state.loading);
  const initData = useStore((state) => state.initData);
  const showEntries = useStore((state) => state.showEntries);
  const setShowEntries = useStore((state) => state.setShowEntries);
  const isMobile = useStore((state) => state.isMobile);

  const [params] = useSearchParams();
  const from = params.get("from") || "all";
  const id = params.get("id") || "";

  const markAllAsRead = (from, id) => {
    const readAll = async (from, id) => {
      if (from === "all") {
        setEntries(entries.map((a) => ({ ...a, status: "read" })));
        setShowEntries(showEntries.map((a) => ({ ...a, status: "read" })));
        const userResp = await getCurrentUser();
        const userId = userResp.data?.id;
        const resp = await markUserEntriesAsRead(userId);
        resp?.status === 204 && Message.success("Success");
      }
      if (from === "category") {
        setEntries(
          entries.map((a) =>
            a.feed.category.id === parseInt(id) ? { ...a, status: "read" } : a,
          ),
        );
        setShowEntries(
          showEntries.map((a) =>
            a.feed.category.id === parseInt(id) ? { ...a, status: "read" } : a,
          ),
        );
        const resp = await markCategoryEntriesAsRead(id);
        resp?.status === 204 && Message.success("Success");
      }
      if (from === "feed") {
        setEntries(
          entries.map((a) =>
            a.feed.id === parseInt(id) ? { ...a, status: "read" } : a,
          ),
        );
        setShowEntries(
          showEntries.map((a) =>
            a.feed.id === parseInt(id) ? { ...a, status: "read" } : a,
          ),
        );
        const resp = await markFeedEntriesAsRead(id);
        resp?.status === 204 && Message.success("Success");
      }
    };
    readAll(from, id);
  };

  return (
    <div
      className="bottom-bar"
      style={{
        display: "flex",
        width: isMobile ? "calc(100% - 50px)" : "280px",
        bottom: 0,
        zIndex: "2",
        justifyContent: "space-between",
        alignItems: "center",
        padding: isMobile ? "7px 25px 34px 25px" : 10,
        backgroundColor: "var(--color-bg-4)",
        borderTop: "1px solid var(--color-border-2)",
      }}
    >
      <Button
        icon={<IconRefresh />}
        shape="circle"
        loading={loading}
        onClick={initData}
      />
      <Radio.Group
        type="button"
        name="unreadOnly"
        value={unreadOnly}
        onChange={(value) => setUnreadOnly(value)}
      >
        <Radio value={false}>All</Radio>
        <Radio value={true}>Unread</Radio>
      </Radio.Group>
      <Popconfirm
        disabled={from === "starred"}
        focusLock
        position="tr"
        title="Mark all as read?"
        onOk={() => {
          markAllAsRead(from, id);
        }}
      >
        <Button
          icon={<IconCheck />}
          shape="circle"
          disabled={from === "starred"}
        />
      </Popconfirm>
    </div>
  );
}

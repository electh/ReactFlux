import { Button, Message, Popconfirm, Radio } from "@arco-design/web-react";
import { IconCheck, IconRefresh } from "@arco-design/web-react/icon";
import { useEffect } from "react";

import { useStore } from "@nanostores/react";
import useAppData from "../../hooks/useAppData";
import { polyglotState } from "../../hooks/useLanguage";
import {
  contentState,
  setEntries,
  setFilterString,
  setFilterType,
} from "../../store/contentState";
import { settingsState, updateSettings } from "../../store/settingsState";
import "./FooterPanel.css";

const updateAllEntriesAsRead = () => {
  setEntries((prev) => prev.map((entry) => ({ ...entry, status: "read" })));
};

const FooterPanel = ({ info, refreshArticleList, markAllAsRead }) => {
  const { isArticleListReady } = useStore(contentState);
  const { showStatus } = useStore(settingsState);
  const { polyglot } = useStore(polyglotState);

  const { fetchAppData } = useAppData();

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      updateAllEntriesAsRead();
      await fetchAppData();
      Message.success(polyglot.t("article_list.mark_all_as_read_success"));
    } catch (error) {
      Message.error(polyglot.t("article_list.mark_all_as_read_error"));
    }
  };

  const handleFilterChange = (value) => {
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
          title={polyglot.t("article_list.mark_all_as_read_confirm")}
          onOk={handleMarkAllAsRead}
        >
          <Button icon={<IconCheck />} shape="circle" />
        </Popconfirm>
      )}
      <Radio.Group
        disabled={info.from === "history"}
        onChange={handleFilterChange}
        options={[
          { label: polyglot.t("article_list.filter_status_all"), value: "all" },
          {
            label: polyglot.t("article_list.filter_status_unread"),
            value: "unread",
          },
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
};

export default FooterPanel;

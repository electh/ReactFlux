import { Button, Notification, Popconfirm, Radio } from "@arco-design/web-react"
import { IconCheck, IconRefresh } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"

import CustomTooltip from "@/components/ui/CustomTooltip"
import useAppData from "@/hooks/useAppData"
import { polyglotState } from "@/hooks/useLanguage"
import { contentState, setEntries } from "@/store/contentState"
import { settingsState, updateSettings } from "@/store/settingsState"
import "./FooterPanel.css"

const updateAllEntriesAsRead = () => {
  setEntries((prev) => prev.map((entry) => ({ ...entry, status: "read" })))
}

const FooterPanel = ({ info, refreshArticleList, markAllAsRead }) => {
  const { isArticleListReady } = useStore(contentState)
  const { showStatus } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)

  const { fetchAppData } = useAppData()

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      updateAllEntriesAsRead()
      await fetchAppData()
      Notification.success({
        title: polyglot.t("article_list.mark_all_as_read_success"),
      })
    } catch (error) {
      console.error("Failed to mark all as read: ", error)
      Notification.error({
        title: polyglot.t("article_list.mark_all_as_read_error"),
        content: error.message,
      })
    }
  }

  const handleFilterChange = (value) => {
    updateSettings({ showStatus: value })
  }

  return (
    <div className="entry-panel">
      <Popconfirm
        focusLock
        title={polyglot.t("article_list.mark_all_as_read_confirm")}
        onOk={handleMarkAllAsRead}
      >
        <CustomTooltip mini content={polyglot.t("article_list.mark_all_as_read_tooltip")}>
          <Button
            icon={<IconCheck />}
            shape="circle"
            style={{
              visibility: ["starred", "history"].includes(info.from) ? "hidden" : "visible",
            }}
          />
        </CustomTooltip>
      </Popconfirm>
      <Radio.Group
        style={{ visibility: info.from === "history" ? "hidden" : "visible" }}
        type="button"
        value={showStatus}
        options={[
          { label: polyglot.t("article_list.filter_status_all"), value: "all" },
          {
            label: polyglot.t("article_list.filter_status_unread"),
            value: "unread",
          },
        ]}
        onChange={handleFilterChange}
      />
      <CustomTooltip mini content={polyglot.t("article_list.refresh_tooltip")}>
        <Button
          icon={<IconRefresh />}
          loading={!isArticleListReady}
          shape="circle"
          onClick={refreshArticleList}
        />
      </CustomTooltip>
    </div>
  )
}

export default FooterPanel

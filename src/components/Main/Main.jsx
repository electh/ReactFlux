import { Form, Input, Message, Modal, Select, Switch } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router"

import { addFeed } from "@/apis"
import { ContextProvider } from "@/components/Content/ContentContext"
import SettingsTabs from "@/components/Settings/SettingsTabs"
import useAppData from "@/hooks/useAppData"
import { polyglotState } from "@/hooks/useLanguage"
import useModalToggle from "@/hooks/useModalToggle"
import useScreenWidth from "@/hooks/useScreenWidth"
import { categoriesState, feedsState } from "@/store/dataState"
import { includesIgnoreCase } from "@/utils/filter"
import "./Main.css"

const urlRule = [{ required: true }]
const categoryRule = [{ required: true }]
const crawlerRule = [{ type: "boolean" }]

const SettingsModal = () => {
  const location = useLocation()

  const { isBelowMedium } = useScreenWidth()
  const {
    setSettingsModalVisible,
    setSettingsTabsActiveTab,
    settingsModalVisible,
    settingsTabsActiveTab,
  } = useModalToggle()

  useEffect(() => {
    if (isBelowMedium && settingsModalVisible) {
      setSettingsModalVisible(false)
    }
  }, [location.pathname])

  return (
    <Modal
      autoFocus
      focusLock
      unmountOnExit
      alignCenter={false}
      className="settings-modal"
      footer={null}
      title={null}
      visible={settingsModalVisible}
      onCancel={() => {
        setSettingsModalVisible(false)
        setSettingsTabsActiveTab("1")
      }}
    >
      <SettingsTabs activeTab={settingsTabsActiveTab} onTabChange={setSettingsTabsActiveTab} />
    </Modal>
  )
}

const AddFeedModal = () => {
  const { polyglot } = useStore(polyglotState)
  const categories = useStore(categoriesState)
  const feeds = useStore(feedsState)

  const [feedModalLoading, setFeedModalLoading] = useState(false)
  const [feedForm] = Form.useForm()

  const { fetchFeedRelatedData } = useAppData()
  const { addFeedModalVisible, setAddFeedModalVisible } = useModalToggle()

  const navigate = useNavigate()

  const handleAddFeed = async (url, categoryId, isFullText) => {
    setFeedModalLoading(true)
    const id = "add-feed-loading"

    try {
      if (feeds.some((feed) => feed.feed_url === url)) {
        Message.error(polyglot.t("main.add_feed_error_duplicate"))
        return
      }

      const response = await addFeed(url, categoryId, isFullText)
      Message.loading({ id, duration: 0, content: polyglot.t("main.add_feed_loading") })

      fetchFeedRelatedData()
        .then(() => {
          Message.success({ id, content: polyglot.t("main.add_feed_success") })
          setAddFeedModalVisible(false)
          navigate(`/feed/${response.feed_id}`)
          feedForm.resetFields()
          return null
        })
        .catch((error) => {
          console.error("Failed to fetch feed related data: ", error)
          Message.error({ id, content: polyglot.t("main.add_feed_error") })
        })
    } catch (error) {
      console.error("Failed to add a feed: ", error)
      Message.error({ id, content: polyglot.t("main.add_feed_error") })
    } finally {
      setFeedModalLoading(false)
    }
  }

  return (
    <Modal
      unmountOnExit
      confirmLoading={feedModalLoading}
      style={{ width: "400px", maxWidth: "95%" }}
      title={polyglot.t("main.add_feed_modal_title")}
      visible={addFeedModalVisible}
      onOk={feedForm.submit}
      onCancel={() => {
        setAddFeedModalVisible(false)
        feedForm.resetFields()
      }}
    >
      <Form
        form={feedForm}
        labelCol={{ span: 7 }}
        layout="vertical"
        wrapperCol={{ span: 17 }}
        onSubmit={async (values) => {
          const url = values.url.trim()
          if (url) {
            await handleAddFeed(url, values.category, values.crawler)
          } else {
            Message.error(polyglot.t("main.add_feed_url_empty"))
          }
        }}
      >
        <Form.Item
          field="url"
          label={polyglot.t("main.add_feed_modal_feed_url_label")}
          rules={urlRule}
        >
          <Input placeholder={polyglot.t("main.add_feed_modal_feed_url_placeholder")} />
        </Form.Item>
        <Form.Item
          required
          field="category"
          label={polyglot.t("main.add_feed_modal_category_label")}
          rules={categoryRule}
        >
          <Select
            showSearch
            placeholder={polyglot.t("main.add_feed_modal_category_placeholder")}
            filterOption={(inputValue, option) =>
              includesIgnoreCase(option.props.children, inputValue)
            }
          >
            {categories.map((category) => (
              <Select.Option key={category.id} value={category.id}>
                {category.title}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          field="crawler"
          initialValue={false}
          label={polyglot.t("main.add_feed_modal_crawler_label")}
          rules={crawlerRule}
          style={{ marginBottom: 0 }}
          triggerPropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}

const Main = () => (
  <div className="main">
    <ContextProvider>
      <Outlet />
    </ContextProvider>
    <SettingsModal />
    <AddFeedModal />
  </div>
)

export default Main

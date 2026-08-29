import { Form, Input, Message, Select, Switch } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router"

import { addFeed } from "@/apis"
import { ContextProvider } from "@/components/Content/ContentContext"
import AccessibleModal from "@/components/ui/AccessibleModal"
import useAppData from "@/hooks/useAppData"
import { polyglotState } from "@/hooks/useLanguage"
import useModalToggle from "@/hooks/useModalToggle"
import useScreenWidth from "@/hooks/useScreenWidth"
import { categoriesState, feedsState } from "@/store/dataState"
import { includesIgnoreCase } from "@/utils/filter"
import "./Main.css"

const SettingsTabs = lazy(() => import("@/components/Settings/SettingsTabs"))

const urlRule = [{ required: true }]
const categoryRule = [{ required: true }]
const crawlerRule = [{ type: "boolean" }]

const SettingsModal = () => {
  const location = useLocation()
  const { polyglot } = useStore(polyglotState)

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

  const settingsTitle = polyglot.t("sidebar.settings")

  return (
    <AccessibleModal
      unmountOnExit
      alignCenter={false}
      className="settings-modal"
      closeLabel={polyglot.t("actions.close_dialog", { name: settingsTitle })}
      dialogLabel={settingsTitle}
      fallbackFocusSelector=".sidebar-profile-trigger"
      footer={null}
      title={null}
      visible={settingsModalVisible}
      wrapClassName="settings-modal-wrapper"
      onCancel={() => {
        setSettingsModalVisible(false)
        setSettingsTabsActiveTab("1")
      }}
    >
      <Suspense fallback={<div aria-busy="true" className="settings-modal-loading" />}>
        <SettingsTabs activeTab={settingsTabsActiveTab} onTabChange={setSettingsTabsActiveTab} />
      </Suspense>
    </AccessibleModal>
  )
}

const AddFeedModal = () => {
  const { polyglot } = useStore(polyglotState)
  const categories = useStore(categoriesState)
  const feeds = useStore(feedsState)
  const { isBelowMedium } = useScreenWidth()

  const [feedModalLoading, setFeedModalLoading] = useState(false)
  const [feedForm] = Form.useForm()
  const feedUrlInputRef = useRef(null)

  const { fetchFeedRelatedData } = useAppData()
  const { addFeedModalVisible, setAddFeedModalVisible } = useModalToggle()

  const navigate = useNavigate()
  const modalTitle = polyglot.t("main.add_feed_modal_title")

  const handleAfterOpen = () => feedUrlInputRef.current?.focus()

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
          console.error("Failed to fetch feed related data:", error)
          Message.error({ id, content: polyglot.t("main.add_feed_error") })
        })
    } catch (error) {
      console.error("Failed to add a feed:", error)
      Message.error({ id, content: polyglot.t("main.add_feed_error") })
    } finally {
      setFeedModalLoading(false)
    }
  }

  return (
    <AccessibleModal
      unmountOnExit
      afterOpen={handleAfterOpen}
      className="add-feed-modal"
      closeLabel={polyglot.t("actions.close_dialog", { name: modalTitle })}
      confirmLoading={feedModalLoading}
      title={modalTitle}
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
          <Input
            ref={feedUrlInputRef}
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="url"
            placeholder={polyglot.t("main.add_feed_modal_feed_url_placeholder")}
            spellCheck={false}
          />
        </Form.Item>
        <Form.Item
          required
          field="category"
          label={polyglot.t("main.add_feed_modal_category_label")}
          rules={categoryRule}
        >
          <Select
            showSearch
            getPopupContainer={isBelowMedium ? () => document.body : undefined}
            placeholder={polyglot.t("main.add_feed_modal_category_placeholder")}
            filterOption={(inputValue, option) =>
              includesIgnoreCase(option.props.children, inputValue)
            }
            triggerProps={{
              boundaryDistance: { bottom: 8, left: 8, right: 8, top: 8 },
              className: "add-feed-category-select-popup",
            }}
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
          <Switch className="add-feed-switch" />
        </Form.Item>
      </Form>
    </AccessibleModal>
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

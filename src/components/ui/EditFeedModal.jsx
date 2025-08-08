import { Form, Input, Message, Modal, Notification, Select, Switch } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import { updateFeed } from "@/apis"
import { polyglotState } from "@/hooks/useLanguage"
import { categoriesState, setFeedsData } from "@/store/dataState"

const EditFeedModal = ({
  visible,
  setVisible,
  feedForm,
  selectedFeed,
  onSuccess,
  useNotification = false,
}) => {
  const { polyglot } = useStore(polyglotState)
  const categories = useStore(categoriesState)

  const editFeed = async (feedId, newDetails) => {
    try {
      const data = await updateFeed(feedId, newDetails)
      setFeedsData((feeds) =>
        feeds.map((feed) => (feed.id === feedId ? { ...feed, ...data } : feed)),
      )

      const successMessage = polyglot.t("feed_table.update_feed_success")

      if (useNotification) {
        Notification.success({ title: successMessage })
      } else {
        Message.success(successMessage)
      }

      setVisible(false)
      feedForm.resetFields()

      if (onSuccess) {
        onSuccess(data)
      }
    } catch (error) {
      console.error("Failed to update feed: ", error)

      const errorMessage = polyglot.t("feed_table.update_feed_error")

      if (useNotification) {
        Notification.error({ title: errorMessage })
      } else {
        Message.error(errorMessage)
      }
    }
  }

  const handleCancel = () => {
    setVisible(false)
    feedForm.resetFields()
  }

  const handleSubmit = async (values) => {
    const newDetails = {
      categoryId: values.categoryId,
      title: values.title,
      siteUrl: values.siteUrl?.trim(),
      feedUrl: values.feedUrl?.trim(),
      hidden: values.hidden,
      disabled: values.disabled,
      isFullText: values.crawler,
    }

    if (newDetails.feedUrl) {
      await editFeed(selectedFeed?.id || selectedFeed?.key, newDetails)
    } else {
      const errorMessage = polyglot.t("feed_table.modal_edit_feed_submit_error")

      if (useNotification) {
        Notification.error({ title: errorMessage })
      } else {
        Message.error(errorMessage)
      }
    }
  }

  if (!selectedFeed) {
    return null
  }

  return (
    <Modal
      unmountOnExit
      className="edit-modal"
      closable={false}
      title={polyglot.t("feed_table.modal_edit_feed_title")}
      visible={visible}
      onCancel={handleCancel}
      onOk={feedForm.submit}
    >
      <Form
        form={feedForm}
        labelCol={{ span: 7 }}
        layout="vertical"
        wrapperCol={{ span: 17 }}
        onSubmit={handleSubmit}
      >
        <Form.Item
          required
          field="categoryId"
          label={polyglot.t("feed_table.modal_edit_feed_category_label")}
          rules={[{ required: true }]}
        >
          <Select>
            {categories.map((category) => (
              <Select.Option key={category.id} value={category.id}>
                {category.title}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          field="title"
          label={polyglot.t("feed_table.modal_edit_feed_title_label")}
          rules={[{ required: true }]}
        >
          <Input placeholder={polyglot.t("feed_table.modal_edit_feed_title_placeholder")} />
        </Form.Item>

        <Form.Item
          field="siteUrl"
          label={polyglot.t("feed_table.modal_edit_feed_site_url_label")}
          rules={[{ required: true }]}
        >
          <Input placeholder={polyglot.t("feed_table.modal_edit_feed_site_url_placeholder")} />
        </Form.Item>

        <Form.Item
          field="feedUrl"
          label={polyglot.t("feed_table.modal_edit_feed_feed_url_label")}
          rules={[{ required: true }]}
        >
          <Input placeholder={polyglot.t("feed_table.modal_edit_feed_feed_url_placeholder")} />
        </Form.Item>

        <Form.Item
          field="hidden"
          initialValue={selectedFeed.hidden || selectedFeed.hide_globally}
          label={polyglot.t("feed_table.modal_edit_feed_hidden_label")}
          rules={[{ type: "boolean" }]}
          triggerPropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          field="disabled"
          initialValue={selectedFeed.disabled}
          label={polyglot.t("feed_table.modal_edit_feed_disabled_label")}
          rules={[{ type: "boolean" }]}
          triggerPropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          field="crawler"
          label={polyglot.t("feed_table.modal_edit_feed_crawler_label")}
          rules={[{ type: "boolean" }]}
          tooltip={<div>{polyglot.t("feed_table.modal_edit_feed_crawler_tooltip")}</div>}
          triggerPropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default EditFeedModal

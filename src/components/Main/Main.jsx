import {
  Form,
  Input,
  Message,
  Modal,
  Select,
  Switch,
} from "@arco-design/web-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";

import { useStore } from "@nanostores/react";
import { addFeed } from "../../apis";
import useAppData from "../../hooks/useAppData";
import { polyglotState } from "../../hooks/useLanguage";
import { useModalToggle } from "../../hooks/useModalToggle";
import { categoriesState } from "../../store/dataState";
import { includesIgnoreCase } from "../../utils/filter";
import SettingsTabs from "../Settings/SettingsTabs";
import "./Main.css";

const urlRule = [{ required: true }];
const categoryRule = [{ required: true }];
const crawlerRule = [{ type: "boolean" }];

const SettingsModal = () => {
  const { setSettingsModalVisible, settingsModalVisible } = useModalToggle();

  return (
    <Modal
      alignCenter={false}
      autoFocus={false}
      className="settings-modal"
      focusLock
      footer={null}
      onCancel={() => setSettingsModalVisible(false)}
      title={null}
      unmountOnExit
      visible={settingsModalVisible}
    >
      <SettingsTabs />
    </Modal>
  );
};

const AddFeedModal = () => {
  const categories = useStore(categoriesState);
  const { polyglot } = useStore(polyglotState);

  const { addFeedModalVisible, setAddFeedModalVisible } = useModalToggle();

  const [feedModalLoading, setFeedModalLoading] = useState(false);
  const [feedForm] = Form.useForm();

  const { fetchAppData } = useAppData();

  const handleAddFeed = async (url, categoryId, isFullText) => {
    setFeedModalLoading(true);
    try {
      await addFeed(url, categoryId, isFullText);
      await fetchAppData();
      Message.success(polyglot.t("main.add_feed_success"));
      setAddFeedModalVisible(false);
      feedForm.resetFields();
    } catch (error) {
      Message.error(polyglot.t("main.add_feed_error"));
    } finally {
      setFeedModalLoading(false);
    }
  };

  return (
    <Modal
      title={polyglot.t("main.add_feed_modal_title")}
      visible={addFeedModalVisible}
      unmountOnExit
      style={{ width: "400px" }}
      onOk={feedForm.submit}
      confirmLoading={feedModalLoading}
      onCancel={() => {
        setAddFeedModalVisible(false);
        feedForm.resetFields();
      }}
    >
      <Form
        form={feedForm}
        labelCol={{ span: 7 }}
        layout="vertical"
        wrapperCol={{ span: 17 }}
        onSubmit={async (values) => {
          const url = values.url.trim();
          if (url) {
            await handleAddFeed(url, values.category, values.crawler);
          } else {
            Message.error(polyglot.t("main.add_feed_url_empty"));
          }
        }}
      >
        <Form.Item
          label={polyglot.t("main.add_feed_modal_feed_url_label")}
          field="url"
          rules={urlRule}
        >
          <Input
            placeholder={polyglot.t("main.add_feed_modal_feed_url_placeholder")}
          />
        </Form.Item>
        <Form.Item
          field="category"
          label={polyglot.t("main.add_feed_modal_category_label")}
          required
          rules={categoryRule}
        >
          <Select
            placeholder={polyglot.t("main.add_feed_modal_category_placeholder")}
            showSearch
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
  );
};

const Main = () => (
  <div className="main">
    <Outlet />
    <SettingsModal />
    <AddFeedModal />
  </div>
);

export default Main;

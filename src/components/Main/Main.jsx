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

import { useAtomValue } from "jotai";
import { addFeed } from "../../apis";
import { categoriesAtom } from "../../atoms/dataAtom";
import { useLoadData } from "../../hooks/useLoadData";
import { useModalToggle } from "../../hooks/useModalToggle";
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
      className="settings-modal"
      visible={settingsModalVisible}
      alignCenter={false}
      title="Settings"
      footer={null}
      unmountOnExit
      onCancel={() => setSettingsModalVisible(false)}
      autoFocus={false}
      focusLock={true}
    >
      <SettingsTabs />
    </Modal>
  );
};

const AddFeedModal = () => {
  const categories = useAtomValue(categoriesAtom);
  const { addFeedModalVisible, setAddFeedModalVisible } = useModalToggle();

  const [feedModalLoading, setFeedModalLoading] = useState(false);
  const [feedForm] = Form.useForm();

  const { loadData } = useLoadData();

  const handleAddFeed = async (url, categoryId, isFullText) => {
    setFeedModalLoading(true);
    try {
      await addFeed(url, categoryId, isFullText);
      loadData();
      Message.success("Added a feed successfully");
      setAddFeedModalVisible(false);
      feedForm.resetFields();
    } catch (error) {
      Message.error("Failed to add a feed");
    }
    setFeedModalLoading(false);
  };

  return (
    <Modal
      title="Add Feed"
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
            await handleAddFeed(
              values.url.trim(),
              values.category,
              values.crawler,
            );
          } else {
            Message.error("Feed URL cannot be empty");
          }
        }}
      >
        <Form.Item label="Feed URL" field="url" rules={urlRule}>
          <Input placeholder="Please input a feed URL" />
        </Form.Item>
        <Form.Item
          label="Category"
          required
          field="category"
          rules={categoryRule}
        >
          <Select
            placeholder="Please select a category"
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
          label="Fetch original content"
          initialValue={false}
          field="crawler"
          style={{ marginBottom: 0 }}
          triggerPropName="checked"
          rules={crawlerRule}
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

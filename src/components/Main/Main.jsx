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
import { useFetchData } from "../../hooks/useFetchData";
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
      alignCenter={false}
      autoFocus={false}
      className="settings-modal"
      focusLock
      footer={null}
      onCancel={() => setSettingsModalVisible(false)}
      title="Settings"
      unmountOnExit
      visible={settingsModalVisible}
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

  const { fetchData } = useFetchData();

  const handleAddFeed = async (url, categoryId, isFullText) => {
    setFeedModalLoading(true);
    try {
      await addFeed(url, categoryId, isFullText);
      fetchData();
      Message.success("Added a feed successfully");
      setAddFeedModalVisible(false);
      feedForm.resetFields();
    } catch (error) {
      Message.error("Failed to add a feed");
    } finally {
      setFeedModalLoading(false);
    }
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
            await handleAddFeed(url, values.category, values.crawler);
          } else {
            Message.error("Feed URL cannot be empty");
          }
        }}
      >
        <Form.Item label="Feed URL" field="url" rules={urlRule}>
          <Input placeholder="Please input a feed URL" />
        </Form.Item>
        <Form.Item
          field="category"
          label="Category"
          required
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
          field="crawler"
          initialValue={false}
          label="Fetch original content"
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

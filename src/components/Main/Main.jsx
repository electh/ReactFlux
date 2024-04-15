import {
  Form,
  Input,
  Message,
  Modal,
  Select,
  Switch,
} from "@arco-design/web-react";
import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import useStore from "../../Store";
import { addFeed } from "../../apis";
import { includesIgnoreCase } from "../../utils/filter";
import SettingsTabs from "../Settings/SettingsTabs";
import "./Main.css";

const urlRule = [{ required: true }];
const groupRule = [{ required: true }];
const crawlerRule = [{ type: "boolean" }];

const SettingsModal = () => {
  const setVisible = useStore((state) => state.setVisible);
  const visible = useStore((state) => state.visible);

  return (
    <Modal
      className="settings-modal"
      visible={visible.settings}
      alignCenter={false}
      title="Settings"
      footer={null}
      unmountOnExit
      onCancel={() => setVisible("settings", false)}
      autoFocus={false}
      focusLock={true}
    >
      <SettingsTabs />
    </Modal>
  );
};

const AddFeedModal = () => {
  const groups = useStore((state) => state.groups);
  const initData = useStore((state) => state.initData);
  const setVisible = useStore((state) => state.setVisible);
  const visible = useStore((state) => state.visible);

  const [feedModalLoading, setFeedModalLoading] = useState(false);
  const [feedForm] = Form.useForm();

  const handleAddFeed = async (feed_url, group_id, is_full_text) => {
    setFeedModalLoading(true);
    addFeed(feed_url, group_id, is_full_text)
      .then(() => {
        initData();
        Message.success("Added a feed successfully");
        setVisible("addFeed", false);
        feedForm.resetFields();
      })
      .catch(() => {
        Message.error("Failed to add a feed");
      });
    setFeedModalLoading(false);
  };

  return (
    <Modal
      title="Add Feed"
      visible={visible.addFeed}
      unmountOnExit
      style={{ width: "400px" }}
      onOk={feedForm.submit}
      confirmLoading={feedModalLoading}
      onCancel={() => {
        setVisible("addFeed", false);
        feedForm.resetFields();
      }}
    >
      <Form
        form={feedForm}
        labelCol={{ span: 7 }}
        layout="vertical"
        wrapperCol={{ span: 17 }}
        onSubmit={(values) => {
          const url = values.url.trim();
          if (url) {
            handleAddFeed(values.url.trim(), values.group, values.crawler);
          } else {
            Message.error("Feed URL cannot be empty");
          }
        }}
      >
        <Form.Item label="Feed URL" field="url" rules={urlRule}>
          <Input placeholder="Please input a feed URL" />
        </Form.Item>
        <Form.Item label="Group" required field="group" rules={groupRule}>
          <Select
            placeholder="Please select a category"
            showSearch
            filterOption={(inputValue, option) =>
              includesIgnoreCase(option.props.children, inputValue)
            }
          >
            {groups.map((group) => (
              <Select.Option key={group.id} value={group.id}>
                {group.title}
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

import {
  Form,
  Input,
  Message,
  Modal,
  Select,
  Switch,
} from "@arco-design/web-react";
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import useStore from "../../Store";
import { addFeed } from "../../apis";
import { includesIgnoreCase } from "../../utils/filter.js";
import { isMobileWidth } from "../../utils/viewport.js";
import SettingsTabs from "../Settings/SettingsTabs";
import "./Main.css";

const SettingsModal = () => {
  const activeContent = useStore((state) => state.activeContent);
  const setActiveContent = useStore((state) => state.setActiveContent);
  const setVisible = useStore((state) => state.setVisible);
  const visible = useStore((state) => state.visible);

  const [modalWidth, setModalWidth] = useState("720px");
  const [modalTop, setModalTop] = useState("10%");

  useEffect(() => {
    const handleResize = () => {
      const width = isMobileWidth() ? "100%" : "720px";
      const top = isMobileWidth() ? "5%" : "10%";
      setModalWidth(width);
      setModalTop(top);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <Modal
      visible={visible.settings}
      alignCenter={false}
      title="Settings"
      footer={null}
      unmountOnExit
      style={{ width: modalWidth, top: modalTop }}
      onFocus={() => {
        if (activeContent) {
          setActiveContent(null);
        }
      }}
      onCancel={() => setVisible("settings", false)}
      autoFocus={false}
      focusLock={true}
    >
      <SettingsTabs />
    </Modal>
  );
};

const AddFeedModal = () => {
  const activeContent = useStore((state) => state.activeContent);
  const groups = useStore((state) => state.groups);
  const initData = useStore((state) => state.initData);
  const setActiveContent = useStore((state) => state.setActiveContent);
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
      })
      .catch(() => {
        Message.error("Failed to add a feed");
      });
    setFeedModalLoading(false);
    feedForm.resetFields();
  };

  return (
    <Modal
      title="Add Feed"
      visible={visible.addFeed}
      unmountOnExit
      style={{ width: "400px" }}
      onFocus={() => {
        if (activeContent) {
          setActiveContent(null);
        }
      }}
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
        <Form.Item label="Feed URL" field="url" rules={[{ required: true }]}>
          <Input placeholder="Please input a feed URL" />
        </Form.Item>
        <Form.Item
          label="Group"
          required
          field="group"
          rules={[{ required: true }]}
        >
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
          rules={[{ type: "boolean" }]}
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const Main = () => {
  const [adjustedHeight, setAdjustedHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      const entryPanel = document.querySelector(".entry-panel");
      const entryPanelHeight = entryPanel ? entryPanel.offsetHeight : 49;
      const viewportHeight = window.innerHeight;
      setAdjustedHeight(viewportHeight - entryPanelHeight);
    };

    window.addEventListener("resize", updateHeight);
    updateHeight();

    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <div className="main" style={{ height: `${adjustedHeight}px` }}>
      <Outlet />
      <SettingsModal />
      <AddFeedModal />
    </div>
  );
};

export default Main;

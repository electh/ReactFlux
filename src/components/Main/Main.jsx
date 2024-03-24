import {
  Form,
  Input,
  Message,
  Modal,
  Select,
  Switch,
} from "@arco-design/web-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import useStore from "../../Store";
import { addFeed } from "../../apis";
import SettingsTabs from "../Settings/SettingsTabs";
import "./Main.css";

const SettingsModal = ({
  activeContent,
  setActiveContent,
  setVisible,
  visible,
}) => (
  <Modal
    visible={visible.settings}
    alignCenter={false}
    title="Settings"
    footer={null}
    unmountOnExit
    style={{ width: "720px", top: "10%" }}
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

const AddFeedModal = ({
  activeContent,
  setActiveContent,
  setVisible,
  visible,
}) => {
  const initData = useStore((state) => state.initData);
  const groups = useStore((state) => state.groups);

  const [feedModalLoading, setFeedModalLoading] = useState(false);
  const [feedForm] = Form.useForm();

  const handleAddFeed = async (feed_url, group_id, is_full_text) => {
    setFeedModalLoading(true);
    const response = await addFeed(feed_url, group_id, is_full_text);
    if (response) {
      await initData();
      Message.success("Success");
      setVisible("addFeed", false);
    }
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
        layout="vertical"
        onSubmit={(values) =>
          handleAddFeed(values.url, values.group, values.crawler)
        }
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
      >
        <Form.Item label="Feed URL" field="url" rules={[{ required: true }]}>
          <Input placeholder="Please input feed URL" />
        </Form.Item>
        <Form.Item
          label="Group"
          required
          field="group"
          rules={[{ required: true }]}
        >
          <Select placeholder="Please select">
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
  const visible = useStore((state) => state.visible);
  const setVisible = useStore((state) => state.setVisible);
  const activeContent = useStore((state) => state.activeContent);
  const setActiveContent = useStore((state) => state.setActiveContent);

  useEffect(() => {
    const updateHeight = () => {
      const entryPanel = document.querySelector(".entry-panel");
      const entryPanelHeight = entryPanel ? entryPanel.offsetHeight : 0;
      const viewportHeight = window.innerHeight;
      const adjustedHeight = viewportHeight - entryPanelHeight;
      document.documentElement.style.setProperty(
        "--dynamic-viewport-height",
        `${adjustedHeight}px`,
      );
    };

    window.addEventListener("resize", updateHeight);
    updateHeight();

    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <div className="main" style={{ height: "var(--dynamic-viewport-height)" }}>
      <Outlet />
      <SettingsModal
        activeContent={activeContent}
        setActiveContent={setActiveContent}
        setVisible={setVisible}
        visible={visible}
      />
      <AddFeedModal
        activeContent={activeContent}
        setActiveContent={setActiveContent}
        setVisible={setVisible}
        visible={visible}
      />
    </div>
  );
};

export default Main;

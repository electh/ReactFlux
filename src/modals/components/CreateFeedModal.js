import {
  Form,
  Input,
  Message,
  Modal,
  Select,
  Switch,
} from "@arco-design/web-react";
import { useModalStore } from "../../store/modalStore";
import { createFeed } from "../../api/api";
import { useStore } from "../../store/Store";

export default function CreateFeedModal() {
  const initData = useStore((state) => state.initData);
  const categories = useStore((state) => state.categories);
  const modalLoading = useModalStore((state) => state.modalLoading);
  const setModalLoading = useModalStore((state) => state.setModalLoading);
  const newFeedVisible = useModalStore((state) => state.newFeedVisible);
  const setNewFeedVisible = useModalStore((state) => state.setNewFeedVisible);
  const [feedForm] = Form.useForm();

  const handleCreateFeed = async (feedUrl, categoryId, isFullText) => {
    setModalLoading(true);
    try {
      const response = await createFeed(feedUrl, categoryId, isFullText);
      if (response) {
        await initData();
        Message.success("Success");
        setNewFeedVisible(false);
      }
    } catch (error) {
      console.error("Error creating feed:", error);
      // Message.error("Failed to create feed");
    } finally {
      setModalLoading(false);
      feedForm.resetFields();
    }
  };

  return (
    <Modal
      title="Add Feed"
      visible={newFeedVisible}
      unmountOnExit
      style={{ width: "400px", maxWidth: "calc(100% - 20px)" }}
      onOk={feedForm.submit}
      confirmLoading={modalLoading}
      onCancel={() => {
        setNewFeedVisible(false);
        feedForm.resetFields();
      }}
    >
      <Form
        form={feedForm}
        layout="vertical"
        onSubmit={(values) =>
          handleCreateFeed(values.url, values.category, values.crawler)
        }
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
      >
        <Form.Item label="Feed URL" field="url" rules={[{ required: true }]}>
          <Input placeholder="Please input feed URL" />
        </Form.Item>
        <Form.Item
          label="Category"
          required
          field="category"
          rules={[{ required: true }]}
        >
          <Select placeholder="Please select">
            {categories.map((category) => (
              <Select.Option key={category.id} value={category.id}>
                {category.title}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="Fetch original content"
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
}

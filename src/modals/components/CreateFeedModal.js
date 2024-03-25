import {
  Button,
  Divider,
  Form,
  Input,
  Message,
  Modal,
  Select,
  Switch,
} from "@arco-design/web-react";
import { useModalStore } from "../../store/modalStore";
import { createCategory, createFeed } from "../../api/api";
import { useStore } from "../../store/Store";
import { useEffect, useState } from "react";
import { IconPlus } from "@arco-design/web-react/icon";

export default function CreateFeedModal() {
  const initData = useStore((state) => state.initData);
  const categories = useStore((state) => state.categories);
  const modalLoading = useModalStore((state) => state.modalLoading);
  const setModalLoading = useModalStore((state) => state.setModalLoading);
  const newFeedVisible = useModalStore((state) => state.newFeedVisible);
  const setNewFeedVisible = useModalStore((state) => state.setNewFeedVisible);
  const [feedForm] = Form.useForm();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [options, setOptions] = useState([]);
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    setOptions(categories);
  }, [categories]);

  const handleCreateFeed = async (feedUrl, categoryId, isFullText) => {
    setModalLoading(true);
    try {
      const response = await createFeed(feedUrl, categoryId, isFullText);
      if (response) {
        Message.success("Success");
        setNewFeedVisible(false);
        await initData();
      }
    } catch (error) {
      console.error("Error creating feed:", error);
      // Message.error("Failed to create feed");
    } finally {
      setModalLoading(false);
      feedForm.resetFields();
    }
  };

  const handelCreateCategory = async (categoryName) => {
    try {
      const response = await createCategory(categoryName);
      if (response) {
        setOptions([
          ...options,
          {
            id: response.data?.id,
            title: response.data?.title,
          },
        ]);
        setEdit(true);
      }
    } catch (error) {
      console.error("Error creating category:", error);
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
        edit && initData();
        setEdit(false);
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
          <Select
            placeholder="Please select"
            dropdownRender={(menu) => (
              <div>
                {menu}
                <Divider style={{ margin: 0 }} />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 12px",
                  }}
                >
                  <Input
                    size="small"
                    style={{ marginRight: 18 }}
                    value={newCategoryName}
                    onChange={(value) => setNewCategoryName(value)}
                  />
                  <Button
                    style={{ fontSize: 14, padding: "0 6px" }}
                    type="text"
                    size="mini"
                    onClick={() => handelCreateCategory(newCategoryName)}
                  >
                    <IconPlus />
                    Add category
                  </Button>
                </div>
              </div>
            )}
            dropdownMenuStyle={{ maxHeight: 300 }}
          >
            {options.map((category) => (
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

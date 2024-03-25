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
import { createCategory, updateFeed } from "../../api/api";
import { useStore } from "../../store/Store";
import { useEffect, useState } from "react";
import { IconPlus } from "@arco-design/web-react/icon";

export default function EditFeedModal({ feed }) {
  const initData = useStore((state) => state.initData);
  const categories = useStore((state) => state.categories);
  const modalLoading = useModalStore((state) => state.modalLoading);
  const setModalLoading = useModalStore((state) => state.setModalLoading);
  const editFeedVisible = useModalStore((state) => state.editFeedVisible);
  const setEditFeedVisible = useModalStore((state) => state.setEditFeedVisible);
  const [editFeedForm] = Form.useForm();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [options, setOptions] = useState([]);
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    setOptions(categories);
  }, [categories]);

  const handleUpdateFeed = async (feedId, newTitle, categoryId, isFullText) => {
    setModalLoading(true);
    try {
      const response = await updateFeed(
        feedId,
        newTitle,
        categoryId,
        isFullText,
      );
      if (response) {
        Message.success("Success");
        setEditFeedVisible(false);
        await initData();
      }
    } catch (error) {
      console.error("Error updating feed:", error);
      // Message.error("Failed to create feed");
    } finally {
      setModalLoading(false);
      editFeedForm.resetFields();
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
        setNewCategoryName("");
        Message.success("Success");
      }
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  return (
    <Modal
      title="Update Feed"
      visible={editFeedVisible}
      unmountOnExit
      style={{ width: "400px", maxWidth: "calc(100% - 20px)" }}
      onOk={editFeedForm.submit}
      confirmLoading={modalLoading}
      onCancel={() => {
        setEditFeedVisible(false);
        editFeedForm.resetFields();
        edit && initData();
        setEdit(false);
      }}
    >
      <Form
        form={editFeedForm}
        layout="vertical"
        onSubmit={(values) =>
          handleUpdateFeed(
            feed.id,
            values.title,
            values.category,
            values.crawler,
          )
        }
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
      >
        <Form.Item
          label="Feed URL"
          field="url"
          rules={[{ required: true }]}
          initialValue={feed?.feed_url}
        >
          <Input disabled placeholder="Please input feed URL" />
        </Form.Item>
        <Form.Item
          label="Feed Title"
          field="title"
          rules={[{ required: true }]}
          initialValue={feed?.title}
        >
          <Input placeholder="Please input feed title" />
        </Form.Item>
        <Form.Item
          label="Category"
          required
          field="category"
          rules={[{ required: true }]}
          initialValue={feed?.category?.id}
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
                    placeholder="Please input"
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
            dropdownMenuStyle={{ maxHeight: 200 }}
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
          tooltip={<div>Only affects newly retrieved articles</div>}
          rules={[{ type: "boolean" }]}
          initialValue={feed?.crawler}
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}

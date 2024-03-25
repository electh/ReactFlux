import { useStore } from "../../store/Store";
import { useModalStore } from "../../store/modalStore";
import { Form, Input, Message, Modal } from "@arco-design/web-react";
import { updateCategory } from "../../api/api";

export default function EditCategoryModal({ category }) {
  const initData = useStore((state) => state.initData);
  const modalLoading = useModalStore((state) => state.modalLoading);
  const setModalLoading = useModalStore((state) => state.setModalLoading);
  const editCategoryVisible = useModalStore(
    (state) => state.editCategoryVisible,
  );
  const setEditCategoryVisible = useModalStore(
    (state) => state.setEditCategoryVisible,
  );
  const [editCategoryForm] = Form.useForm();

  const handleUpdateCategory = async (categoryId, newTitle) => {
    setModalLoading(true);
    try {
      const response = await updateCategory(categoryId, newTitle);
      if (response) {
        Message.success("Success");
        setEditCategoryVisible(false);
        await initData();
      }
    } catch (error) {
      console.error("Error updating category:", error);
      // Message.error("Failed to create feed");
    } finally {
      setModalLoading(false);
      editCategoryForm.resetFields();
    }
  };

  return (
    <Modal
      title="Update Category"
      visible={editCategoryVisible}
      unmountOnExit
      style={{ width: "400px", maxWidth: "calc(100% - 20px)" }}
      onOk={editCategoryForm.submit}
      confirmLoading={modalLoading}
      onCancel={() => {
        setEditCategoryVisible(false);
        editCategoryForm.resetFields();
      }}
    >
      <Form
        form={editCategoryForm}
        layout="vertical"
        onSubmit={(values) => handleUpdateCategory(category.id, values.title)}
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
      >
        <Form.Item
          label="New Title"
          field="title"
          rules={[{ required: true }]}
          initialValue={category?.title}
        >
          <Input placeholder="Please input category name" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

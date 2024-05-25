import {
  Form,
  Input,
  Message,
  Modal,
  Switch,
  Tag,
} from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import { useState } from "react";

import { addCategory, deleteCategory, updateCategory } from "../../apis";

import {
  categoriesAtom,
  categoriesWithUnreadAtom,
  feedsWithUnreadAtom,
} from "../../atoms/dataAtom";

import { useAtomValue, useSetAtom } from "jotai";
import "./CategoryList.css";

const CategoryList = () => {
  const [categoryForm] = Form.useForm();
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [inputAddValue, setInputAddValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState({});
  const [showAddInput, setShowAddInput] = useState(false);

  const categories = useAtomValue(categoriesAtom);
  const setCategories = useSetAtom(categoriesWithUnreadAtom);
  const setFeeds = useSetAtom(feedsWithUnreadAtom);

  const addNewCategory = async () => {
    if (!inputAddValue.trim()) {
      return;
    }

    try {
      const { data } = await addCategory(inputAddValue);
      setCategories((prevCategories) => [
        ...prevCategories,
        { ...data, feedCount: 0 },
      ]);
      Message.success("Category added successfully");
    } catch {
      Message.error("Failed to add category");
    }
    setInputAddValue("");
    setShowAddInput(false);
  };

  const editCategory = async (categoryId, newTitle, hidden) => {
    try {
      const { data } = await updateCategory(categoryId, newTitle, hidden);
      setFeeds((prevFeeds) =>
        prevFeeds.map((feed) =>
          feed.category.id === categoryId
            ? { ...feed, category: { ...feed.category, title: newTitle } }
            : feed,
        ),
      );
      setCategories((prevCategories) =>
        prevCategories.map((category) =>
          category.id === categoryId ? { ...category, ...data } : category,
        ),
      );
      Message.success("Category updated successfully");
    } catch {
      Message.error("Failed to update category");
    }

    setCategoryModalVisible(false);
    categoryForm.resetFields();
  };

  const removeCategory = async (categoryId) => {
    try {
      const response = await deleteCategory(categoryId);
      if (response.status === 204) {
        setCategories((prevCategories) =>
          prevCategories.filter((category) => category.id !== categoryId),
        );
        Message.success("Category deleted successfully");
      } else {
        Message.error("Failed to delete category");
      }
    } catch {
      Message.error("Failed to delete category");
    }
  };

  return (
    <>
      <div>
        {categories.map((category) => (
          <Tag
            className="tag-style"
            closable={category.feedCount === 0}
            key={category.id}
            size="medium"
            onClick={() => {
              setSelectedCategory(category);
              setCategoryModalVisible(true);
              categoryForm.setFieldsValue({
                title: category.title,
              });
            }}
            onClose={async (event) => {
              event.stopPropagation();
              await removeCategory(category.id);
            }}
          >
            {category.title}
          </Tag>
        ))}
        {showAddInput ? (
          <Input
            autoFocus
            className="input-style"
            onBlur={addNewCategory}
            onChange={setInputAddValue}
            onPressEnter={addNewCategory}
            size="small"
            value={inputAddValue}
          />
        ) : (
          <Tag
            className="add-category-tag"
            icon={<IconPlus />}
            onClick={() => setShowAddInput(true)}
            size="medium"
            tabIndex={0}
          >
            Add
          </Tag>
        )}
      </div>
      {selectedCategory && (
        <Modal
          className="modal-style"
          onOk={categoryForm.submit}
          title="Edit Category"
          unmountOnExit
          visible={categoryModalVisible}
          onCancel={() => {
            setCategoryModalVisible(false);
            categoryForm.resetFields();
          }}
        >
          <Form
            form={categoryForm}
            layout="vertical"
            onSubmit={(values) =>
              editCategory(selectedCategory.id, values.title, values.hidden)
            }
            labelCol={{
              style: { flexBasis: 90 },
            }}
            wrapperCol={{
              style: { flexBasis: "calc(100% - 90px)" },
            }}
          >
            <Form.Item label="Title" field="title" rules={[{ required: true }]}>
              <Input placeholder="Please input category title" />
            </Form.Item>
            <Form.Item
              label="Hidden"
              field="hidden"
              initialValue={selectedCategory.hide_globally}
              triggerPropName="checked"
              rules={[{ type: "boolean" }]}
            >
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </>
  );
};

export default CategoryList;

import { Form, Input, Message, Modal, Tag } from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import React, { useState } from "react";

import useStore from "../../Store";
import { addGroup, deleteGroup, editGroup } from "../../apis";

const GroupList = () => {
  const feeds = useStore((state) => state.feeds);
  const setFeeds = useStore((state) => state.setFeeds);
  const groups = useStore((state) => state.groups);
  const setGroups = useStore((state) => state.setGroups);
  const [showAddInput, setShowAddInput] = useState(false);
  const [inputAddValue, setInputAddValue] = useState("");
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [groupForm] = Form.useForm();
  const [selectedGroup, setSelectedGroup] = useState({});

  const handleAddGroup = async () => {
    if (inputAddValue) {
      addGroup(inputAddValue)
        .then((response) => {
          setGroups((prevGroups) => [
            ...prevGroups,
            { ...response.data, feedCount: 0 },
          ]);
          setInputAddValue("");
          Message.success("Group added successfully");
        })
        .catch(() => {
          Message.error("Failed to add group");
        });
    }
    setInputAddValue("");
    setShowAddInput(false);
  };

  const handleEditGroup = async (groupId, newTitle) => {
    editGroup(groupId, newTitle)
      .then((response) => {
        setFeeds(
          feeds.map((feed) =>
            feed.category.id === groupId
              ? { ...feed, category: { ...feed.category, title: newTitle } }
              : feed,
          ),
        );
        setGroups(
          groups.map((group) => (group.id === groupId ? response.data : group)),
        );
        Message.success("Group updated successfully");
        setGroupModalVisible(false);
        groupForm.resetFields();
      })
      .catch(() => {
        Message.error("Failed to update group");
      });
  };

  const handleDeleteGroup = async (groupId) => {
    deleteGroup(groupId)
      .then((response) => {
        if (response.status === 204) {
          setGroups(groups.filter((group) => group.id !== groupId));
          Message.success("Group deleted successfully");
        } else {
          Message.error("Failed to delete group");
        }
      })
      .catch(() => {
        Message.error("Failed to delete group");
      });
  };

  return (
    <>
      <div>
        {groups.map((group) => (
          <Tag
            key={group.id}
            size="medium"
            closable={group.feedCount === 0}
            onClick={() => {
              setSelectedGroup(group);
              setGroupModalVisible(true);
              groupForm.setFieldsValue({
                title: group.title,
              });
            }}
            onClose={async (event) => {
              event.stopPropagation();
              await handleDeleteGroup(group.id);
            }}
            style={{
              marginRight: "10px",
              marginBottom: "10px",
              cursor: "pointer",
            }}
          >
            {group.title}
          </Tag>
        ))}
        {showAddInput ? (
          <Input
            autoFocus
            size="small"
            value={inputAddValue}
            style={{ width: 84 }}
            onPressEnter={handleAddGroup}
            onBlur={handleAddGroup}
            onChange={setInputAddValue}
          />
        ) : (
          <Tag
            icon={<IconPlus />}
            style={{
              width: 84,
              backgroundColor: "var(--color-fill-2)",
              border: "1px dashed var(--color-fill-3)",
              cursor: "pointer",
            }}
            size="medium"
            className="add-group"
            tabIndex={0}
            onClick={() => setShowAddInput(true)}
          >
            Add
          </Tag>
        )}
      </div>
      {selectedGroup && (
        <Modal
          title="Edit Group"
          visible={groupModalVisible}
          unmountOnExit
          style={{ width: "400px" }}
          onOk={groupForm.submit}
          onCancel={() => {
            setGroupModalVisible(false);
            groupForm.resetFields();
          }}
        >
          <Form
            form={groupForm}
            layout="vertical"
            onSubmit={(values) =>
              handleEditGroup(selectedGroup.id, values.title)
            }
            labelCol={{
              style: { flexBasis: 90 },
            }}
            wrapperCol={{
              style: { flexBasis: "calc(100% - 90px)" },
            }}
          >
            <Form.Item label="Title" field="title" rules={[{ required: true }]}>
              <Input placeholder="Please input group title" />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </>
  );
};

export default GroupList;

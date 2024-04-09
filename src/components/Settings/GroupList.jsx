import {
  Form,
  Input,
  Message,
  Modal,
  Switch,
  Tag,
} from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import React, { useState } from "react";

import useStore from "../../Store";
import { addGroup, deleteGroup, editGroup } from "../../apis";

import "./GroupList.css";

const GroupList = () => {
  const feeds = useStore((state) => state.feeds);
  const setFeeds = useStore((state) => state.setFeeds);
  const groups = useStore((state) => state.groups);
  const setGroups = useStore((state) => state.setGroups);
  const updateGroupHidden = useStore((state) => state.updateGroupHidden);
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

  const handleEditGroup = async (groupId, newTitle, hidden) => {
    editGroup(groupId, newTitle, hidden)
      .then((response) => {
        setFeeds(
          feeds.map((feed) =>
            feed.category.id === groupId
              ? { ...feed, category: { ...feed.category, title: newTitle } }
              : feed,
          ),
        );
        setGroups(
          groups.map((group) =>
            group.id === groupId ? { ...group, ...response.data } : group,
          ),
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
            className="tag-style"
            closable={group.feedCount === 0}
            key={group.id}
            size="medium"
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
          >
            {group.title}
          </Tag>
        ))}
        {showAddInput ? (
          <Input
            autoFocus
            className="input-style"
            onBlur={handleAddGroup}
            onChange={setInputAddValue}
            onPressEnter={handleAddGroup}
            size="small"
            value={inputAddValue}
          />
        ) : (
          <Tag
            className="add-group-tag"
            icon={<IconPlus />}
            onClick={() => setShowAddInput(true)}
            size="medium"
            tabIndex={0}
          >
            Add
          </Tag>
        )}
      </div>
      {selectedGroup && (
        <Modal
          className="modal-style"
          onOk={groupForm.submit}
          title="Edit Group"
          unmountOnExit
          visible={groupModalVisible}
          onCancel={() => {
            setGroupModalVisible(false);
            groupForm.resetFields();
          }}
        >
          <Form
            form={groupForm}
            layout="vertical"
            onSubmit={(values) => {
              handleEditGroup(
                selectedGroup.id,
                values.title,
                values.hidden,
              ).then(() => {
                if (selectedGroup.hide_globally !== values.hidden) {
                  updateGroupHidden(selectedGroup.id, values.hidden);
                }
              });
            }}
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
            <Form.Item
              label="Hidden"
              field="hidden"
              initialValue={selectedGroup.hide_globally}
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

export default GroupList;

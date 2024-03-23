import {
  Form,
  Input,
  Message,
  Modal,
  Skeleton,
  Tag,
} from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import { useState } from "react";

import useStore from "../../Store";
import { addGroup, deleteGroup, editGroup } from "../../apis";

const GroupList = ({ groups, loading, setGroups }) => {
  const initData = useStore((state) => state.initData);
  const [showAddInput, setShowAddInput] = useState(false);
  const [inputAddValue, setInputAddValue] = useState("");
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [groupModalLoading, setGroupModalLoading] = useState(false);
  const [groupForm] = Form.useForm();
  const [selectedGroup, setSelectedGroup] = useState({});

  const handleAddGroup = async () => {
    if (inputAddValue) {
      const response = await addGroup(inputAddValue);
      if (response) {
        setGroups((prevGroups) => [
          ...prevGroups,
          { ...response.data, feedCount: 0 },
        ]);
        setInputAddValue("");
        Message.success("Group added successfully");
        await initData();
      }
    }
    setInputAddValue("");
    setShowAddInput(false);
  };

  const handleEditGroup = async (groupId, newTitle) => {
    setGroupModalLoading(true);
    const response = await editGroup(groupId, newTitle);
    if (response) {
      setGroups(
        groups.map((group) => (group.id === groupId ? response.data : group)),
      );
      Message.success("Group updated successfully");
      setGroupModalVisible(false);
      await initData();
    }
    setGroupModalLoading(false);
    groupForm.resetFields();
  };

  const handleDeleteGroup = async (groupId) => {
    const response = await deleteGroup(groupId);
    if (response.status === 204) {
      setGroups(groups.filter((group) => group.id !== groupId));
      Message.success("Group deleted successfully");
      await initData();
    } else {
      Message.error("Failed to delete group");
    }
  };

  return (
    <>
      <div>
        <Skeleton loading={loading} animation={true} text={{ rows: 3 }}>
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
        </Skeleton>
      </div>
      {selectedGroup && (
        <Modal
          title="Edit Group"
          visible={groupModalVisible}
          unmountOnExit
          style={{ width: "400px" }}
          onOk={groupForm.submit}
          confirmLoading={groupModalLoading}
          onCancel={() => {
            setGroupModalVisible(false);
            groupForm.resetFields();
          }}
        >
          <Form
            form={groupForm}
            layout="vertical"
            onChange={(value, values) => console.log(value, values)}
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

import {
  Tabs,
  Table,
  Space,
  Popconfirm,
  Input,
  Message,
  Typography,
  Tag,
  Skeleton,
  Form,
  Modal,
  Select,
  Switch,
} from "@arco-design/web-react";
import {
  IconCommand,
  IconDelete,
  IconEdit,
  IconFile,
  IconFolder,
  IconPlus,
} from "@arco-design/web-react/icon";
import {
  addGroup,
  deleteFeed,
  delGroup,
  editFeed,
  editGroup,
  getFeeds,
  getGroups,
} from "../apis";
import "./Settings.css";
import { useEffect, useState } from "react";
import _ from "lodash";
import Shortcuts from "./Shortcuts";

export default function Settings() {
  const [feeds, setFeeds] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showFeeds, setShowFeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [inputAddValue, setInputAddValue] = useState("");
  const [feedModalVisible, setFeedModalVisible] = useState(false);
  const [feedModalLoading, setFeedModalLoading] = useState(false);
  const [feedForm] = Form.useForm();
  const [selectedFeed, setSelectedFeed] = useState({});
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [groupModalLoading, setGroupModalLoading] = useState(false);
  const [groupForm] = Form.useForm();
  const [selectedGroup, setSelectedGroup] = useState({});

  const refreshData = async () => {
    setLoading(true);
    const feedResponse = await getFeeds();
    const groupResponse = await getGroups();

    if (feedResponse && groupResponse) {
      const feeds = feedResponse.data;
      const groupsWithFeedCount = groupResponse.data.map((group) => {
        const feedCount = feeds.reduce((total, feed) => {
          if (feed.category.id === group.id) {
            return total + 1;
          } else {
            return total;
          }
        }, 0);

        return {
          ...group,
          feedCount: feedCount,
        };
      });
      setFeeds(_.orderBy(feeds, ["title"], ["asc"]));
      setGroups(_.orderBy(groupsWithFeedCount, ["title"], ["asc"]));
      setShowFeeds(feeds);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const tableData = showFeeds.map((feed) => ({
    key: feed.id,
    title: feed.title,
    feed_url: feed.feed_url,
    category: feed.category,
    feed: feed,
  }));

  const handleSelectFeed = (record) => {
    setSelectedFeed(record.feed);
    setFeedModalVisible(true);
    feedForm.setFieldsValue({
      title: record.feed.title,
      group: record.feed.category.id,
      crawler: record.feed.crawler,
    });
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      render: (col) => (
        <Typography.Ellipsis expandable={false} showTooltip={true}>
          {col}
        </Typography.Ellipsis>
      ),
    },
    {
      title: "Url",
      dataIndex: "feed_url",
      render: (col) => (
        <Typography.Ellipsis expandable={false} showTooltip={true}>
          {col}
        </Typography.Ellipsis>
      ),
    },
    {
      title: "Group",
      dataIndex: "category.title",
      render: (col) => <Tag>{col}</Tag>,
    },
    {
      title: "Actions",
      dataIndex: "op",
      fixed: "right",
      width: 80,
      render: (col, record) => (
        <Space>
          <span
            className="list-demo-actions-icon"
            role="button"
            tabIndex="0"
            onClick={() => {
              handleSelectFeed(record);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                handleSelectFeed(record);
              }
            }}
            aria-label="Edit this feed"
          >
            <IconEdit />
          </span>
          <Popconfirm
            position="left"
            focusLocka
            title="Unfollow？"
            onOk={async () => {
              const response = await deleteFeed(record.feed.id);
              if (response) {
                setFeeds(feeds.filter((feed) => feed.id !== record.feed.id));
                setShowFeeds(
                  showFeeds.filter((feed) => feed.id !== record.feed.id),
                );
                Message.success("Unfollowed");
              }
            }}
          >
            <span className="list-demo-actions-icon">
              <IconDelete />
            </span>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handelAddGroup = async () => {
    if (inputAddValue) {
      const response = await addGroup(inputAddValue);
      if (response) {
        setGroups((prevGroups) => [
          ...prevGroups,
          { ...response.data, feedCount: 0 },
        ]);
        setInputAddValue("");
        Message.success("Success");
      }
    }
    setInputAddValue("");
    setShowAddInput(false);
  };

  const handelEditFeed = async (feed_id, newTitle, group_id, is_full_text) => {
    setFeedModalLoading(true);
    const response = await editFeed(feed_id, newTitle, group_id, is_full_text);
    if (response) {
      setFeeds(
        feeds.map((feed) => (feed.id === feed_id ? response.data : feed)),
      );
      setShowFeeds(
        showFeeds.map((feed) => (feed.id === feed_id ? response.data : feed)),
      );
      Message.success("Success");
      setFeedModalVisible(false);
    }
    setFeedModalLoading(false);
    feedForm.resetFields();
  };

  const handelEditGroup = async (group_id, newTitle) => {
    setGroupModalLoading(true);
    const response = await editGroup(group_id, newTitle);
    if (response) {
      setGroups(
        groups.map((group) => (group.id === group_id ? response.data : group)),
      );
      Message.success("Success");
      setGroupModalVisible(false);
    }
    setGroupModalLoading(false);
    groupForm.resetFields();
  };

  return (
    <Tabs
      defaultActiveTab="1"
      tabPosition="top"
      onChange={refreshData}
      style={{ marginTop: "-14px" }}
    >
      <Tabs.TabPane
        key="1"
        title={
          <span>
            <IconFile style={{ marginRight: 6 }} />
            Feeds
          </span>
        }
      >
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Input.Search
            searchButton
            placeholder="Search feed title"
            onChange={(value) =>
              setShowFeeds(feeds.filter((feed) => feed.title.includes(value)))
            }
            style={{
              width: 300,
              marginBottom: "16px",
            }}
          />
        </div>
        <Table
          columns={columns}
          data={tableData}
          size={"small"}
          loading={loading}
          scroll={{ x: true }}
          style={{ width: "100%" }}
        />
        {selectedFeed && (
          <Modal
            title="Edit Feed"
            visible={feedModalVisible}
            unmountOnExit
            onOk={feedForm.submit}
            style={{ width: "400px" }}
            confirmLoading={feedModalLoading}
            onCancel={() => {
              setFeedModalVisible(false);
              feedForm.resetFields();
            }}
          >
            <Form
              form={feedForm}
              layout="vertical"
              onChange={(value, values) => console.log(value, values)}
              onSubmit={(values) =>
                handelEditFeed(
                  selectedFeed.id,
                  values.title,
                  values.group,
                  values.crawler,
                )
              }
              labelCol={{
                span: 7,
              }}
              wrapperCol={{
                span: 17,
              }}
            >
              <Form.Item
                label="Title"
                field="title"
                rules={[{ required: true }]}
              >
                <Input placeholder="Please input feed title" />
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
                field="crawler"
                tooltip={<div>Only affects newly retrieved articles</div>}
                style={{ marginBottom: 0 }}
                triggerPropName="checked"
                rules={[{ type: "boolean" }]}
              >
                <Switch />
              </Form.Item>
            </Form>
          </Modal>
        )}
      </Tabs.TabPane>
      <Tabs.TabPane
        key="2"
        title={
          <span>
            <IconFolder style={{ marginRight: 6 }} />
            Groups
          </span>
        }
      >
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
                  const response = await delGroup(group.id);
                  return new Promise((resolve, reject) => {
                    if (response.status === 204) {
                      resolve();
                      Message.success("Deleted");
                    } else {
                      Message.error("Failed");
                      reject(new Error("Failed to delete group"));
                    }
                  });
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
                onPressEnter={handelAddGroup}
                onBlur={handelAddGroup}
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
                handelEditGroup(selectedGroup.id, values.title)
              }
              labelCol={{
                style: { flexBasis: 90 },
              }}
              wrapperCol={{
                style: { flexBasis: "calc(100% - 90px)" },
              }}
            >
              <Form.Item
                label="Title"
                field="title"
                rules={[{ required: true }]}
              >
                <Input placeholder="Please input group title" />
              </Form.Item>
            </Form>
          </Modal>
        )}
      </Tabs.TabPane>
      <Tabs.TabPane
        key="3"
        title={
          <span>
            <IconCommand style={{ marginRight: 6 }} />
            Shortcuts
          </span>
        }
      >
        <Shortcuts />
      </Tabs.TabPane>
    </Tabs>
  );
}

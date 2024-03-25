import {
  Form,
  Input,
  Message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import { IconDelete, IconEdit, IconRefresh } from "@arco-design/web-react/icon";
import { useEffect, useState } from "react";

import useStore from "../../Store";
import { deleteFeed, editFeed, refreshFeed } from "../../apis";
import { generateRelativeTime } from "../../utils/Date";
import { includesIgnoreCase } from "../../utils/Filter";

const getSortedFeedsByErrorCount = (feeds) => {
  return feeds.slice().sort((a, b) => {
    if (a.parsing_error_count > 0 && b.parsing_error_count === 0) {
      return -1;
    }
    if (a.parsing_error_count === 0 && b.parsing_error_count > 0) {
      return 1;
    }
    return 0;
  });
};

const FeedList = ({
  feeds,
  groups,
  loading,
  setFeeds,
  setShowFeeds,
  showFeeds,
}) => {
  const initData = useStore((state) => state.initData);
  const [feedModalVisible, setFeedModalVisible] = useState(false);
  const [feedModalLoading, setFeedModalLoading] = useState(false);
  const [feedForm] = Form.useForm();
  const [selectedFeed, setSelectedFeed] = useState({});
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  let sortedFeeds = getSortedFeedsByErrorCount(showFeeds);
  const tableData = sortedFeeds.map((feed) => ({
    key: feed.id,
    title: feed.title,
    feed_url: feed.feed_url,
    category: feed.category,
    checked_at: feed.checked_at,
    parsing_error_count: feed.parsing_error_count,
    feed: feed,
  }));

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectFeed = (record) => {
    setSelectedFeed(record.feed);
    setFeedModalVisible(true);
    feedForm.setFieldsValue({
      url: record.feed.feed_url,
      title: record.feed.title,
      group: record.feed.category.id,
      crawler: record.feed.crawler,
    });
  };

  const handleRefreshFeed = async (record) => {
    refreshFeed(record.feed.id)
      .then(() => {
        Message.success("Refreshed");
        record.feed.parsing_error_count = 0;
        initData();
      })
      .catch(() => {
        Message.error("Failed to refresh");
        record.feed.parsing_error_count++;
      })
      .finally(() => {
        setFeeds(feeds);
        sortedFeeds = getSortedFeedsByErrorCount(sortedFeeds);
        setShowFeeds(sortedFeeds);
      });
  };

  const handleDeleteFeed = async (record) => {
    deleteFeed(record.feed.id).then(() => {
      Message.success("Unfollowed");
      setFeeds(feeds.filter((feed) => feed.id !== record.feed.id));
      setShowFeeds(sortedFeeds.filter((feed) => feed.id !== record.feed.id));
      initData();
    });
  };

  const isMobileView = screenWidth <= 700;
  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      sorter: (a, b) => a.title.localeCompare(b.title, "en"),
      render: (title, feed) => {
        const displayText =
          feed.parsing_error_count > 0 ? `⚠️ ${title}` : title;
        const tooltipText =
          feed.parsing_error_count > 0
            ? `${title} ⚠️ Parsing error count: ${feed.parsing_error_count}`
            : title;

        return (
          <Typography.Ellipsis expandable={false} showTooltip={true}>
            <Tooltip mini content={tooltipText} position="left">
              {displayText}
            </Tooltip>
          </Typography.Ellipsis>
        );
      },
    },

    !isMobileView && {
      title: "Url",
      dataIndex: "feed_url",
      sorter: (a, b) => a.feed_url.localeCompare(b.feed_url, "en"),
      render: (col) => (
        <Typography.Ellipsis expandable={false} showTooltip={true}>
          <Tooltip mini content={col} position="left">
            {col}
          </Tooltip>
        </Typography.Ellipsis>
      ),
    },

    {
      title: "Group",
      dataIndex: "category.title",
      sorter: (a, b) => a.category.title.localeCompare(b.category.title, "en"),
      render: (col) => <Tag>{col}</Tag>,
    },

    !isMobileView && {
      title: "Checked at",
      dataIndex: "checked_at",
      sorter: (a, b) => a.checked_at.localeCompare(b.checked_at, "en"),
      render: (col) => (
        <Typography.Ellipsis expandable={false} showTooltip={true}>
          {generateRelativeTime(col)}
        </Typography.Ellipsis>
      ),
    },

    {
      title: "Actions",
      dataIndex: "op",
      fixed: "right",
      width: 100,
      render: (col, record) => (
        <Space>
          <span
            className="list-demo-actions-icon"
            role="button"
            tabIndex="0"
            onClick={() => handleSelectFeed(record)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                handleSelectFeed(record);
              }
            }}
            aria-label="Edit this feed"
          >
            <IconEdit />
          </span>
          <span
            className="list-demo-actions-icon"
            role="button"
            tabIndex="0"
            onClick={() => handleRefreshFeed(record)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                handleRefreshFeed(record);
              }
            }}
            aria-label="Refresh this feed"
          >
            <IconRefresh />
          </span>
          <Popconfirm
            position="left"
            focusLocka
            title="Unfollow？"
            onOk={async () => {
              await handleDeleteFeed(record);
            }}
          >
            <span className="list-demo-actions-icon">
              <IconDelete />
            </span>
          </Popconfirm>
        </Space>
      ),
    },
  ].filter(Boolean);

  const handleEditFeed = async (
    feedId,
    newUrl,
    newTitle,
    groupId,
    isFullText,
  ) => {
    setFeedModalLoading(true);
    const response = await editFeed(
      feedId,
      newUrl,
      newTitle,
      groupId,
      isFullText,
    );
    if (response) {
      setFeeds(
        feeds.map((feed) => (feed.id === feedId ? response.data : feed)),
      );
      setShowFeeds(
        sortedFeeds.map((feed) => (feed.id === feedId ? response.data : feed)),
      );
      Message.success("Feed updated successfully");
      setFeedModalVisible(false);
      await initData();
    }
    setFeedModalLoading(false);
    feedForm.resetFields();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Input.Search
          searchButton
          placeholder="Search feed title or url"
          onChange={(value) =>
            setShowFeeds(
              sortedFeeds.filter(
                (feed) =>
                  includesIgnoreCase(feed.title, value) ||
                  includesIgnoreCase(feed.feed_url, value),
              ),
            )
          }
          style={{
            width: 300,
            marginBottom: "24px",
          }}
        />
      </div>
      <Table
        columns={columns}
        data={tableData}
        loading={loading}
        pagePosition="bottomCenter"
        scroll={{ x: true }}
        size={"small"}
        style={{ width: "100%" }}
        borderCell={true}
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
              handleEditFeed(
                selectedFeed.id,
                values.url,
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
              label="Feed URL"
              field="url"
              rules={[{ required: true }]}
            >
              <Input placeholder="Please input feed URL" />
            </Form.Item>
            <Form.Item label="Title" field="title" rules={[{ required: true }]}>
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
    </>
  );
};

export default FeedList;
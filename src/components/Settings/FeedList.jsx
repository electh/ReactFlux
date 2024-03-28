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
import React, { useEffect, useState } from "react";

import useStore from "../../Store";
import { deleteFeed, editFeed, refreshFeed } from "../../apis";
import { generateRelativeTime } from "../../utils/date";
import { includesIgnoreCase } from "../../utils/filter";

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
        sortedFeeds = feeds.sort((a, b) =>
          a.title.localeCompare(b.title, "en"),
        );
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

  const isMobileView = screenWidth <= 768;
  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      sorter: (a, b) => a.title.localeCompare(b.title, "en"),
      render: (title, feed) => {
        const parsingErrorCount = feed.parsing_error_count;
        const displayText = parsingErrorCount ? `⚠️ ${title}` : title;

        const tooltipContent = (
          <div>
            {title}
            {parsingErrorCount > 0 && (
              <>
                <br />
                ⚠️ Parsing error count: {parsingErrorCount}
              </>
            )}
          </div>
        );

        return (
          <Typography.Ellipsis expandable={false}>
            <Tooltip mini content={tooltipContent}>
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
      render: (feedUrl) => (
        <Typography.Ellipsis expandable={false} showTooltip={true}>
          {feedUrl}
        </Typography.Ellipsis>
      ),
    },

    {
      title: "Group",
      dataIndex: "category.title",
      sorter: (a, b) => a.category.title.localeCompare(b.category.title, "en"),
      render: (col) => (
        <Typography.Ellipsis expandable={false} showTooltip={true}>
          <Tag>{col}</Tag>
        </Typography.Ellipsis>
      ),
    },

    !isMobileView && {
      title: "Checked at",
      dataIndex: "checked_at",
      sorter: (a, b) => a.checked_at.localeCompare(b.checked_at, "en"),
      render: (col) => (
        <Typography.Ellipsis expandable={false}>
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
          <button
            aria-label="Edit this feed"
            className="list-item-action"
            onClick={() => handleSelectFeed(record)}
            type="button"
          >
            <IconEdit />
          </button>
          <button
            aria-label="Refresh this feed"
            className="list-item-action"
            onClick={() => handleRefreshFeed(record)}
            type="button"
          >
            <IconRefresh />
          </button>
          <Popconfirm
            position="left"
            focusLock
            title="Unfollow？"
            onOk={async () => {
              await handleDeleteFeed(record);
            }}
          >
            <span className="list-item-action">
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
    editFeed(feedId, newUrl, newTitle, groupId, isFullText)
      .then((response) => {
        setFeeds(
          feeds.map((feed) => (feed.id === feedId ? response.data : feed)),
        );
        setShowFeeds(
          sortedFeeds.map((feed) =>
            feed.id === feedId ? response.data : feed,
          ),
        );
        Message.success("Feed updated successfully");
        setFeedModalVisible(false);
        initData();
      })
      .catch(() => {
        Message.error("Failed to update feed");
      });
    setFeedModalLoading(false);
    feedForm.resetFields();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center" }}>
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
            labelCol={{ span: 7 }}
            layout="vertical"
            wrapperCol={{ span: 17 }}
            onSubmit={(values) => {
              const url = values.url.trim();
              if (url) {
                handleEditFeed(
                  selectedFeed.id,
                  values.url,
                  values.title,
                  values.group,
                  values.crawler,
                );
              } else {
                Message.error("Feed URL cannot be empty");
              }
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

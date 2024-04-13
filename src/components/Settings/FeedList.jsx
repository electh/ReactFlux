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

import { useScreenWidth } from "../../hooks/useScreenWidth";
import "./FeedList.css";

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

const FeedList = () => {
  const [feedModalVisible, setFeedModalVisible] = useState(false);
  const [feedForm] = Form.useForm();
  const [selectedFeed, setSelectedFeed] = useState({});
  const feeds = useStore((state) => state.feeds);
  const setFeeds = useStore((state) => state.setFeeds);
  const [showFeeds, setShowFeeds] = useState(getSortedFeedsByErrorCount(feeds));
  const groups = useStore((state) => state.groups);
  const updateFeedHidden = useStore((state) => state.updateFeedHidden);
  const screenWidth = useScreenWidth();
  const isMobileView = screenWidth <= 768;

  const tableData = showFeeds.map((feed) => ({
    category: feed.category,
    checked_at: feed.checked_at,
    crawler: feed.crawler,
    feed_url: feed.feed_url,
    key: feed.id,
    parsing_error_count: feed.parsing_error_count,
    title: feed.title,
    hidden: feed.hide_globally,
  }));

  useEffect(() => {
    setShowFeeds(getSortedFeedsByErrorCount(feeds));
  }, [feeds]);

  const handleSelectFeed = (record) => {
    setSelectedFeed(record);
    setFeedModalVisible(true);
    feedForm.setFieldsValue({
      crawler: record.crawler,
      group: record.category.id,
      title: record.title,
      url: record.feed_url,
      hidden: record.hidden,
    });
  };

  const handleRefreshFeed = async (record) => {
    refreshFeed(record.key)
      .then(() => {
        Message.success("Refreshed");
        record.parsing_error_count = 0;
      })
      .catch(() => {
        Message.error("Failed to refresh");
        record.parsing_error_count++;
      })
      .finally(() => {
        setFeeds(
          feeds.map((feed) =>
            feed.id === record.key
              ? { ...feed, parsing_error_count: record.parsing_error_count }
              : feed,
          ),
        );
      });
  };

  const handleDeleteFeed = async (record) => {
    deleteFeed(record.key)
      .then(() => {
        Message.success("Unfollowed");
        setFeeds(feeds.filter((feed) => feed.id !== record.key));
      })
      .catch(() => {
        Message.error("Failed to unfollow");
      });
  };

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
    hidden,
  ) => {
    editFeed(feedId, newUrl, newTitle, groupId, isFullText, hidden)
      .then((response) => {
        setFeeds(
          feeds.map((feed) =>
            feed.id === feedId ? { ...feed, ...response.data } : feed,
          ),
        );
        Message.success("Feed updated successfully");
        setFeedModalVisible(false);
        feedForm.resetFields();
      })
      .catch(() => {
        Message.error("Failed to update feed");
      });
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Input.Search
          className="search-input"
          placeholder="Search feed title or url"
          searchButton
          onChange={(value) =>
            setShowFeeds(
              getSortedFeedsByErrorCount(feeds).filter(
                (feed) =>
                  includesIgnoreCase(feed.title, value) ||
                  includesIgnoreCase(feed.feed_url, value),
              ),
            )
          }
        />
      </div>
      <Table
        borderCell={true}
        className="feed-table"
        columns={columns}
        data={tableData}
        pagePosition="bottomCenter"
        scroll={{ x: true }}
        size="small"
      />
      {selectedFeed && (
        <Modal
          className="edit-modal"
          onOk={feedForm.submit}
          title="Edit Feed"
          unmountOnExit
          visible={feedModalVisible}
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
                  selectedFeed.key,
                  values.url,
                  values.title,
                  values.group,
                  values.crawler,
                  values.hidden,
                ).then(() => {
                  if (selectedFeed.hidden !== values.hidden) {
                    updateFeedHidden(selectedFeed.key, values.hidden);
                  }
                });
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
              label="Hidden"
              field="hidden"
              initialValue={selectedFeed.hide_globally}
              triggerPropName="checked"
              rules={[{ type: "boolean" }]}
            >
              <Switch />
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

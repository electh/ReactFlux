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

import { deleteFeed, refreshFeed, updateFeed } from "../../apis";
import { generateRelativeTime } from "../../utils/date";
import { includesIgnoreCase } from "../../utils/filter";

import { useAtomValue, useSetAtom } from "jotai";
import {
  categoriesAtom,
  feedsAtom,
  feedsWithUnreadAtom,
} from "../../atoms/dataAtom";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import "./FeedList.css";

const sortFeedsByErrorCount = (feeds) => {
  return feeds
    .slice()
    .sort((a, b) => b.parsing_error_count - a.parsing_error_count);
};

const FeedList = () => {
  const [feedModalVisible, setFeedModalVisible] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState({});
  const [feedForm] = Form.useForm();
  const feeds = useAtomValue(feedsAtom);
  const setFeeds = useSetAtom(feedsWithUnreadAtom);
  const [filteredFeeds, setFilteredFeeds] = useState(
    sortFeedsByErrorCount(feeds),
  );
  const categories = useAtomValue(categoriesAtom);
  const { isMobileView } = useScreenWidth();

  const tableData = filteredFeeds.map((feed) => ({
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
    setFilteredFeeds(sortFeedsByErrorCount(feeds));
  }, [feeds]);

  const handleSelectFeed = (feed) => {
    setSelectedFeed(feed);
    setFeedModalVisible(true);
    feedForm.setFieldsValue({
      category: feed.category.id,
      crawler: feed.crawler,
      title: feed.title,
      url: feed.feed_url,
      hidden: feed.hidden,
    });
  };

  const handleRefreshFeed = async (feed) => {
    try {
      await refreshFeed(feed.key);
      Message.success("Refreshed");
      setFeeds((feeds) =>
        feeds.map((f) =>
          f.id === feed.key ? { ...f, parsing_error_count: 0 } : f,
        ),
      );
    } catch (error) {
      Message.error("Failed to refresh");
      setFeeds((feeds) =>
        feeds.map((f) =>
          f.id === feed.key
            ? { ...f, parsing_error_count: f.parsing_error_count + 1 }
            : f,
        ),
      );
    }
  };

  const removeFeed = async (feed) => {
    try {
      await deleteFeed(feed.key);
      Message.success("Unfollowed");
      setFeeds((feeds) => feeds.filter((f) => f.id !== feed.key));
    } catch (error) {
      Message.error("Failed to unfollow");
    }
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
      title: "Category",
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
              await removeFeed(record);
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

  const editFeed = async (feedId, newDetails) => {
    try {
      const response = await updateFeed(feedId, newDetails);
      setFeeds((feeds) =>
        feeds.map((f) => (f.id === feedId ? { ...f, ...response.data } : f)),
      );
      Message.success("Feed updated successfully");
      setFeedModalVisible(false);
      feedForm.resetFields();
    } catch (error) {
      Message.error("Failed to update feed");
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Input.Search
          className="search-input"
          placeholder="Search feed title or url"
          searchButton
          onChange={(value) =>
            setFilteredFeeds(
              sortFeedsByErrorCount(feeds).filter(
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
              const newDetails = {
                url: values.url,
                title: values.title,
                categoryId: values.category,
                isFullText: values.crawler,
                hidden: values.hidden,
              };
              if (url) {
                editFeed(selectedFeed.key, newDetails);
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
              label="Category"
              required
              field="category"
              rules={[{ required: true }]}
            >
              <Select placeholder="Please select">
                {categories.map((category) => (
                  <Select.Option key={category.id} value={category.id}>
                    {category.title}
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

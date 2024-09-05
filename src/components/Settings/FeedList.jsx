import {
  Button,
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

import {
  deleteFeed,
  refreshAllFeed,
  refreshFeed,
  updateFeed,
} from "../../apis";
import { generateRelativeTime, getUTCDate } from "../../utils/date";
import { includesIgnoreCase } from "../../utils/filter";

import { proxy, snapshot, useSnapshot } from "valtio";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import { configState } from "../../store/configState";
import { dataState, setFeedsData } from "../../store/dataState";
import { sleep } from "../../utils/time";
import { createSetter } from "../../utils/valtio";
import "./FeedList.css";

const { Paragraph } = Typography;

const state = proxy({
  filterString: "",
  get filteredFeeds() {
    const { feedsData } = snapshot(dataState);
    const { filterString } = this;
    return [...feedsData]
      .sort((a, b) => {
        if (a.disabled && !b.disabled) {
          return 1;
        }
        if (!a.disabled && b.disabled) {
          return -1;
        }
        return 0;
      })
      .sort((a, b) => b.parsing_error_count - a.parsing_error_count)
      .filter(
        (feed) =>
          includesIgnoreCase(feed.title, filterString) ||
          includesIgnoreCase(feed.site_url, filterString) ||
          includesIgnoreCase(feed.feed_url, filterString),
      );
  },
  get tableData() {
    const { filteredFeeds } = this;
    return filteredFeeds.map((feed) => ({
      category: feed.category,
      checked_at: feed.checked_at,
      crawler: feed.crawler,
      disabled: feed.disabled,
      feed_url: feed.feed_url,
      hidden: feed.hide_globally,
      key: feed.id,
      parsing_error_count: feed.parsing_error_count,
      site_url: feed.site_url,
      title: feed.title,
    }));
  },
});

const setFilterString = createSetter(state, "filterString");

const updateFeedStatus = (feed, isSuccessful, targetFeedId = null) => {
  if (targetFeedId === null || targetFeedId === feed.id) {
    return {
      ...feed,
      parsing_error_count: isSuccessful ? 0 : feed.parsing_error_count + 1,
      checked_at: getUTCDate(),
    };
  }
  return feed;
};

const FeedList = () => {
  const { showDetailedRelativeTime } = useSnapshot(configState);
  const { categories } = useSnapshot(dataState);
  const { filteredFeeds, tableData } = useSnapshot(state);

  const [bulkUpdateModalVisible, setBulkUpdateModalVisible] = useState(false);
  const [feedForm] = Form.useForm();
  const [feedModalVisible, setFeedModalVisible] = useState(false);
  const [newHost, setNewHost] = useState("");
  const [selectedFeed, setSelectedFeed] = useState(null);

  const { isBelowMedium } = useScreenWidth();

  useEffect(() => {
    setFilterString("");
  }, []);

  const handleSelectFeed = (feed) => {
    setSelectedFeed(feed);
    setFeedModalVisible(true);
    feedForm.setFieldsValue({
      category: feed.category.id,
      title: feed.title,
      siteUrl: feed.site_url,
      feedUrl: feed.feed_url,
      hidden: feed.hidden,
      disabled: feed.disabled,
      crawler: feed.crawler,
    });
  };

  const handleFeedRefresh = async (
    refreshFunc,
    feedUpdater,
    displayMessage = true,
  ) => {
    try {
      const response = await refreshFunc();
      const isSuccessful = response.status === 204;

      if (displayMessage) {
        isSuccessful
          ? Message.success("Refreshed")
          : Message.error("Failed to refresh");
      }

      setFeedsData((feeds) =>
        feeds.map((feed) => feedUpdater(feed, isSuccessful)),
      );
      return isSuccessful;
    } catch (error) {
      if (displayMessage) {
        Message.error("Failed to refresh");
      }
      setFeedsData((feeds) => feeds.map((feed) => feedUpdater(feed, false)));
      return false;
    }
  };

  const refreshSingleFeed = async (feed, displayMessage = true) => {
    const feedId = feed.id || feed.key;
    return handleFeedRefresh(
      () => refreshFeed(feedId),
      (feed, isSuccessful) => updateFeedStatus(feed, isSuccessful, feedId),
      displayMessage,
    );
  };

  const bulkUpdateFeedHosts = async () => {
    try {
      const updatedFeeds = await Promise.all(
        filteredFeeds.map(async (feed) => {
          const oldHost = new URL(feed.feed_url).hostname;
          const newURL = feed.feed_url.replace(oldHost, newHost);
          const data = await updateFeed(feed.id, { feedUrl: newURL });
          return { ...feed, ...data };
        }),
      );

      setFeedsData((feeds) =>
        feeds.map((feed) => updatedFeeds.find((f) => f.id === feed.id) || feed),
      );

      Message.success("Bulk update successfully");
      setBulkUpdateModalVisible(false);
    } catch (error) {
      Message.error("Failed to bulk update, please try again");
    }
  };

  const RefreshModal = () => {
    const [visible, setVisible] = useState(false);

    const refreshAllFeeds = async () => {
      setVisible(false);
      await handleFeedRefresh(refreshAllFeed, updateFeedStatus);
    };

    const refreshErrorFeeds = async () => {
      setVisible(false);
      const errorFeeds = filteredFeeds.filter(
        (feed) => feed.parsing_error_count > 0,
      );
      Message.success("Starting refresh of error feeds, please wait");

      const results = await Promise.all(
        errorFeeds.map(async (feed) => {
          const isSuccessful = await refreshSingleFeed(feed, false);
          await sleep(500);
          return isSuccessful;
        }),
      );
      const successCount = results.filter(Boolean).length;
      const failureCount = results.length - successCount;

      Message.success(
        `Feeds refreshed. Success: ${successCount}, Failure: ${failureCount}`,
      );
    };

    const closeModal = () => setVisible(false);

    return (
      <>
        <Button
          icon={<IconRefresh />}
          shape="circle"
          onClick={() => setVisible(true)}
        />
        <Modal
          className="edit-modal"
          onCancel={closeModal}
          title="Refresh Feeds"
          visible={visible}
          footer={[
            <Button key="cancel" onClick={closeModal}>
              Cancel
            </Button>,
            <Button key="error" type="outline" onClick={refreshErrorFeeds}>
              Error Feeds
            </Button>,
            <Button key="all" type="primary" onClick={refreshAllFeeds}>
              All Feeds
            </Button>,
          ]}
        >
          <p>Do you want to refresh all feeds or just the ones with errors?</p>
        </Modal>
      </>
    );
  };

  const removeFeed = async (feed) => {
    try {
      const response = await deleteFeed(feed.key);
      if (response.status === 204) {
        setFeedsData((feeds) => feeds.filter((f) => f.id !== feed.key));
        Message.success(`Unfollowed feed: ${feed.title}`);
      } else {
        Message.error(`Failed to unfollow feed: ${feed.title}`);
      }
    } catch (error) {
      console.error(`Failed to unfollow feed: ${feed.title}`, error);
      Message.error(`Failed to unfollow feed: ${feed.title}`);
    }
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      sorter: (a, b) => a.title.localeCompare(b.title, "en"),
      render: (title, feed) => {
        const parsingErrorCount = feed.parsing_error_count;
        let displayText = feed.disabled ? `🚫 ${title}` : title;
        if (parsingErrorCount > 0) {
          displayText = `⚠️ ${title}`;
        }

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

    !isBelowMedium && {
      title: "Feed URL",
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
      render: (category) => (
        <Typography.Ellipsis expandable={false} showTooltip={true}>
          <Tag>{category}</Tag>
        </Typography.Ellipsis>
      ),
    },

    !isBelowMedium && {
      title: "Checked at",
      dataIndex: "checked_at",
      sorter: (a, b) => a.checked_at.localeCompare(b.checked_at, "en"),
      render: (checkedAt) => (
        <Typography.Ellipsis expandable={false}>
          {generateRelativeTime(checkedAt, showDetailedRelativeTime)}
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
            onClick={() => refreshSingleFeed(record)}
            type="button"
          >
            <IconRefresh />
          </button>
          <Popconfirm
            focusLock
            position="left"
            title="Unfollow？"
            onOk={() => removeFeed(record)}
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
      const data = await updateFeed(feedId, newDetails);
      setFeedsData((feeds) =>
        feeds.map((feed) => (feed.id === feedId ? { ...feed, ...data } : feed)),
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
      <div
        style={{
          alignItems: "center",
          display: "flex",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          <Input.Search
            className="search-input"
            placeholder="Search title or site URL or feed URL"
            searchButton
            onChange={setFilterString}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            paddingBottom: 16,
            paddingLeft: 16,
          }}
        >
          <Button
            icon={<IconEdit />}
            shape="circle"
            onClick={() => setBulkUpdateModalVisible(true)}
          />
          <Modal
            className="edit-modal"
            onOk={bulkUpdateFeedHosts}
            title="Bulk Update Hosts"
            visible={bulkUpdateModalVisible}
            onCancel={() => {
              setBulkUpdateModalVisible(false);
              setNewHost("");
            }}
          >
            <Paragraph>
              This will bulk update filtered feeds' hosts.
              <br />
              Only recommended for RssHub.
            </Paragraph>
            <Input
              placeholder="rsshub.app"
              value={newHost}
              onChange={(value) => setNewHost(value)}
            />
          </Modal>
          <RefreshModal />
        </div>
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
            onSubmit={async (values) => {
              const newDetails = {
                categoryId: values.category,
                title: values.title,
                siteUrl: values.siteUrl.trim(),
                feedUrl: values.feedUrl.trim(),
                hidden: values.hidden,
                disabled: values.disabled,
                isFullText: values.crawler,
              };
              if (newDetails.feedUrl) {
                await editFeed(selectedFeed.key, newDetails);
              } else {
                Message.error("Feed URL cannot be empty");
              }
            }}
          >
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
            <Form.Item label="Title" field="title" rules={[{ required: true }]}>
              <Input placeholder="Please input feed title" />
            </Form.Item>
            <Form.Item
              label="Site URL"
              field="siteUrl"
              rules={[{ required: true }]}
            >
              <Input placeholder="Please input site URL" />
            </Form.Item>
            <Form.Item
              label="Feed URL"
              field="feedUrl"
              rules={[{ required: true }]}
            >
              <Input placeholder="Please input feed URL" />
            </Form.Item>
            <Form.Item
              label="Hidden"
              field="hidden"
              initialValue={selectedFeed.hidden}
              triggerPropName="checked"
              rules={[{ type: "boolean" }]}
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label="Disabled"
              field="disabled"
              initialValue={selectedFeed.disabled}
              triggerPropName="checked"
              rules={[{ type: "boolean" }]}
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label="Fetch original content"
              field="crawler"
              tooltip={<div>Only affects newly retrieved articles</div>}
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

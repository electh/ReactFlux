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

import { atom, useAtomValue, useSetAtom } from "jotai";
import { categoriesAtom, feedsWithUnreadAtom } from "../../atoms/dataAtom";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import { sleep } from "../../utils/time";
import "./FeedList.css";

const { Paragraph } = Typography;

const filterStringAtom = atom("");

const filteredFeedsAtom = atom((get) => {
  const feeds = get(feedsWithUnreadAtom);
  const filterString = get(filterStringAtom);
  return [...feeds]
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
});

const tableDataAtom = atom((get) => {
  const feeds = get(filteredFeedsAtom);
  return feeds.map((feed) => ({
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
});

const FeedList = () => {
  const [bulkUpdateModalVisible, setBulkUpdateModalVisible] = useState(false);
  const [feedForm] = Form.useForm();
  const [feedModalVisible, setFeedModalVisible] = useState(false);
  const [newHost, setNewHost] = useState("");
  const [selectedFeed, setSelectedFeed] = useState({});

  const categories = useAtomValue(categoriesAtom);
  const filteredFeeds = useAtomValue(filteredFeedsAtom);
  const setFeeds = useSetAtom(feedsWithUnreadAtom);
  const setFilterString = useSetAtom(filterStringAtom);
  const tableData = useAtomValue(tableDataAtom);
  const { belowMd } = useScreenWidth();

  useEffect(() => {
    setFilterString("");
  }, [setFilterString]);

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

  const handleRefresh = async (
    refreshFunc,
    updateFeeds,
    showMessage = true,
  ) => {
    try {
      const response = await refreshFunc();
      const isSuccessful = response.status === 204;
      const message = isSuccessful ? "Refreshed" : "Failed to refresh";

      if (showMessage) {
        if (isSuccessful) {
          Message.success(message);
        } else {
          Message.error(message);
        }
      }

      setFeeds((feeds) => feeds.map((f) => updateFeeds(f, isSuccessful)));
      return isSuccessful;
    } catch (error) {
      if (showMessage) {
        Message.error("Failed to refresh");
      }
      setFeeds((feeds) => feeds.map((f) => updateFeeds(f, false)));
      return false;
    }
  };

  const handleRefreshFeed = async (feed, showMessage = true) => {
    const feedId = feed.id || feed.key;

    const updateFeeds = (currentFeed, isSuccessful) => {
      if (currentFeed.id === feedId) {
        return {
          ...currentFeed,
          parsing_error_count: isSuccessful
            ? 0
            : currentFeed.parsing_error_count + 1,
          checked_at: getUTCDate(),
        };
      }
      return currentFeed;
    };

    return await handleRefresh(
      () => refreshFeed(feedId),
      updateFeeds,
      showMessage,
    );
  };

  const handleBulkUpdateHosts = async () => {
    try {
      for (const feed of filteredFeeds) {
        const oldHost = new URL(feed.feed_url).hostname;
        const newURL = feed.feed_url.replace(oldHost, newHost);
        const response = await updateFeed(feed.id, { url: newURL });
        setFeeds((feeds) =>
          feeds.map((f) => (f.id === feed.id ? { ...f, ...response.data } : f)),
        );
      }
      Message.success("Successfully bulk updated");
      setBulkUpdateModalVisible(false);
    } catch (error) {
      Message.error("Failed to bulk update, please try again");
    }
  };

  const RefreshModal = () => {
    const [visible, setVisible] = useState(false);

    const updateFeeds = (f, isSuccessful) => ({
      ...f,
      parsing_error_count: isSuccessful ? 0 : f.parsing_error_count + 1,
      checked_at: getUTCDate(),
    });

    const handleRefreshAllFeeds = async () => {
      setVisible(false);
      await handleRefresh(refreshAllFeed, updateFeeds);
    };

    const handleRefreshErrorFeeds = async () => {
      setVisible(false);
      const errorFeeds = filteredFeeds.filter((f) => f.parsing_error_count > 0);
      Message.success("Starting refresh of error feeds, please wait");

      let successCount = 0;
      let failureCount = 0;

      for (const feed of errorFeeds) {
        const isSuccessful = await handleRefreshFeed(feed, false);
        if (isSuccessful) {
          successCount++;
        } else {
          failureCount++;
        }
        await sleep(500);
      }

      Message.success(
        `Feeds refreshed. Success: ${successCount}, Failure: ${failureCount}`,
      );
    };

    const handleCancel = () => setVisible(false);

    const showModal = () => setVisible(true);

    return (
      <>
        <Button icon={<IconRefresh />} shape="circle" onClick={showModal} />
        <Modal
          className="edit-modal"
          onCancel={handleCancel}
          title="Refresh Feeds"
          visible={visible}
          footer={[
            <Button key="cancel" onClick={handleCancel}>
              Cancel
            </Button>,
            <Button
              key="error"
              onClick={handleRefreshErrorFeeds}
              type="outline"
            >
              Error Feeds
            </Button>,
            <Button key="all" onClick={handleRefreshAllFeeds} type="primary">
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
        let displayText = title;
        if (feed.disabled) {
          displayText = `🚫 ${title}`;
        } else if (parsingErrorCount > 0) {
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

    !belowMd && {
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
      render: (col) => (
        <Typography.Ellipsis expandable={false} showTooltip={true}>
          <Tag>{col}</Tag>
        </Typography.Ellipsis>
      ),
    },

    !belowMd && {
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
            onClick={() => setBulkUpdateModalVisible(true)}
            shape="circle"
          />
          <Modal
            className="edit-modal"
            onOk={handleBulkUpdateHosts}
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

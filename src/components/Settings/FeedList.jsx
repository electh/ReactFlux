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

import { useStore } from "@nanostores/react";
import { atom, computed } from "nanostores";
import { polyglotState } from "../../hooks/useLanguage";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import {
  categoriesState,
  dataState,
  setFeedsData,
} from "../../store/dataState";
import { settingsState } from "../../store/settingsState";
import { createSetter } from "../../utils/nanostores";
import { sleep } from "../../utils/time";
import "./FeedList.css";

const filterStringState = atom("");
const setFilterString = createSetter(filterStringState);

const filteredFeedsState = computed(
  [dataState, filterStringState],
  (data, filterString) => {
    const { feedsData } = data;
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
);

const tableDataState = computed(filteredFeedsState, (filteredFeeds) => {
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
});

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
  const categories = useStore(categoriesState);
  const { isAppDataReady } = useStore(dataState);
  const { showDetailedRelativeTime } = useStore(settingsState);
  const filteredFeeds = useStore(filteredFeedsState);
  const tableData = useStore(tableDataState);
  const { polyglot } = useStore(polyglotState);

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
          ? Message.success(polyglot.t("feed_table.refresh_success"))
          : Message.error(polyglot.t("feed_table.refresh_error"));
      }

      setFeedsData((feeds) =>
        feeds.map((feed) => feedUpdater(feed, isSuccessful)),
      );
      return isSuccessful;
    } catch (error) {
      if (displayMessage) {
        Message.error(polyglot.t("feed_table.refresh_error"));
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

      Message.success(polyglot.t("feed_table.bulk_update_success"));
      setBulkUpdateModalVisible(false);
    } catch (error) {
      Message.error(polyglot.t("feed_table.bulk_update_error"));
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
      Message.success(
        polyglot.t("feed_table.bulk_refresh_error_feeds_message"),
      );

      let successCount = 0;
      let failureCount = 0;

      for (const feed of errorFeeds) {
        const isSuccessful = await refreshSingleFeed(feed, false);
        if (isSuccessful) {
          successCount++;
        } else {
          failureCount++;
        }
        await sleep(500);
      }

      Message.success(
        polyglot.t("feed_table.bulk_refresh_error_feeds_result", {
          success: successCount,
          failure: failureCount,
        }),
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
          title={polyglot.t("feed_table.refresh_feeds_title")}
          visible={visible}
          footer={[
            <Button key="cancel" onClick={closeModal}>
              {polyglot.t("feed_table.refresh_feeds_cancel")}
            </Button>,
            <Button key="error" type="outline" onClick={refreshErrorFeeds}>
              {polyglot.t("feed_table.refresh_feeds_error")}
            </Button>,
            <Button key="all" type="primary" onClick={refreshAllFeeds}>
              {polyglot.t("feed_table.refresh_feeds_all")}
            </Button>,
          ]}
        >
          <p>{polyglot.t("feed_table.refresh_feeds_description")}</p>
        </Modal>
      </>
    );
  };

  const removeFeed = async (feed) => {
    try {
      const response = await deleteFeed(feed.key);
      if (response.status === 204) {
        setFeedsData((feeds) => feeds.filter((f) => f.id !== feed.key));
        Message.success(
          polyglot.t("feed_table.remove_feed_success", { title: feed.title }),
        );
      } else {
        Message.error(
          polyglot.t("feed_table.remove_feed_error", { title: feed.title }),
        );
      }
    } catch (error) {
      console.error(`Failed to unfollow feed: ${feed.title}`, error);
      Message.error(
        polyglot.t("feed_table.remove_feed_error", { title: feed.title }),
      );
    }
  };

  const columns = [
    {
      title: polyglot.t("feed_table.table_title"),
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
      title: polyglot.t("feed_table.table_url"),
      dataIndex: "feed_url",
      sorter: (a, b) => a.feed_url.localeCompare(b.feed_url, "en"),
      render: (feedUrl) => (
        <Typography.Ellipsis expandable={false} showTooltip={true}>
          {feedUrl}
        </Typography.Ellipsis>
      ),
    },

    {
      title: polyglot.t("feed_table.table_category"),
      dataIndex: "category.title",
      sorter: (a, b) => a.category.title.localeCompare(b.category.title, "en"),
      render: (category) => (
        <Typography.Ellipsis expandable={false} showTooltip={true}>
          <Tag>{category}</Tag>
        </Typography.Ellipsis>
      ),
    },

    !isBelowMedium && {
      title: polyglot.t("feed_table.table_checked_at"),
      dataIndex: "checked_at",
      sorter: (a, b) => a.checked_at.localeCompare(b.checked_at, "en"),
      render: (checkedAt) => (
        <Typography.Ellipsis expandable={false}>
          {generateRelativeTime(checkedAt, showDetailedRelativeTime)}
        </Typography.Ellipsis>
      ),
    },

    {
      title: polyglot.t("feed_table.table_actions"),
      dataIndex: "op",
      fixed: "right",
      width: 100,
      render: (col, record) => (
        <Space>
          <button
            aria-label={polyglot.t("feed_table.table_feed_edit_label")}
            className="list-item-action"
            onClick={() => handleSelectFeed(record)}
            type="button"
          >
            <IconEdit />
          </button>
          <button
            aria-label={polyglot.t("feed_table.table_feed_refresh_label")}
            className="list-item-action"
            onClick={() => refreshSingleFeed(record)}
            type="button"
          >
            <IconRefresh />
          </button>
          <Popconfirm
            focusLock
            position="left"
            title={polyglot.t("feed_table.table_feed_remove_confirm")}
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
      Message.success(polyglot.t("feed_table.update_feed_success"));
      setFeedModalVisible(false);
      feedForm.resetFields();
    } catch (error) {
      Message.error(polyglot.t("feed_table.update_feed_error"));
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
            placeholder={polyglot.t("feed_table.search_placeholder")}
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
            title={polyglot.t("feed_table.modal_bulk_update_title")}
            visible={bulkUpdateModalVisible}
            onCancel={() => {
              setBulkUpdateModalVisible(false);
              setNewHost("");
            }}
          >
            <p>{polyglot.t("feed_table.modal_bulk_update_description")}</p>
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
        loading={!isAppDataReady}
        pagePosition="bottomCenter"
        scroll={{ x: true }}
        size="small"
      />
      {selectedFeed && (
        <Modal
          className="edit-modal"
          onOk={feedForm.submit}
          title={polyglot.t("feed_table.modal_edit_feed_title")}
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
                Message.error(
                  polyglot.t("feed_table.modal_edit_feed_submit_error"),
                );
              }
            }}
          >
            <Form.Item
              label={polyglot.t("feed_table.modal_edit_feed_category_label")}
              required
              field="category"
              rules={[{ required: true }]}
            >
              <Select>
                {categories.map((category) => (
                  <Select.Option key={category.id} value={category.id}>
                    {category.title}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label={polyglot.t("feed_table.modal_edit_feed_title_label")}
              field="title"
              rules={[{ required: true }]}
            >
              <Input
                placeholder={polyglot.t(
                  "feed_table.modal_edit_feed_title_placeholder",
                )}
              />
            </Form.Item>
            <Form.Item
              label={polyglot.t("feed_table.modal_edit_feed_site_url_label")}
              field="siteUrl"
              rules={[{ required: true }]}
            >
              <Input
                placeholder={polyglot.t(
                  "feed_table.modal_edit_feed_site_url_placeholder",
                )}
              />
            </Form.Item>
            <Form.Item
              label={polyglot.t("feed_table.modal_edit_feed_feed_url_label")}
              field="feedUrl"
              rules={[{ required: true }]}
            >
              <Input
                placeholder={polyglot.t(
                  "feed_table.modal_edit_feed_feed_url_placeholder",
                )}
              />
            </Form.Item>
            <Form.Item
              label={polyglot.t("feed_table.modal_edit_feed_hidden_label")}
              field="hidden"
              initialValue={selectedFeed.hidden}
              triggerPropName="checked"
              rules={[{ type: "boolean" }]}
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label={polyglot.t("feed_table.modal_edit_feed_disabled_label")}
              field="disabled"
              initialValue={selectedFeed.disabled}
              triggerPropName="checked"
              rules={[{ type: "boolean" }]}
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label={polyglot.t("feed_table.modal_edit_feed_crawler_label")}
              field="crawler"
              tooltip={
                <div>
                  {polyglot.t("feed_table.modal_edit_feed_crawler_tooltip")}
                </div>
              }
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

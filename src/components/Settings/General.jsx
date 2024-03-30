import {
  Divider,
  InputNumber,
  Select,
  Switch,
  Typography,
} from "@arco-design/web-react";
import React, { useEffect } from "react";
import useStore from "../../Store.js";
import { setConfig } from "../../utils/config.js";

const General = () => {
  const showStatus = useStore((state) => state.showStatus);
  const setShowStatus = useStore((state) => state.setShowStatus);
  const homePage = useStore((state) => state.homePage);
  const setHomePage = useStore((state) => state.setHomePage);
  const orderBy = useStore((state) => state.orderBy);
  const orderDirection = useStore((state) => state.orderDirection);
  const pageSize = useStore((state) => state.pageSize);
  const showAllFeeds = useStore((state) => state.showAllFeeds);
  const setOrderBy = useStore((state) => state.setOrderBy);
  const setOrderDirection = useStore((state) => state.setOrderDirection);
  const setPageSize = useStore((state) => state.setPageSize);
  const toggleShowAllFeeds = useStore((state) => state.toggleShowAllFeeds);
  const feeds = useStore((state) => state.feeds);
  const hiddenFeedIds = useStore((state) => state.hiddenFeedIds);
  const setUnreadTotal = useStore((state) => state.setUnreadTotal);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setConfig("showAllFeeds", showAllFeeds);
    if (!showAllFeeds && hiddenFeedIds) {
      const showedFeedsUnreadCount = feeds
        .filter((feed) => !hiddenFeedIds.includes(feed.id))
        .reduce((acc, feed) => acc + feed.unreadCount, 0);
      setUnreadTotal(() => showedFeedsUnreadCount);
    } else {
      setUnreadTotal(() =>
        feeds.reduce((acc, feed) => acc + feed.unreadCount, 0),
      );
    }
  }, [showAllFeeds]);

  return (
    <>
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Default show status
          </Typography.Title>
          <Typography.Text type="secondary">
            Which status to show by default:
          </Typography.Text>
        </div>
        <div>
          <Select
            onChange={(showStatus) => {
              setShowStatus(showStatus);
              setConfig("showStatus", showStatus);
            }}
            placeholder="Select status"
            style={{ width: 128, marginLeft: 16 }}
            value={showStatus}
          >
            <Select.Option value="all">All</Select.Option>
            <Select.Option value="unread">Unread</Select.Option>
          </Select>
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Default home page
          </Typography.Title>
          <Typography.Text type="secondary">
            Which page to show by default:
          </Typography.Text>
        </div>
        <div>
          <Select
            onChange={(homePage) => {
              setHomePage(homePage);
              setConfig("homePage", homePage);
            }}
            placeholder="Select page"
            style={{ width: 128, marginLeft: 16 }}
            value={homePage}
          >
            <Select.Option value="all">All</Select.Option>
            <Select.Option value="today">Today</Select.Option>
            <Select.Option value="starred">Starred</Select.Option>
            <Select.Option value="history">History</Select.Option>
          </Select>
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Entries order
          </Typography.Title>
          <Typography.Text type="secondary">
            What order to show entries:
          </Typography.Text>
        </div>
        <div>
          <Select
            onChange={(orderBy) => {
              setOrderBy(orderBy);
              setConfig("orderBy", orderBy);
            }}
            placeholder="Select order"
            style={{ width: 128, marginLeft: 16 }}
            value={orderBy}
          >
            <Select.Option value="published_at">Published at</Select.Option>
            <Select.Option value="created_at">Created at</Select.Option>
          </Select>
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Entries order direction
          </Typography.Title>
          <Typography.Text type="secondary">
            What order direction to show entries:
          </Typography.Text>
        </div>
        <div>
          <Select
            onChange={(orderDirection) => {
              setOrderDirection(orderDirection);
              setConfig("orderDirection", orderDirection);
            }}
            placeholder="Select order"
            style={{ width: 128, marginLeft: 16 }}
            value={orderDirection}
          >
            <Select.Option value="asc">Oldest first</Select.Option>
            <Select.Option value="desc">Newest first</Select.Option>
          </Select>
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Entries per page
          </Typography.Title>
          <Typography.Text type="secondary">
            Show how many entries per page:
          </Typography.Text>
        </div>
        <div>
          <InputNumber
            defaultValue={pageSize}
            min={1}
            mode="button"
            onChange={(pageSize) => {
              setPageSize(pageSize);
              setConfig("pageSize", pageSize);
            }}
            size="small"
            style={{ width: 128, marginLeft: 16 }}
          />
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Show all entries
          </Typography.Title>
          <Typography.Text type="secondary">
            Whether to show all entries of all feeds (including hidden)
          </Typography.Text>
        </div>
        <div>
          <Switch checked={showAllFeeds} onChange={toggleShowAllFeeds} />
        </div>
      </div>
    </>
  );
};

export default General;

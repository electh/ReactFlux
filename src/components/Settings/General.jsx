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
  const orderBy = useStore((state) => state.orderBy);
  const orderDirection = useStore((state) => state.orderDirection);
  const pageSize = useStore((state) => state.pageSize);
  const showAllFeeds = useStore((state) => state.showAllFeeds);
  const setOrderBy = useStore((state) => state.setOrderBy);
  const setOrderDirection = useStore((state) => state.setOrderDirection);
  const setPageSize = useStore((state) => state.setPageSize);
  const toggleShowAllFeeds = useStore((state) => state.toggleShowAllFeeds);

  useEffect(() => {
    setConfig("orderBy", orderBy);
  }, [orderBy]);

  useEffect(() => {
    setConfig("orderDirection", orderDirection);
  }, [orderDirection]);

  useEffect(() => {
    setConfig("pageSize", pageSize);
  }, [pageSize]);

  useEffect(() => {
    setConfig("showAllFeeds", showAllFeeds);
  }, [showAllFeeds]);

  return (
    <>
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
            onChange={setOrderBy}
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
            onChange={setOrderDirection}
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
            onChange={setPageSize}
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

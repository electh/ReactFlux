import {
  Divider,
  InputNumber,
  Select,
  Typography,
} from "@arco-design/web-react";
import React from "react";
import useStore from "../../Store.js";
import { setConfig } from "../../utils/config.js";

const General = () => {
  const showStatus = useStore((state) => state.showStatus);
  const setShowStatus = useStore((state) => state.setShowStatus);
  const homePage = useStore((state) => state.homePage);
  const setHomePage = useStore((state) => state.setHomePage);
  const orderBy = useStore((state) => state.orderBy);
  const pageSize = useStore((state) => state.pageSize);
  const setOrderBy = useStore((state) => state.setOrderBy);
  const setPageSize = useStore((state) => state.setPageSize);

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
    </>
  );
};

export default General;

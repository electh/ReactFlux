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
  const entriesOrder = useStore((state) => state.entriesOrder);
  const entriesPerPage = useStore((state) => state.entriesPerPage);
  const showAllFeeds = useStore((state) => state.showAllFeeds);
  const setEntriesOrder = useStore((state) => state.setEntriesOrder);
  const setEntriesPerPage = useStore((state) => state.setEntriesPerPage);
  const toggleShowAllFeeds = useStore((state) => state.toggleShowAllFeeds);

  useEffect(() => {
    setConfig("entriesOrder", entriesOrder);
  }, [entriesOrder]);

  useEffect(() => {
    setConfig("entriesPerPage", entriesPerPage);
  }, [entriesPerPage]);

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
            onChange={setEntriesOrder}
            placeholder="Select order"
            style={{ width: 120, marginLeft: 16 }}
            value={entriesOrder}
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
            defaultValue={entriesPerPage}
            min={1}
            mode="button"
            onChange={setEntriesPerPage}
            size="small"
            style={{ width: 120, marginLeft: 16 }}
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

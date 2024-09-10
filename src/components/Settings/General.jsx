import {
  Divider,
  InputNumber,
  Select,
  Switch,
  Typography,
} from "@arco-design/web-react";
import { useStore } from "@nanostores/react";
import { settingsState, updateSettings } from "../../store/settingsState";
import "./General.css";

const General = () => {
  const { homePage, markReadOnScroll, orderBy, pageSize, removeDuplicates } =
    useStore(settingsState);

  return (
    <>
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
            className="input-select"
            onChange={(value) => updateSettings({ homePage: value })}
            placeholder="Select page"
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
            className="input-select"
            onChange={(value) => updateSettings({ orderBy: value })}
            placeholder="Select order"
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
            className="input-select"
            defaultValue={pageSize}
            min={1}
            mode="button"
            onChange={(value) => updateSettings({ pageSize: value })}
            size="small"
          />
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Remove duplicate articles
          </Typography.Title>
          <Typography.Text type="secondary">
            Automatically remove duplicate articles based on:
          </Typography.Text>
        </div>
        <div>
          <Select
            className="input-select"
            onChange={(value) => updateSettings({ removeDuplicates: value })}
            placeholder="Select option"
            value={removeDuplicates}
          >
            <Select.Option value="none">None</Select.Option>
            <Select.Option value="hash">Hash</Select.Option>
            <Select.Option value="title">Title</Select.Option>
            <Select.Option value="url">URL</Select.Option>
          </Select>
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Mark articles as read when scrolled off screen
          </Typography.Title>
          <Typography.Text type="secondary">
            Automatically mark articles as read when they are scrolled out of
            the visible screen area
          </Typography.Text>
        </div>
        <div>
          <Switch
            checked={markReadOnScroll}
            onChange={(value) => updateSettings({ markReadOnScroll: value })}
          />
        </div>
      </div>
    </>
  );
};

export default General;

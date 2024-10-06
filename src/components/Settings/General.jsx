import {
  Divider,
  InputNumber,
  Select,
  Switch,
  Typography,
} from "@arco-design/web-react";
import { useStore } from "@nanostores/react";
import { polyglotState } from "../../hooks/useLanguage";
import { settingsState, updateSettings } from "../../store/settingsState";
import "./General.css";

const languageOptions = [
  { label: "English", value: "en-US" },
  { label: "Español", value: "es-ES" },
  { label: "简体中文", value: "zh-CN" },
];

const General = () => {
  const {
    homePage,
    language,
    markReadOnScroll,
    orderBy,
    pageSize,
    removeDuplicates,
    showUnreadFeedsOnly,
  } = useStore(settingsState);
  const { polyglot } = useStore(polyglotState);

  const homePageOptions = [
    {
      label: polyglot.t("settings.default_home_page_option_all"),
      value: "all",
    },
    {
      label: polyglot.t("settings.default_home_page_option_today"),
      value: "today",
    },
    {
      label: polyglot.t("settings.default_home_page_option_starred"),
      value: "starred",
    },
    {
      label: polyglot.t("settings.default_home_page_option_history"),
      value: "history",
    },
  ];
  const removeDuplicatesOptions = [
    {
      label: polyglot.t("settings.remove_duplicates_option_none"),
      value: "none",
    },
    {
      label: polyglot.t("settings.remove_duplicates_option_hash"),
      value: "hash",
    },
    {
      label: polyglot.t("settings.remove_duplicates_option_title"),
      value: "title",
    },
    {
      label: polyglot.t("settings.remove_duplicates_option_url"),
      value: "url",
    },
  ];

  return (
    <>
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            {polyglot.t("appearance.language_label")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {polyglot.t("appearance.language_description")}
          </Typography.Text>
        </div>
        <div>
          <Select
            className="input-select"
            onChange={(value) => updateSettings({ language: value })}
            value={language}
          >
            {languageOptions.map(({ label, value }) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            {polyglot.t("settings.default_home_page_label")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {polyglot.t("settings.default_home_page_description")}
          </Typography.Text>
        </div>
        <div>
          <Select
            className="input-select"
            onChange={(value) => updateSettings({ homePage: value })}
            value={homePage}
          >
            {homePageOptions.map(({ label, value }) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            {polyglot.t("settings.show_unread_feeds_only_label")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {polyglot.t("settings.show_unread_feeds_only_description")}
          </Typography.Text>
        </div>
        <div>
          <Switch
            checked={showUnreadFeedsOnly}
            onChange={(value) => updateSettings({ showUnreadFeedsOnly: value })}
          />
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            {polyglot.t("settings.entries_order_label")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {polyglot.t("settings.entries_order_description")}
          </Typography.Text>
        </div>
        <div>
          <Select
            className="input-select"
            onChange={(value) => updateSettings({ orderBy: value })}
            value={orderBy}
          >
            <Select.Option value="published_at">
              {polyglot.t("settings.entries_order_option_published_at")}
            </Select.Option>
            <Select.Option value="created_at">
              {polyglot.t("settings.entries_order_option_created_at")}
            </Select.Option>
          </Select>
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            {polyglot.t("settings.entries_per_page_label")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {polyglot.t("settings.entries_per_page_description")}
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
            {polyglot.t("settings.remove_duplicates_label")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {polyglot.t("settings.remove_duplicates_description")}
          </Typography.Text>
        </div>
        <div>
          <Select
            className="input-select"
            onChange={(value) => updateSettings({ removeDuplicates: value })}
            value={removeDuplicates}
          >
            {removeDuplicatesOptions.map(({ label, value }) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            {polyglot.t("settings.mark_read_on_scroll_label")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {polyglot.t("settings.mark_read_on_scroll_description")}
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

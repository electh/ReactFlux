import {
  Divider,
  Slider,
  Space,
  Switch,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import React from "react";

import useStore from "../../Store";
import { applyColor, colors, getColorValue } from "../../utils/colors";
import { setConfig } from "../../utils/config";
import "./Appearance.css";

const Appearance = () => {
  const toggleLayout = useStore((state) => state.toggleLayout);
  const layout = useStore((state) => state.layout);
  const fontSize = useStore((state) => state.fontSize);
  const setFontSize = useStore((state) => state.setFontSize);
  const showFeedIcon = useStore((state) => state.showFeedIcon);
  const toggleShowFeedIcon = useStore((state) => state.toggleShowFeedIcon);
  const themeColor = useStore((state) => state.themeColor);
  const setThemeColor = useStore((state) => state.setThemeColor);
  const articleWidth = useStore((state) => state.articleWidth);
  const setArticleWidth = useStore((state) => state.setArticleWidth);

  return (
    <>
      <Typography.Title heading={6} style={{ marginTop: 0 }}>
        Theme
      </Typography.Title>
      <Typography.Text type="secondary">
        Customize your UI theme
      </Typography.Text>
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Accent color
          </Typography.Title>
          <Typography.Text type="secondary">
            Choose your accent color
          </Typography.Text>
        </div>
        <div style={{ display: "flex" }}>
          {colors.map((c) => (
            <Tooltip content={c.name} key={c.name}>
              <button
                type="button"
                className="accent-color-button"
                style={{
                  backgroundColor: getColorValue(c.name),
                  outline:
                    c.name === themeColor
                      ? `1px solid ${getColorValue(c.name)}`
                      : "none",
                }}
                onClick={() => {
                  setThemeColor(c.name);
                  setConfig("themeColor", c.name);
                  applyColor(c.name);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    setThemeColor(c.name);
                  }
                }}
              />
            </Tooltip>
          ))}
        </div>
      </div>

      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Compact article list
          </Typography.Title>
          <Typography.Text type="secondary">
            Use small thumbnail in article list
          </Typography.Text>
        </div>
        <div>
          <Switch
            checked={layout === "small"}
            onChange={(value) => {
              toggleLayout();
              setConfig("layout", value ? "small" : "large");
            }}
          />
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Show feed icon
          </Typography.Title>
          <Typography.Text type="secondary">
            Show feed icon in feed list and article list
          </Typography.Text>
        </div>
        <div>
          <Switch
            checked={showFeedIcon}
            onChange={(value) => {
              toggleShowFeedIcon();
              setConfig("showFeedIcon", value);
            }}
          />
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Font size
          </Typography.Title>
          <Typography.Text type="secondary">
            Adjust article text size
          </Typography.Text>
        </div>
        <div>
          <Space>
            <Typography.Text style={{ fontSize: "0.75rem" }}>A</Typography.Text>
            <Slider
              formatTooltip={(value) => `${value}rem`}
              max={1.25}
              min={0.75}
              showTicks
              step={0.05}
              style={{ width: 200 }}
              value={fontSize}
              onChange={(value) => {
                setFontSize(value);
                setConfig("fontSize", value);
              }}
            />
            <Typography.Text style={{ fontSize: "1.25rem" }}>A</Typography.Text>
          </Space>
        </div>
      </div>
      <Divider />
      <div className="setting-row">
        <div>
          <Typography.Title heading={6} style={{ marginTop: 0 }}>
            Article width
          </Typography.Title>
          <Typography.Text type="secondary">
            Adjust article width
          </Typography.Text>
        </div>
        <div>
          <Space>
            <Typography.Text>60%</Typography.Text>
            <Slider
              formatTooltip={(value) => `${value}%`}
              max={90}
              min={60}
              showTicks
              step={10}
              style={{ width: 200 }}
              value={articleWidth}
              onChange={(value) => {
                setArticleWidth(value);
                setConfig("bodyWidth", value);
              }}
            />
            <Typography.Text>90%</Typography.Text>
          </Space>
        </div>
      </div>
    </>
  );
};

export default Appearance;

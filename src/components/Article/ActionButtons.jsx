import {
  Button,
  Divider,
  Dropdown,
  InputNumber,
  Menu,
  Radio,
} from "@arco-design/web-react";
import {
  IconAlignCenter,
  IconAlignLeft,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconClose,
  IconCloudDownload,
  IconMinusCircle,
  IconMoreVertical,
  IconRecord,
  IconSave,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon";
import { memo, useEffect, useState } from "react";

import { useStore } from "@nanostores/react";
import useEntryActions from "../../hooks/useEntryActions";
import useKeyHandlers from "../../hooks/useKeyHandlers";
import { polyglotState } from "../../hooks/useLanguage";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import {
  contentState,
  nextContentState,
  prevContentState,
} from "../../store/contentState";
import { dataState } from "../../store/dataState";
import { settingsState, updateSettings } from "../../store/settingsState";
import CustomTooltip from "../ui/CustomTooltip";
import "./ActionButtons.css";

const DesktopButtons = memo(
  ({
    commonButtons,
    hasIntegrations,
    prevContent,
    nextContent,
    navigateToPreviousArticle,
    navigateToNextArticle,
    handleSaveToThirdPartyServices,
    polyglot,
  }) => (
    <>
      <div className="left-side">
        {commonButtons.close}
        <CustomTooltip
          content={polyglot.t("article_card.previous_tooltip")}
          mini
        >
          <Button
            icon={<IconArrowLeft />}
            onClick={navigateToPreviousArticle}
            shape="circle"
            disabled={!prevContent}
          />
        </CustomTooltip>
        <CustomTooltip content={polyglot.t("article_card.next_tooltip")} mini>
          <Button
            icon={<IconArrowRight />}
            onClick={navigateToNextArticle}
            shape="circle"
            disabled={!nextContent}
          />
        </CustomTooltip>
      </div>
      <div className="right-side">
        {commonButtons.status}
        {commonButtons.star}
        {commonButtons.fetch}
        {hasIntegrations && (
          <CustomTooltip
            mini
            content={polyglot.t(
              "article_card.save_to_third_party_services_tooltip",
            )}
          >
            <Button
              icon={<IconSave />}
              onClick={handleSaveToThirdPartyServices}
              shape="circle"
            />
          </CustomTooltip>
        )}
        {commonButtons.more}
      </div>
    </>
  ),
);

const MobileButtons = memo(({ commonButtons }) => (
  <div className="mobile-buttons">
    {commonButtons.status}
    {commonButtons.star}
    {commonButtons.close}
    {commonButtons.fetch}
    {commonButtons.more}
  </div>
));

const ActionButtons = () => {
  const { activeContent } = useStore(contentState);
  const { hasIntegrations } = useStore(dataState);
  const { polyglot } = useStore(polyglotState);

  const { articleWidth, fontSize, fontFamily, titleAlignment } =
    useStore(settingsState);

  const nextContent = useStore(nextContentState);
  const prevContent = useStore(prevContentState);

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isFetchedOriginal, setIsFetchedOriginal] = useState(false);

  const {
    handleFetchContent,
    handleSaveToThirdPartyServices,
    handleToggleStarred,
    handleToggleStatus,
  } = useEntryActions();

  const { exitDetailView, navigateToNextArticle, navigateToPreviousArticle } =
    useKeyHandlers();

  const { isBelowMedium } = useScreenWidth();

  const isUnread = activeContent.status === "unread";
  const isStarred = activeContent.starred;

  const fontFamilyOptions = [
    { label: polyglot.t("appearance.font_family_system"), value: "system-ui" },
    { label: "Sans-serif", value: "sans-serif" },
    { label: "Serif", value: "serif" },
    { label: "Fira Sans", value: "'Fira Sans', sans-serif" },
    { label: "Open Sans", value: "'Open Sans', sans-serif" },
    { label: "Source Sans Pro", value: "'Source Sans Pro', sans-serif" },
    { label: "Source Serif Pro", value: "'Source Serif Pro', serif" },
    {
      label: polyglot.t("appearance.font_family_noto_sans"),
      value: "'Noto Sans SC', sans-serif",
    },
    {
      label: polyglot.t("appearance.font_family_noto_serif"),
      value: "'Noto Serif SC', serif",
    },
    {
      label: polyglot.t("appearance.font_family_lxgw_wenkai"),
      value: "'LXGW WenKai Screen', sans-serif",
    },
  ];

  const commonButtons = {
    status: (
      <CustomTooltip
        mini
        content={
          isUnread
            ? polyglot.t("article_card.mark_as_read_tooltip")
            : polyglot.t("article_card.mark_as_unread_tooltip")
        }
      >
        <Button
          icon={isUnread ? <IconMinusCircle /> : <IconRecord />}
          onClick={() => handleToggleStatus(activeContent)}
          shape="circle"
        />
      </CustomTooltip>
    ),
    star: (
      <CustomTooltip
        mini
        content={
          isStarred
            ? polyglot.t("article_card.unstar_tooltip")
            : polyglot.t("article_card.star_tooltip")
        }
      >
        <Button
          icon={
            isStarred ? (
              <IconStarFill style={{ color: "#ffcd00" }} />
            ) : (
              <IconStar />
            )
          }
          onClick={() => handleToggleStarred(activeContent)}
          shape="circle"
        />
      </CustomTooltip>
    ),
    close: (
      <CustomTooltip content={polyglot.t("article_card.close_tooltip")} mini>
        <Button
          icon={<IconClose />}
          onClick={() => exitDetailView()}
          shape="circle"
        />
      </CustomTooltip>
    ),
    fetch: (
      <CustomTooltip
        content={polyglot.t("article_card.fetch_original_tooltip")}
        mini
      >
        <Button
          icon={<IconCloudDownload />}
          onClick={async () => {
            await handleFetchContent();
            setIsFetchedOriginal(true);
          }}
          shape="circle"
          disabled={isFetchedOriginal}
        />
      </CustomTooltip>
    ),
    more: (
      <Dropdown
        position="br"
        trigger="click"
        popupVisible={dropdownVisible}
        onVisibleChange={setDropdownVisible}
        triggerProps={{ className: "settings-dropdown" }}
        droplist={
          <Menu>
            {hasIntegrations && isBelowMedium && (
              <>
                <Menu.Item
                  key="save_to_third_party_services"
                  onClick={handleSaveToThirdPartyServices}
                >
                  <span>
                    {polyglot.t(
                      "article_card.save_to_third_party_services_tooltip",
                    )}
                  </span>
                </Menu.Item>
                <Divider style={{ margin: "4px 0" }} />
              </>
            )}

            <Menu.Item key="title-alignment">
              <div className="settings-menu-item">
                <span>{polyglot.t("appearance.title_alignment_label")}</span>
                <Radio.Group
                  type="button"
                  name="title-alignment"
                  value={titleAlignment}
                  onChange={(value) =>
                    updateSettings({ titleAlignment: value })
                  }
                >
                  <Radio value="left">
                    <IconAlignLeft />
                  </Radio>
                  <Radio value="center">
                    <IconAlignCenter />
                  </Radio>
                </Radio.Group>
              </div>
            </Menu.Item>

            <Menu.SubMenu
              key="font-family"
              triggerProps={{ className: "font-family-submenu" }}
              title={
                <div className="settings-menu-item">
                  <span>{polyglot.t("appearance.font_family_label")}</span>
                  <span>
                    {
                      fontFamilyOptions.find((opt) => opt.value === fontFamily)
                        ?.label
                    }
                  </span>
                </div>
              }
            >
              {fontFamilyOptions.map(({ label, value }) => (
                <Menu.Item
                  key={value}
                  onClick={() => updateSettings({ fontFamily: value })}
                >
                  <div className="settings-menu-item">
                    {label}
                    {value === fontFamily && <IconCheck />}
                  </div>
                </Menu.Item>
              ))}
            </Menu.SubMenu>

            <Menu.Item key="font-size">
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <div
                className="settings-menu-item"
                onClick={(e) => e.stopPropagation()}
              >
                <span>{polyglot.t("appearance.font_size_label")}</span>
                <InputNumber
                  min={0.75}
                  max={1.25}
                  step={0.05}
                  value={fontSize}
                  onChange={(value) => updateSettings({ fontSize: value })}
                  suffix="rem"
                  style={{ width: 90 }}
                  size="small"
                />
              </div>
            </Menu.Item>

            <Menu.Item key="article-width">
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <div
                className="settings-menu-item"
                onClick={(e) => e.stopPropagation()}
              >
                <span>{polyglot.t("appearance.article_width_label")}</span>
                <InputNumber
                  min={60}
                  max={90}
                  step={10}
                  value={articleWidth}
                  onChange={(value) => updateSettings({ articleWidth: value })}
                  suffix="%"
                  style={{ width: 90 }}
                  size="small"
                />
              </div>
            </Menu.Item>
          </Menu>
        }
      >
        <Button icon={<IconMoreVertical />} shape="circle" />
      </Dropdown>
    ),
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setIsFetchedOriginal(false);
  }, [activeContent]);

  return (
    <div className={`action-buttons ${isBelowMedium ? "mobile" : ""}`}>
      {isBelowMedium ? (
        <MobileButtons commonButtons={commonButtons} />
      ) : (
        <DesktopButtons
          commonButtons={commonButtons}
          hasIntegrations={hasIntegrations}
          prevContent={prevContent}
          nextContent={nextContent}
          navigateToPreviousArticle={navigateToPreviousArticle}
          navigateToNextArticle={navigateToNextArticle}
          handleSaveToThirdPartyServices={handleSaveToThirdPartyServices}
          polyglot={polyglot}
        />
      )}
    </div>
  );
};

export default ActionButtons;

import { Button, Divider, Dropdown, InputNumber, Menu, Radio, Switch } from "@arco-design/web-react"
import {
  IconAlignCenter,
  IconAlignLeft,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconClose,
  IconCloudDownload,
  IconLaunch,
  IconMinusCircle,
  IconMoreVertical,
  IconRecord,
  IconSave,
  IconShareExternal,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { memo, useEffect, useState } from "react"

import CustomTooltip from "@/components/ui/CustomTooltip"
import useEntryActions from "@/hooks/useEntryActions"
import useKeyHandlers from "@/hooks/useKeyHandlers"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { contentState, nextContentState, prevContentState } from "@/store/contentState"
import { dataState } from "@/store/dataState"
import { settingsState, updateSettings } from "@/store/settingsState"
import "./ActionButtons.css"

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
        <CustomTooltip mini content={polyglot.t("article_card.previous_tooltip")}>
          <Button
            disabled={!prevContent}
            icon={<IconArrowLeft />}
            shape="circle"
            onClick={navigateToPreviousArticle}
          />
        </CustomTooltip>
        <CustomTooltip mini content={polyglot.t("article_card.next_tooltip")}>
          <Button
            disabled={!nextContent}
            icon={<IconArrowRight />}
            shape="circle"
            onClick={navigateToNextArticle}
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
            content={polyglot.t("article_card.save_to_third_party_services_tooltip")}
          >
            <Button icon={<IconSave />} shape="circle" onClick={handleSaveToThirdPartyServices} />
          </CustomTooltip>
        )}
        {commonButtons.more}
      </div>
    </>
  ),
)
DesktopButtons.displayName = "DesktopButtons"

const MobileButtons = memo(({ commonButtons }) => (
  <div className="mobile-buttons">
    {commonButtons.status}
    {commonButtons.star}
    {commonButtons.close}
    {commonButtons.fetch}
    {commonButtons.more}
  </div>
))
MobileButtons.displayName = "MobileButtons"

const ActionButtons = () => {
  const { activeContent } = useStore(contentState)
  const { hasIntegrations } = useStore(dataState)
  const { polyglot } = useStore(polyglotState)

  const { articleWidth, edgeToEdgeImages, fontSize, fontFamily, titleAlignment } =
    useStore(settingsState)

  const nextContent = useStore(nextContentState)
  const prevContent = useStore(prevContentState)

  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [isFetchedOriginal, setIsFetchedOriginal] = useState(false)

  const {
    handleFetchContent,
    handleSaveToThirdPartyServices,
    handleToggleStarred,
    handleToggleStatus,
    handleOpenLinkExternally,
  } = useEntryActions()

  const { exitDetailView, navigateToNextArticle, navigateToPreviousArticle } = useKeyHandlers()

  const { isBelowMedium } = useScreenWidth()

  const isUnread = activeContent.status === "unread"
  const isStarred = activeContent.starred

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
  ]

  const handleShare = async () => {
    if (!navigator.share) {
      console.error("Web Share API is not supported")
      return
    }

    const shareData = {
      title: activeContent.title,
      url: activeContent.url,
    }

    if (navigator.canShare && !navigator.canShare(shareData)) {
      console.error("This content cannot be shared")
      return
    }

    try {
      await navigator.share(shareData)
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error sharing article:", error)
      }
    }
  }

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
          shape="circle"
          onClick={() => handleToggleStatus(activeContent)}
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
          icon={isStarred ? <IconStarFill style={{ color: "#ffcd00" }} /> : <IconStar />}
          shape="circle"
          onClick={() => handleToggleStarred(activeContent)}
        />
      </CustomTooltip>
    ),
    close: (
      <CustomTooltip mini content={polyglot.t("article_card.close_tooltip")}>
        <Button icon={<IconClose />} shape="circle" onClick={() => exitDetailView()} />
      </CustomTooltip>
    ),
    fetch: (
      <CustomTooltip mini content={polyglot.t("article_card.fetch_original_tooltip")}>
        <Button
          disabled={isFetchedOriginal}
          icon={<IconCloudDownload />}
          shape="circle"
          onClick={async () => {
            await handleFetchContent()
            setIsFetchedOriginal(true)
          }}
        />
      </CustomTooltip>
    ),
    more: (
      <Dropdown
        popupVisible={dropdownVisible}
        position="br"
        trigger="click"
        triggerProps={{ className: "settings-dropdown" }}
        droplist={
          <Menu>
            {hasIntegrations && isBelowMedium && (
              <Menu.Item
                key="save_to_third_party_services"
                onClick={handleSaveToThirdPartyServices}
              >
                <span>{polyglot.t("article_card.save_to_third_party_services_tooltip")}</span>
              </Menu.Item>
            )}

            {navigator.share && (
              <Menu.Item key="share" onClick={handleShare}>
                <div className="settings-menu-item">
                  <span>{polyglot.t("article_card.share_tooltip")}</span>
                  <IconShareExternal />
                </div>
              </Menu.Item>
            )}

            <Menu.Item key="open-in-browser" onClick={handleOpenLinkExternally}>
              <div className="settings-menu-item">
                <span>{polyglot.t("article_card.open_link_externally_tooltip")}</span>
                <IconLaunch />
              </div>
            </Menu.Item>

            <Divider style={{ margin: "4px 0" }} />

            <Menu.Item key="title-alignment">
              <div className="settings-menu-item">
                <span>{polyglot.t("appearance.title_alignment_label")}</span>
                <Radio.Group
                  name="title-alignment"
                  type="button"
                  value={titleAlignment}
                  onChange={(value) => updateSettings({ titleAlignment: value })}
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

            {isBelowMedium && (
              <Menu.Item key="edge-to-edge-images">
                <div className="settings-menu-item">
                  <span>{polyglot.t("appearance.edge_to_edge_images_label")}</span>
                  <Switch
                    checked={edgeToEdgeImages}
                    size="small"
                    onChange={(value) => updateSettings({ edgeToEdgeImages: value })}
                  />
                </div>
              </Menu.Item>
            )}

            <Menu.SubMenu
              key="font-family"
              triggerProps={{ className: "font-family-submenu" }}
              title={
                <div className="settings-menu-item">
                  <span>{polyglot.t("appearance.font_family_label")}</span>
                  <span>{fontFamilyOptions.find((opt) => opt.value === fontFamily)?.label}</span>
                </div>
              }
            >
              {fontFamilyOptions.map(({ label, value }) => (
                <Menu.Item key={value} onClick={() => updateSettings({ fontFamily: value })}>
                  <div className="settings-menu-item">
                    {label}
                    {value === fontFamily && <IconCheck />}
                  </div>
                </Menu.Item>
              ))}
            </Menu.SubMenu>

            <Menu.Item key="font-size">
              <div className="settings-menu-item" onClick={(e) => e.stopPropagation()}>
                <span>{polyglot.t("appearance.font_size_label")}</span>
                <InputNumber
                  max={1.25}
                  min={0.75}
                  size="small"
                  step={0.05}
                  style={{ width: 90 }}
                  suffix="rem"
                  value={fontSize}
                  onChange={(value) => updateSettings({ fontSize: value })}
                />
              </div>
            </Menu.Item>

            {!isBelowMedium && (
              <Menu.Item key="article-width">
                <div className="settings-menu-item" onClick={(e) => e.stopPropagation()}>
                  <span>{polyglot.t("appearance.article_width_label")}</span>
                  <InputNumber
                    max={100}
                    min={50}
                    size="small"
                    step={5}
                    style={{ width: 90 }}
                    suffix="ch"
                    value={articleWidth}
                    onChange={(value) => updateSettings({ articleWidth: value })}
                  />
                </div>
              </Menu.Item>
            )}
          </Menu>
        }
        onVisibleChange={setDropdownVisible}
      >
        <Button icon={<IconMoreVertical />} shape="circle" />
      </Dropdown>
    ),
  }

  useEffect(() => {
    setIsFetchedOriginal(false)
  }, [activeContent])

  return (
    <div className={`action-buttons ${isBelowMedium ? "mobile" : ""}`}>
      {isBelowMedium ? (
        <MobileButtons commonButtons={commonButtons} />
      ) : (
        <DesktopButtons
          commonButtons={commonButtons}
          handleSaveToThirdPartyServices={handleSaveToThirdPartyServices}
          hasIntegrations={hasIntegrations}
          navigateToNextArticle={navigateToNextArticle}
          navigateToPreviousArticle={navigateToPreviousArticle}
          nextContent={nextContent}
          polyglot={polyglot}
          prevContent={prevContent}
        />
      )}
    </div>
  )
}

export default ActionButtons

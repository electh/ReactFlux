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
  IconMessage,
  IconMinusCircle,
  IconMoreVertical,
  IconRecord,
  IconSave,
  IconShareExternal,
  IconStar,
  IconStarFill,
  IconUnorderedList,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { memo, useRef, useState } from "react"

import ArticleTOC, { ArticleTOCPanel } from "./ArticleTOC"

import CustomTooltip from "@/components/ui/CustomTooltip"
import useEntryActions from "@/hooks/useEntryActions"
import useKeyHandlers from "@/hooks/useKeyHandlers"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import {
  articleHeadingsState,
  contentState,
  nextContentState,
  prevContentState,
} from "@/store/contentState"
import { dataState } from "@/store/dataState"
import { MIN_ARTICLE_FONT_SIZE, settingsState, updateSettings } from "@/store/settingsState"
import "./ActionButtons.css"

const DesktopButtons = memo(
  ({ commonButtons, hasIntegrations, handleSaveToThirdPartyServices, polyglot }) => (
    <>
      <div className="left-side">
        {commonButtons.close}
        {commonButtons.prev}
        {commonButtons.next}
      </div>
      <div className="right-side">
        {commonButtons.status}
        {commonButtons.star}
        {commonButtons.fetch}
        {commonButtons.toc}
        {hasIntegrations && (
          <CustomTooltip
            mini
            content={polyglot.t("article_card.save_to_third_party_services_tooltip")}
          >
            <Button
              aria-label={polyglot.t("article_card.save_to_third_party_services_tooltip")}
              icon={<IconSave aria-hidden="true" />}
              shape="circle"
              onClick={handleSaveToThirdPartyServices}
            />
          </CustomTooltip>
        )}
        {commonButtons.more}
      </div>
    </>
  ),
)
DesktopButtons.displayName = "DesktopButtons"

const MobileButtons = memo(({ commonButtons, hasHeadings, moveContextActionToMenu }) => (
  <div className="mobile-buttons">
    {commonButtons.status}
    {commonButtons.star}
    {commonButtons.prev}
    {commonButtons.close}
    {commonButtons.next}
    {!moveContextActionToMenu && !hasHeadings && commonButtons.fetch}
    {!moveContextActionToMenu && commonButtons.toc}
    {commonButtons.more}
  </div>
))
MobileButtons.displayName = "MobileButtons"

const ActionButtons = () => {
  const { activeContent } = useStore(contentState, { keys: ["activeContent"] })
  const { hasIntegrations } = useStore(dataState, { keys: ["hasIntegrations"] })
  const { polyglot } = useStore(polyglotState)
  const headings = useStore(articleHeadingsState)

  const {
    articleWidth,
    edgeToEdgeImages,
    enableSwipeGesture,
    fontSize,
    fontFamily,
    titleAlignment,
  } = useStore(settingsState, {
    keys: [
      "articleWidth",
      "edgeToEdgeImages",
      "enableSwipeGesture",
      "fontSize",
      "fontFamily",
      "titleAlignment",
    ],
  })

  const nextContent = useStore(nextContentState)
  const prevContent = useStore(prevContentState)

  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [isCompactTocVisible, setIsCompactTocVisible] = useState(false)
  const [isFetchedOriginal, setIsFetchedOriginal] = useState(false)
  const [lastActiveContentId, setLastActiveContentId] = useState(activeContent?.id)
  const compactTocMenuItemRef = useRef(null)
  const moreButtonRef = useRef(null)

  if (activeContent?.id !== lastActiveContentId) {
    setLastActiveContentId(activeContent?.id)
    setIsFetchedOriginal(false)
  }

  const hasHeadings = headings.length > 0

  const {
    handleFetchContent,
    handleSaveToThirdPartyServices,
    handleToggleStarred,
    handleToggleStatus,
    handleOpenLinkExternally,
  } = useEntryActions()

  const { exitDetailView, navigateToNextArticle, navigateToPreviousArticle } = useKeyHandlers()

  const { isBelowCompact, isBelowMedium } = useScreenWidth()

  const isUnread = activeContent.status === "unread"
  const isStarred = activeContent.starred
  const moveContextActionToMenu = isBelowCompact && !enableSwipeGesture
  const showFetchInMenu = isBelowMedium && (hasHeadings || moveContextActionToMenu)
  const showTocInMenu = moveContextActionToMenu && hasHeadings
  const actionLabels = {
    close: polyglot.t("article_card.close_tooltip"),
    fetch: polyglot.t("article_card.fetch_original_tooltip"),
    more: polyglot.t("article_card.more_actions_tooltip"),
    next: polyglot.t("article_card.next_tooltip"),
    previous: polyglot.t("article_card.previous_tooltip"),
    star: isStarred
      ? polyglot.t("article_card.unstar_tooltip")
      : polyglot.t("article_card.star_tooltip"),
    status: isUnread
      ? polyglot.t("article_card.mark_as_read_tooltip")
      : polyglot.t("article_card.mark_as_unread_tooltip"),
  }

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
      value: "'Noto Sans', 'Noto Sans SC', sans-serif",
    },
    {
      label: polyglot.t("appearance.font_family_noto_serif"),
      value: "'Noto Serif', 'Noto Serif SC', serif",
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

  const handleViewComments = () => window.open(activeContent.comments_url, "_blank")

  const handleDropdownVisibleChange = (visible) => {
    setDropdownVisible(visible)
    if (!visible) {
      setIsCompactTocVisible(false)
    }
  }

  const handleMoreMenuItemClick = (key) => {
    const shouldOpenToc = key === "table-of-contents" && showTocInMenu
    if (shouldOpenToc) {
      setIsCompactTocVisible(true)
    }
    return !shouldOpenToc
  }

  const handleCompactTocBack = () => {
    setIsCompactTocVisible(false)
    requestAnimationFrame(() => compactTocMenuItemRef.current?.focus({ preventScroll: true }))
  }

  const handleCompactTocClose = () => {
    handleDropdownVisibleChange(false)
    requestAnimationFrame(() => moreButtonRef.current?.focus({ preventScroll: true }))
  }

  const commonButtons = {
    prev:
      isBelowMedium && enableSwipeGesture ? undefined : (
        <CustomTooltip mini content={actionLabels.previous}>
          <Button
            aria-label={actionLabels.previous}
            disabled={!prevContent}
            icon={<IconArrowLeft aria-hidden="true" />}
            shape="circle"
            onClick={navigateToPreviousArticle}
          />
        </CustomTooltip>
      ),
    next:
      isBelowMedium && enableSwipeGesture ? undefined : (
        <CustomTooltip mini content={actionLabels.next}>
          <Button
            aria-label={actionLabels.next}
            disabled={!nextContent}
            icon={<IconArrowRight aria-hidden="true" />}
            shape="circle"
            onClick={navigateToNextArticle}
          />
        </CustomTooltip>
      ),
    status: (
      <CustomTooltip mini content={actionLabels.status}>
        <Button
          aria-label={actionLabels.status}
          shape="circle"
          icon={
            isUnread ? <IconMinusCircle aria-hidden="true" /> : <IconRecord aria-hidden="true" />
          }
          onClick={() => handleToggleStatus(activeContent)}
        />
      </CustomTooltip>
    ),
    star: (
      <CustomTooltip mini content={actionLabels.star}>
        <Button
          aria-label={actionLabels.star}
          shape="circle"
          icon={
            isStarred ? (
              <IconStarFill aria-hidden="true" style={{ color: "#ffcd00" }} />
            ) : (
              <IconStar aria-hidden="true" />
            )
          }
          onClick={() => handleToggleStarred(activeContent)}
        />
      </CustomTooltip>
    ),
    close: (
      <CustomTooltip mini content={actionLabels.close}>
        <Button
          aria-label={actionLabels.close}
          icon={<IconClose aria-hidden="true" />}
          shape="circle"
          onClick={() => exitDetailView()}
        />
      </CustomTooltip>
    ),
    fetch: (
      <CustomTooltip mini content={actionLabels.fetch}>
        <Button
          aria-label={actionLabels.fetch}
          disabled={isFetchedOriginal}
          icon={<IconCloudDownload aria-hidden="true" />}
          shape="circle"
          onClick={async () => {
            await handleFetchContent()
            setIsFetchedOriginal(true)
          }}
        />
      </CustomTooltip>
    ),
    toc: hasHeadings ? <ArticleTOC /> : null,
    more: (
      <Dropdown
        popupVisible={dropdownVisible}
        position="br"
        trigger="click"
        triggerProps={{ className: "settings-dropdown" }}
        droplist={
          isCompactTocVisible && showTocInMenu ? (
            <ArticleTOCPanel onBack={handleCompactTocBack} onClose={handleCompactTocClose} />
          ) : (
            <Menu className="mobile-action-menu" onClickMenuItem={handleMoreMenuItemClick}>
              {hasIntegrations && isBelowMedium && (
                <Menu.Item
                  key="save_to_third_party_services"
                  onClick={() => handleSaveToThirdPartyServices(activeContent)}
                >
                  <span>{polyglot.t("article_card.save_to_third_party_services_tooltip")}</span>
                </Menu.Item>
              )}

              {showFetchInMenu && (
                <Menu.Item
                  key="fetch_original"
                  disabled={isFetchedOriginal}
                  onClick={async () => {
                    await handleFetchContent()
                    setIsFetchedOriginal(true)
                  }}
                >
                  <div className="settings-menu-item">
                    <span>{actionLabels.fetch}</span>
                    <IconCloudDownload aria-hidden="true" />
                  </div>
                </Menu.Item>
              )}

              {showTocInMenu && (
                <Menu.Item key="table-of-contents" ref={compactTocMenuItemRef}>
                  <div className="settings-menu-item">
                    <span>{polyglot.t("article_toc.tooltip") || "Table of Contents"}</span>
                    <IconUnorderedList aria-hidden="true" />
                  </div>
                </Menu.Item>
              )}

              {navigator.share && (
                <Menu.Item key="share" onClick={handleShare}>
                  <div className="settings-menu-item">
                    <span>{polyglot.t("article_card.share_tooltip")}</span>
                    <IconShareExternal aria-hidden="true" />
                  </div>
                </Menu.Item>
              )}

              {activeContent.comments_url !== "" && (
                <Menu.Item key="view-comments" onClick={handleViewComments}>
                  <div className="settings-menu-item">
                    <span>{polyglot.t("article_card.view_comments_tooltip")}</span>
                    <IconMessage aria-hidden="true" />
                  </div>
                </Menu.Item>
              )}

              <Menu.Item
                key="open-in-browser"
                onClick={() => handleOpenLinkExternally(activeContent)}
              >
                <div className="settings-menu-item">
                  <span>{polyglot.t("article_card.open_link_externally_tooltip")}</span>
                  <IconLaunch aria-hidden="true" />
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
                    <span>
                      {fontFamilyOptions.find((option) => option.value === fontFamily)?.label}
                    </span>
                  </div>
                }
              >
                {fontFamilyOptions.map(({ label, value }) => (
                  <Menu.Item key={value} onClick={() => updateSettings({ fontFamily: value })}>
                    <div className="settings-menu-item">
                      {label}
                      {value === fontFamily && <IconCheck aria-hidden="true" />}
                    </div>
                  </Menu.Item>
                ))}
              </Menu.SubMenu>

              <Menu.Item key="font-size">
                <div className="settings-menu-item" onClick={(e) => e.stopPropagation()}>
                  <span>{polyglot.t("appearance.font_size_label")}</span>
                  <InputNumber
                    max={1.5}
                    min={MIN_ARTICLE_FONT_SIZE}
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
          )
        }
        onVisibleChange={handleDropdownVisibleChange}
      >
        <Button
          ref={moreButtonRef}
          aria-label={actionLabels.more}
          icon={<IconMoreVertical aria-hidden="true" />}
          shape="circle"
        />
      </Dropdown>
    ),
  }

  return (
    <div className={`action-buttons ${isBelowMedium ? "mobile" : ""}`}>
      {isBelowMedium ? (
        <MobileButtons
          commonButtons={commonButtons}
          hasHeadings={hasHeadings}
          moveContextActionToMenu={moveContextActionToMenu}
        />
      ) : (
        <DesktopButtons
          commonButtons={commonButtons}
          handleSaveToThirdPartyServices={() => handleSaveToThirdPartyServices(activeContent)}
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

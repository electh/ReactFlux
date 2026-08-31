import { Button, Input, Message, Spin, Typography } from "@arco-design/web-react"
import {
  IconCalendar,
  IconCheck,
  IconEyeInvisible,
  IconFolder,
  IconHistory,
  IconRight,
  IconStar,
  IconUnorderedList,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useMemo, useRef, useState } from "react"

import AccessibleModal from "@/components/ui/AccessibleModal"
import FeedIcon from "@/components/ui/FeedIcon"
import useAppData from "@/hooks/useAppData"
import useHomePage, { describeHomeTarget } from "@/hooks/useHomePage"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { dataState } from "@/store/dataState"
import { settingsState } from "@/store/settingsState"
import includesIgnoreCase from "@/utils/filter"
import {
  createEntityHomeTarget,
  createViewHomeTarget,
  HOME_PAGE_VIEWS,
  isSameHomeTarget,
} from "@/utils/home-page"

import "./HomePagePicker.css"

const VIEW_ICONS = {
  all: IconUnorderedList,
  today: IconCalendar,
  starred: IconStar,
  history: IconHistory,
}

const RssIcon = ({ className }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    focusable="false"
    stroke="currentColor"
    strokeLinecap="round"
    strokeWidth="4"
    viewBox="0 0 48 48"
  >
    <circle cx="9" cy="39" fill="currentColor" r="3" stroke="none" />
    <path d="M9 22c9.389 0 17 7.611 17 17" />
    <path d="M9 9c16.569 0 30 13.431 30 30" />
  </svg>
)

const FeedTargetIcon = ({ feed, showFeedIcon }) => {
  const fallbackIcon = <RssIcon className="home-page-target-icon" />

  if (!showFeedIcon) {
    return fallbackIcon
  }

  return (
    <FeedIcon
      className="home-page-target-icon home-page-target-feed-icon"
      fallbackIcon={fallbackIcon}
      feed={feed}
    />
  )
}

const TargetButton = ({
  current,
  detail,
  feed,
  hiddenLabel,
  icon: Icon,
  label,
  showFeedIcon,
  target,
  onSelect,
}) => (
  <button
    aria-pressed={current}
    className={`home-page-target${current ? " home-page-target-current" : ""}`}
    data-home-target={`${target.type}:${target.id}`}
    type="button"
    onClick={() => onSelect(target)}
  >
    {feed ? (
      <FeedTargetIcon feed={feed} showFeedIcon={showFeedIcon} />
    ) : (
      <Icon aria-hidden="true" className="home-page-target-icon" />
    )}
    <span className="home-page-target-copy">
      <span className="home-page-target-label">{label}</span>
      {detail && <span className="home-page-target-detail">{detail}</span>}
    </span>
    {hiddenLabel && (
      <span className="home-page-hidden-tag">
        <IconEyeInvisible aria-hidden="true" />
        <span>{hiddenLabel}</span>
      </span>
    )}
    {current && <IconCheck aria-hidden="true" className="home-page-target-check" />}
  </button>
)

const HomePagePicker = ({ visible, onClose }) => {
  const { categories, feeds, setTarget, target } = useHomePage()
  const { catalog: catalogLoadState } = useStore(dataState, { keys: ["loadState"] }).loadState
  const { polyglot } = useStore(polyglotState)
  const { showFeedIcon } = useStore(settingsState, { keys: ["showFeedIcon"] })
  const { isBelowMedium } = useScreenWidth()
  const { refreshFeedData } = useAppData()

  const searchInputRef = useRef(null)
  const [expandedCategoryIds, setExpandedCategoryIds] = useState(null)
  const [searchValue, setSearchValue] = useState("")

  const defaultExpandedCategoryIds = useMemo(() => {
    if (target.type !== "feed") {
      return new Set()
    }

    const currentFeed = feeds.find((feed) => feed.id === target.id)
    return new Set(currentFeed ? [currentFeed.category.id] : [])
  }, [feeds, target.id, target.type])
  const activeExpandedCategoryIds = expandedCategoryIds ?? defaultExpandedCategoryIds

  const feedsByCategory = useMemo(() => {
    const groupedFeeds = new Map()
    for (const feed of feeds) {
      const categoryId = feed.category.id
      const categoryFeeds = groupedFeeds.get(categoryId) ?? []
      categoryFeeds.push(feed)
      groupedFeeds.set(categoryId, categoryFeeds)
    }
    return groupedFeeds
  }, [feeds])

  const getViewLabel = (view) => polyglot.t(`settings.default_home_page_option_${view}`)
  const hiddenLabel = polyglot.t("home_page.hidden")

  const selectTarget = (nextTarget) => {
    if (isSameHomeTarget(target, nextTarget)) {
      return
    }

    if (setTarget(nextTarget)) {
      const { name } = describeHomeTarget({ categories, feeds, polyglot, target: nextTarget })
      Message.success(polyglot.t("home_page.set_success", { name }))
      onClose()
    }
  }

  const toggleCategory = (categoryId) => {
    setExpandedCategoryIds((current) => {
      const next = new Set(current ?? defaultExpandedCategoryIds)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const searchText = searchValue.trim()
  const searchResults = useMemo(() => {
    if (!searchText) {
      return []
    }

    const results = []
    for (const view of HOME_PAGE_VIEWS) {
      const label = polyglot.t(`settings.default_home_page_option_${view}`)
      if (includesIgnoreCase(label, searchText)) {
        results.push({
          icon: VIEW_ICONS[view],
          label,
          target: createViewHomeTarget(view),
          typeLabel: polyglot.t("home_page.type_view"),
        })
      }
    }

    for (const category of categories) {
      if (includesIgnoreCase(category.title, searchText)) {
        results.push({
          hidden: category.hide_globally,
          icon: IconFolder,
          label: category.title,
          target: createEntityHomeTarget("category", category.id),
          typeLabel: polyglot.t("home_page.type_category"),
        })
      }
    }

    for (const feed of feeds) {
      const searchLabel = `${feed.category.title} / ${feed.title}`
      if (includesIgnoreCase(searchLabel, searchText)) {
        results.push({
          categoryLabel: feed.category.title,
          feed,
          hidden: feed.hide_globally || feed.category.hide_globally,
          label: feed.title,
          target: createEntityHomeTarget("feed", feed.id),
          typeLabel: polyglot.t("home_page.type_feed"),
        })
      }
    }

    return results
  }, [categories, feeds, polyglot, searchText])

  const handleAfterOpen = () => {
    setSearchValue("")
    setExpandedCategoryIds(null)

    globalThis.setTimeout(() => {
      if (isBelowMedium) {
        document.querySelector(".home-page-picker-modal .accessible-modal-close-button")?.focus()
      } else {
        searchInputRef.current?.focus()
      }
      document
        .querySelector(
          `.home-page-picker-modal [data-home-target="${CSS.escape(target.type)}:${CSS.escape(
            String(target.id),
          )}"]`,
        )
        ?.scrollIntoView({ block: "nearest" })
    })
  }

  const renderSearchResults = () => (
    <section aria-labelledby="home-page-search-results-title">
      <Typography.Title
        className="home-page-picker-section-title"
        heading={6}
        id="home-page-search-results-title"
      >
        {polyglot.t("home_page.search_results")}
      </Typography.Title>
      {searchResults.length === 0 ? (
        <div className="home-page-picker-empty" role="status">
          {polyglot.t("home_page.no_results")}
        </div>
      ) : (
        <div className="home-page-target-list">
          {searchResults.map((result) => (
            <TargetButton
              key={`${result.target.type}:${result.target.id}`}
              current={isSameHomeTarget(target, result.target)}
              feed={result.feed}
              hiddenLabel={result.hidden ? hiddenLabel : null}
              icon={result.icon}
              label={result.label}
              showFeedIcon={showFeedIcon}
              target={result.target}
              detail={
                result.categoryLabel
                  ? `${result.typeLabel} · ${result.categoryLabel}`
                  : result.typeLabel
              }
              onSelect={selectTarget}
            />
          ))}
        </div>
      )}
    </section>
  )

  const renderBrowseView = () => (
    <>
      <section aria-labelledby="home-page-views-title">
        <Typography.Title
          className="home-page-picker-section-title"
          heading={6}
          id="home-page-views-title"
        >
          {polyglot.t("home_page.views_section")}
        </Typography.Title>
        <div className="home-page-target-list">
          {HOME_PAGE_VIEWS.map((view) => {
            const viewTarget = createViewHomeTarget(view)
            return (
              <TargetButton
                key={view}
                current={isSameHomeTarget(target, viewTarget)}
                icon={VIEW_ICONS[view]}
                label={getViewLabel(view)}
                target={viewTarget}
                onSelect={selectTarget}
              />
            )
          })}
        </div>
      </section>

      <section aria-labelledby="home-page-categories-title">
        <Typography.Title
          className="home-page-picker-section-title"
          heading={6}
          id="home-page-categories-title"
        >
          {polyglot.t("home_page.categories_section")}
        </Typography.Title>

        {!catalogLoadState.hasSnapshot && !catalogLoadState.error && (
          <div aria-busy="true" className="home-page-picker-loading" role="status">
            <Spin aria-hidden="true" />
            <span>{polyglot.t("home_page.catalog_loading")}</span>
          </div>
        )}

        {!catalogLoadState.hasSnapshot && catalogLoadState.error && (
          <div className="home-page-picker-error" role="alert">
            <span>{polyglot.t("home_page.catalog_error_description")}</span>
            <Button onClick={() => refreshFeedData({ force: true }).catch(() => null)}>
              {polyglot.t("actions.retry")}
            </Button>
          </div>
        )}

        {catalogLoadState.hasSnapshot && categories.length === 0 && (
          <div className="home-page-picker-empty" role="status">
            {polyglot.t("home_page.no_categories")}
          </div>
        )}

        {catalogLoadState.hasSnapshot && categories.length > 0 && (
          <div
            aria-busy={catalogLoadState.activity === "refreshing"}
            className="home-page-category-list"
          >
            {categories.map((category) => {
              const categoryFeeds = feedsByCategory.get(category.id) ?? []
              const expanded = activeExpandedCategoryIds.has(category.id)
              const categoryTarget = createEntityHomeTarget("category", category.id)
              const feedGroupId = `home-page-category-${category.id}-feeds`

              return (
                <div key={category.id} className="home-page-category-group">
                  <div className="home-page-category-row">
                    <TargetButton
                      current={isSameHomeTarget(target, categoryTarget)}
                      hiddenLabel={category.hide_globally ? hiddenLabel : null}
                      icon={IconFolder}
                      label={category.title}
                      target={categoryTarget}
                      onSelect={selectTarget}
                    />
                    <button
                      aria-controls={feedGroupId}
                      aria-expanded={expanded}
                      className="home-page-category-toggle"
                      disabled={categoryFeeds.length === 0}
                      type="button"
                      aria-label={polyglot.t(
                        expanded ? "home_page.collapse_category" : "home_page.expand_category",
                        { name: category.title },
                      )}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <IconRight aria-hidden="true" className={expanded ? "expanded" : ""} />
                    </button>
                  </div>
                  {expanded && categoryFeeds.length > 0 && (
                    <div className="home-page-feed-list" id={feedGroupId}>
                      {categoryFeeds.map((feed) => {
                        const feedTarget = createEntityHomeTarget("feed", feed.id)
                        return (
                          <TargetButton
                            key={feed.id}
                            current={isSameHomeTarget(target, feedTarget)}
                            feed={feed}
                            label={feed.title}
                            showFeedIcon={showFeedIcon}
                            target={feedTarget}
                            hiddenLabel={
                              feed.hide_globally || category.hide_globally ? hiddenLabel : null
                            }
                            onSelect={selectTarget}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )

  const title = polyglot.t("home_page.picker_title")

  return (
    <AccessibleModal
      unmountOnExit
      afterOpen={handleAfterOpen}
      alignCenter={!isBelowMedium}
      className="home-page-picker-modal"
      closeLabel={polyglot.t("actions.close_dialog", { name: title })}
      dialogLabel={title}
      footer={null}
      title={title}
      visible={visible}
      wrapClassName="home-page-picker-modal-wrapper"
      onCancel={onClose}
    >
      <Input.Search
        ref={searchInputRef}
        allowClear
        aria-label={polyglot.t("home_page.search_label")}
        placeholder={polyglot.t("home_page.search_placeholder")}
        value={searchValue}
        onChange={setSearchValue}
      />
      <div className="home-page-picker-content">
        {searchText ? renderSearchResults() : renderBrowseView()}
      </div>
    </AccessibleModal>
  )
}

export default HomePagePicker

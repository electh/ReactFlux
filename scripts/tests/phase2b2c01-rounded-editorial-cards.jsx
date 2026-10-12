/* eslint-disable react-refresh/only-export-components */
import Polyglot from "node-polyglot"
import React, { useEffect, useMemo, useState } from "react"
import ReactDOM from "react-dom/client"

import ArticleGridCard from "@/components/Article/ArticleGridCard"
import { polyglotState } from "@/hooks/useLanguage"
import englishPhrases from "@/locales/en-US.json"
import { feedIconsState } from "@/store/feedIconsState"

import "@/index.css"
import "@/theme.css"
import "@/components/Article/ArticleEntry.css"
import "@/components/Article/ArticleGridCard.css"
import "@/components/Article/LoadingCards.css"
import "./phase2b2c01-rounded-editorial-cards.css"

const SAMPLE_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%234a667d'/%3E%3C/svg%3E"

const colorIsOpaque = (value) => {
  const channels = value.match(/[\d.]+/g)?.map(Number) ?? []
  return channels.length < 4 || channels[3] >= 1
}

const approximatelyEqual = (left, right) => Math.abs(left - right) < 0.6

feedIconsState.setKey(1, { height: 9, url: SAMPLE_IMAGE, width: 16 })
polyglotState.set({ polyglot: new Polyglot({ locale: "en-US", phrases: englishPhrases }) })

const FixtureCard = ({
  deck = false,
  id,
  read = false,
  selected = false,
  starred = false,
  noCover = false,
  title = "A headline with enough words to show how the editorial card reads",
}) => {
  const entry = useMemo(
    () => ({
      cardDeckCandidates: deck
        ? [
            {
              source: "fixture",
              text: "A short editorial deck adds useful context to the story.",
            },
          ]
        : [],
      content: "",
      coverCandidates: noCover ? [] : [{ height: 9, src: SAMPLE_IMAGE, width: 16 }],
      feed: {
        feed_url: "https://newsflux.home/feed.xml",
        icon: { icon_id: 1 },
        site_url: "https://newsflux.home",
        title: "NewsFlux editorial desk",
      },
      id,
      published_at: "2026-10-10T12:00:00.000Z",
      reading_time: 4,
      starred,
      status: read ? "read" : "unread",
      title,
    }),
    [deck, id, noCover, read, starred, title],
  )

  return (
    <a
      aria-label={`Sample article ${id}`}
      className={`article-entry grid-card-wrapper ${read ? "read" : "unread"}${selected ? " selected" : ""}`}
      data-entry-id={id}
      data-has-deck={deck}
      href={`#${id}`}
      onClick={(event) => event.preventDefault()}
    >
      <ArticleGridCard entry={entry} />
    </a>
  )
}

const tokenColor = (value) => {
  const probe = document.createElement("span")
  probe.style.color = value
  document.body.append(probe)
  const { color } = getComputedStyle(probe)
  probe.remove()
  return color
}

const runStructuralGate = () => {
  const cards = [...document.querySelectorAll(".grid-card-wrapper")]
  const results = []

  const check = (name, passed, details) => {
    results.push({ details, name, status: passed ? "PASS" : "FAIL" })
  }

  check("CARD_FIXTURES_RENDERED", cards.length >= 4, `count=${cards.length}`)
  check(
    "NO_HORIZONTAL_OVERFLOW",
    document.documentElement.scrollWidth <= window.innerWidth,
    `scrollWidth=${document.documentElement.scrollWidth}; viewport=${window.innerWidth}`,
  )

  for (const [index, card] of cards.entries()) {
    const style = getComputedStyle(card)
    const borderWidth = Number.parseFloat(style.borderTopWidth)
    const radius = Number.parseFloat(style.borderTopLeftRadius)
    const expectedRadius = Number.parseFloat(
      getComputedStyle(document.body).getPropertyValue("--nf-radius-card"),
    )
    const expectedSurface = tokenColor(
      getComputedStyle(document.body).getPropertyValue("--nf-surface-content").trim(),
    )
    const actualSurface = style.backgroundColor
    const cardRect = card.getBoundingClientRect()
    const copy = card.querySelector(".grid-card-copy")
    const copyRect = copy?.getBoundingClientRect()
    const copyStyle = copy ? getComputedStyle(copy) : null
    const media = card.querySelector(".grid-card-media")
    const mediaStyle = media ? getComputedStyle(media) : null
    const mediaRect = media?.getBoundingClientRect()
    const boxShadowIsExpected = card.classList.contains("selected")
      ? /^rgb\([^)]*\) 2px 0px 0px 0px inset$/.test(style.boxShadow)
      : style.boxShadow === "none"
    const actualTopMediaRadius = mediaStyle
      ? Number.parseFloat(mediaStyle.borderTopLeftRadius)
      : null
    const actualBottomMediaRadius = mediaStyle
      ? Number.parseFloat(mediaStyle.borderBottomLeftRadius)
      : null

    check(
      `CARD_${index + 1}_OPAQUE_SURFACE`,
      colorIsOpaque(actualSurface) && actualSurface === expectedSurface,
      `surface=${actualSurface}; expected=${expectedSurface}`,
    )
    check(
      `CARD_${index + 1}_TOKEN_RADIUS`,
      approximatelyEqual(radius, expectedRadius),
      `radius=${radius}px; token=${expectedRadius}px`,
    )
    check(
      `CARD_${index + 1}_SUBTLE_BORDER`,
      style.borderTopStyle === "solid" &&
        approximatelyEqual(borderWidth, 1) &&
        style.borderTopColor ===
          tokenColor(
            getComputedStyle(document.body).getPropertyValue("--nf-separator-subtle").trim(),
          ),
      `border=${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`,
    )
    check(
      `CARD_${index + 1}_NO_CONTENT_CLIPPING`,
      Boolean(
        copyRect &&
        copyRect.left >= cardRect.left + borderWidth &&
        copyRect.right <= cardRect.right - borderWidth,
      ),
      `copy=[${copyRect?.left}, ${copyRect?.right}]; card=[${cardRect.left}, ${cardRect.right}]`,
    )
    check(
      `CARD_${index + 1}_NO_HORIZONTAL_OVERFLOW`,
      cardRect.left >= 0 && cardRect.right <= window.innerWidth,
      `card=[${cardRect.left}, ${cardRect.right}]; viewport=${window.innerWidth}`,
    )
    check(`CARD_${index + 1}_NO_NEW_SHADOW`, boxShadowIsExpected, `shadow=${style.boxShadow}`)
    if (copyStyle) {
      const isCompactViewport = globalThis.matchMedia("(max-width: 768px)").matches
      const expectedGap = isCompactViewport ? "9px" : "10px"
      const expectedTopPadding = media
        ? isCompactViewport
          ? "10px"
          : "12px"
        : isCompactViewport
          ? "8px"
          : "10px"
      const expectedBottomPadding = isCompactViewport ? "10px" : "12px"
      check(
        `CARD_${index + 1}_INTERNAL_SPACING_PRESERVED`,
        copyStyle.gap === expectedGap &&
          copyStyle.paddingTop === expectedTopPadding &&
          copyStyle.paddingBottom === expectedBottomPadding,
        `gap=${copyStyle.gap}; padding=${copyStyle.paddingTop} ${copyStyle.paddingBottom}`,
      )
    }
    if (mediaRect) {
      check(
        `CARD_${index + 1}_IMAGE_RATIO_16_9`,
        approximatelyEqual(mediaRect.width / mediaRect.height, 16 / 9),
        `ratio=${(mediaRect.width / mediaRect.height).toFixed(3)}`,
      )
    }

    if (mediaStyle) {
      check(
        `CARD_${index + 1}_MEDIA_INTEGRATED`,
        approximatelyEqual(actualTopMediaRadius, 0) &&
          approximatelyEqual(actualBottomMediaRadius, 0),
        `top=${actualTopMediaRadius}px; bottom=${actualBottomMediaRadius}px; card clipping=${style.overflow}`,
      )
    }
  }

  const expectedRadius = Number.parseFloat(
    getComputedStyle(document.body).getPropertyValue("--nf-radius-card"),
  )
  const expectedSurface = tokenColor(
    getComputedStyle(document.body).getPropertyValue("--nf-surface-content").trim(),
  )
  const expectedBorder = tokenColor(
    getComputedStyle(document.body).getPropertyValue("--nf-separator-subtle").trim(),
  )
  const mediaCards = cards.filter((card) => card.querySelector(".grid-card-media"))
  check(
    "GRID_CARD_ROOT_RADIUS",
    cards.every((card) =>
      approximatelyEqual(
        Number.parseFloat(getComputedStyle(card).borderTopLeftRadius),
        expectedRadius,
      ),
    ),
    `expected=${expectedRadius}px; actual=${cards.map((card) => getComputedStyle(card).borderTopLeftRadius).join(",")}`,
  )
  check(
    "GRID_CARD_OPAQUE_SURFACE",
    cards.every((card) => {
      const background = getComputedStyle(card).backgroundColor
      return colorIsOpaque(background) && background === expectedSurface
    }),
    `expected=${expectedSurface}; actual=${cards.map((card) => getComputedStyle(card).backgroundColor).join(" | ")}`,
  )
  check(
    "GRID_CARD_SUBTLE_BORDER",
    cards.every((card) => {
      const style = getComputedStyle(card)
      return (
        style.borderTopStyle === "solid" &&
        approximatelyEqual(Number.parseFloat(style.borderTopWidth), 1) &&
        style.borderTopColor === expectedBorder
      )
    }),
    `expected=1px solid ${expectedBorder}; actual=${cards.map((card) => `${getComputedStyle(card).borderTopWidth} ${getComputedStyle(card).borderTopStyle} ${getComputedStyle(card).borderTopColor}`).join(" | ")}`,
  )
  check(
    "GRID_ROOT_CLIPS_MEDIA",
    cards.every((card) => getComputedStyle(card).overflow === "hidden"),
    `overflow=${cards.map((card) => getComputedStyle(card).overflow).join(",")}`,
  )
  check(
    "GRID_MEDIA_INTEGRATION",
    mediaCards.every((card) => {
      const cardStyle = getComputedStyle(card)
      const mediaStyle = getComputedStyle(card.querySelector(".grid-card-media"))
      return (
        cardStyle.overflow === "hidden" &&
        approximatelyEqual(Number.parseFloat(mediaStyle.borderTopLeftRadius), 0) &&
        approximatelyEqual(Number.parseFloat(mediaStyle.borderBottomLeftRadius), 0)
      )
    }),
    `media cards=${mediaCards.length}; root clips with no independent media radius`,
  )

  const textOnlyCard = document
    .querySelector(".grid-card-content-no-cover")
    ?.closest(".grid-card-wrapper")
  if (cards[0] && textOnlyCard) {
    const imageCardStyle = getComputedStyle(cards[0])
    const textOnlyStyle = getComputedStyle(textOnlyCard)
    check(
      "TEXT_ONLY_SHARED_GEOMETRY_ONLY",
      imageCardStyle.borderRadius === textOnlyStyle.borderRadius &&
        imageCardStyle.borderWidth === textOnlyStyle.borderWidth &&
        imageCardStyle.borderColor === textOnlyStyle.borderColor &&
        imageCardStyle.backgroundColor === textOnlyStyle.backgroundColor &&
        imageCardStyle.boxShadow === textOnlyStyle.boxShadow,
      `image=${imageCardStyle.borderRadius}/${imageCardStyle.borderWidth}/${imageCardStyle.backgroundColor}; text-only=${textOnlyStyle.borderRadius}/${textOnlyStyle.borderWidth}/${textOnlyStyle.backgroundColor}`,
    )
  }

  const textOnlyCards = cards.filter((card) => card.querySelector(".grid-card-content-no-cover"))
  const compactViewport = globalThis.matchMedia("(max-width: 768px)").matches
  const expectedTextOnlyTopPadding = compactViewport ? "8px" : "10px"
  const expectedTextOnlyBottomPadding = compactViewport ? "10px" : "12px"
  const textOnlyCopyStyles = textOnlyCards.map((card) =>
    getComputedStyle(card.querySelector(".grid-card-copy")),
  )
  const textOnlyCopyNodes = textOnlyCards.map((card) => card.querySelector(".grid-card-copy"))
  const textOnlyTitles = textOnlyCards.map((card) => card.querySelector(".grid-card-title"))

  check(
    "TEXT_ONLY_FIXTURES_COVER_STATES_AND_DECKS",
    textOnlyCards.length >= 5 &&
      textOnlyCards.some((card) => card.classList.contains("read")) &&
      textOnlyCards.some((card) => card.classList.contains("unread")) &&
      textOnlyCards.some((card) => card.classList.contains("selected")) &&
      textOnlyCards.some((card) => card.querySelector(".grid-card-star")?.style.opacity === "1") &&
      textOnlyCards.some((card) => card.dataset.hasDeck === "true") &&
      textOnlyCards.some((card) => card.dataset.hasDeck === "false"),
    `count=${textOnlyCards.length}; states=${textOnlyCards.map((card) => card.dataset.entryId).join(",")}`,
  )
  check(
    "TEXT_ONLY_EMPTY_DECK_SUPPRESSED",
    textOnlyCards
      .filter((card) => card.dataset.hasDeck === "false")
      .every(
        (card) => !card.querySelector(".grid-card-summary:not(.grid-card-summary-measure-probe)"),
      ),
    "text-only cards without a deck render no summary",
  )
  check(
    "TEXT_ONLY_16PX_INLINE_INSET",
    textOnlyCopyStyles.length > 0 &&
      textOnlyCopyStyles.every(
        (style) => style.paddingInlineStart === "16px" && style.paddingInlineEnd === "16px",
      ),
    `insets=${textOnlyCopyStyles.map((style) => `${style.paddingInlineStart}/${style.paddingInlineEnd}`).join(",")}`,
  )
  check(
    "TEXT_ONLY_BLOCK_PADDING_UNCHANGED",
    textOnlyCopyStyles.length > 0 &&
      textOnlyCopyStyles.every(
        (style) =>
          style.paddingTop === expectedTextOnlyTopPadding &&
          style.paddingBottom === expectedTextOnlyBottomPadding,
      ),
    `expected=${expectedTextOnlyTopPadding}/${expectedTextOnlyBottomPadding}; actual=${textOnlyCopyStyles.map((style) => `${style.paddingTop}/${style.paddingBottom}`).join(",")}`,
  )
  check(
    "TEXT_ONLY_NO_MEDIA",
    textOnlyCards.length > 0 &&
      textOnlyCards.every(
        (card) =>
          !card.querySelector(".grid-card-media, .grid-card-cover, .grid-card-loading-media"),
      ),
    `text-only cards contain no article media frame or cover image; feed-icon cards=${textOnlyCards.filter((card) => card.querySelector(".grid-card-feed-icon")).length}`,
  )
  check(
    "FEED_ICON_ALLOWED",
    textOnlyCards.some((card) => card.querySelector(".grid-card-feed-icon")) &&
      textOnlyCards.every((card) =>
        [...card.querySelectorAll("img")].every((image) =>
          image.classList.contains("grid-card-feed-icon"),
        ),
      ),
    "feed/source icon images remain allowed metadata and are not article-cover media",
  )
  check(
    "TEXT_ONLY_OPAQUE",
    textOnlyCards.length > 0 &&
      textOnlyCards.every((card) => {
        const background = getComputedStyle(card).backgroundColor
        return colorIsOpaque(background) && background === expectedSurface
      }),
    `surface=${textOnlyCards.map((card) => getComputedStyle(card).backgroundColor).join(",")}`,
  )
  check(
    "TEXT_ONLY_NO_NESTED_CARD",
    textOnlyCards.length > 0 &&
      textOnlyCards.every((card) => {
        const copyStyle = getComputedStyle(card.querySelector(".grid-card-copy"))
        return (
          card.querySelectorAll(".grid-card-wrapper").length === 0 &&
          copyStyle.backgroundColor === "rgba(0, 0, 0, 0)" &&
          copyStyle.borderStyle === "none" &&
          copyStyle.boxShadow === "none"
        )
      }),
    "copy has no nested card surface, border, or shadow",
  )
  check(
    "TEXT_ONLY_TEXT_FIRST_COMPOSITION",
    textOnlyCards.length > 0 &&
      textOnlyCards.every((card) => {
        const copy = card.querySelector(".grid-card-copy")
        const children = [...copy.children]
          .filter((child) => !child.classList.contains("grid-card-summary-measure-probe"))
          .map((child) =>
            child.classList.contains("grid-card-meta")
              ? "meta"
              : child.classList.contains("grid-card-title")
                ? "title"
                : child.classList.contains("grid-card-summary")
                  ? "deck"
                  : child.classList.contains("grid-card-footer")
                    ? "footer"
                    : "other",
          )
        return (
          children[0] === "meta" &&
          children[1] === "title" &&
          children.at(-1) === "footer" &&
          !children.includes("other")
        )
      }),
    "source/time precedes title; optional deck and footer follow",
  )
  const cardRects = cards.map((card) => ({
    card,
    rect: card.getBoundingClientRect(),
  }))
  const mixedRowTextOnlyCards = cardRects
    .filter(({ card }) => card.querySelector(".grid-card-content-no-cover"))
    .filter(({ rect: textRect }) =>
      cardRects.some(
        ({ card: otherCard, rect: otherRect }) =>
          otherCard.querySelector(".grid-card-media") &&
          Math.abs(textRect.top - otherRect.top) <= 1,
      ),
    )
  const isFooterBottomAnchored = (card) => {
    const copy = card.querySelector(".grid-card-copy")
    const footer = card.querySelector(".grid-card-footer")
    if (!copy || !footer) {
      return false
    }

    const cardBottom = card.getBoundingClientRect().bottom
    const footerBottom = footer.getBoundingClientRect().bottom
    const expectedBottomGap =
      Number.parseFloat(getComputedStyle(copy).paddingBottom) +
      Number.parseFloat(getComputedStyle(card).borderBottomWidth)
    return Math.abs(cardBottom - footerBottom - expectedBottomGap) <= 2
  }
  const footerGeometry = (card) => {
    const cardBottom = card.getBoundingClientRect().bottom
    const footerBottom = card.querySelector(".grid-card-footer")?.getBoundingClientRect().bottom
    const copy = card.querySelector(".grid-card-copy")
    const expectedBottomGap = copy
      ? Number.parseFloat(getComputedStyle(copy).paddingBottom) +
        Number.parseFloat(getComputedStyle(card).borderBottomWidth)
      : Number.NaN
    return `${(cardBottom - footerBottom).toFixed(1)}px/${expectedBottomGap.toFixed(1)}px`
  }
  check(
    "TEXT_ONLY_FOOTER_BOTTOM_ANCHORED",
    !mixedRowTextOnlyCards.some(({ card }) => !isFooterBottomAnchored(card)),
    mixedRowTextOnlyCards.length === 0
      ? "not applicable: no image/text-only mixed row at this viewport"
      : `mixed text-only footer gap/expected=${mixedRowTextOnlyCards.map(({ card }) => footerGeometry(card)).join(",")}`,
  )
  check(
    "TEXT_ONLY_EDITORIAL_CONTENT_TOP_ALIGNED",
    textOnlyCards.length > 0 &&
      textOnlyCards.every((card) => {
        const copy = card.querySelector(".grid-card-copy")
        const meta = card.querySelector(".grid-card-meta")
        const title = card.querySelector(".grid-card-title")
        const deck = card.querySelector(".grid-card-summary:not(.grid-card-summary-measure-probe)")
        const footer = card.querySelector(".grid-card-footer")
        const copyRect = copy?.getBoundingClientRect()
        const metaRect = meta?.getBoundingClientRect()
        const titleRect = title?.getBoundingClientRect()
        const deckRect = deck?.getBoundingClientRect()
        const footerRect = footer?.getBoundingClientRect()
        const expectedTopGap = Number.parseFloat(getComputedStyle(copy).paddingTop)
        return (
          copyRect &&
          metaRect &&
          titleRect &&
          footerRect &&
          Math.abs(metaRect.top - copyRect.top - expectedTopGap) <= 2 &&
          metaRect.bottom <= titleRect.top + 1 &&
          (!deckRect || titleRect.bottom <= deckRect.top + 1) &&
          (deckRect ? deckRect.bottom : titleRect.bottom) <= footerRect.top + 1
        )
      }),
    "metadata/title/deck stay at the normal top inset and precede the footer",
  )
  check(
    "TEXT_ONLY_NOT_PLACEHOLDER_LIKE",
    textOnlyCards.length > 0 &&
      textOnlyCards.every(
        (card) =>
          card.querySelector(".grid-card-title")?.textContent.trim() &&
          !card.querySelector(".placeholder, .grid-card-placeholder, .grid-card-loading-item"),
      ),
    "each no-cover card presents article content without a media placeholder",
  )
  check(
    "TEXT_ONLY_TITLE_SIZE_UNCHANGED",
    textOnlyTitles.every(
      (title) => title && getComputedStyle(title).fontSize === (compactViewport ? "18px" : "20px"),
    ),
    `title sizes=${textOnlyTitles.map((title) => getComputedStyle(title).fontSize).join(",")}`,
  )
  check(
    "TEXT_ONLY_TITLE_CLAMP_UNCHANGED",
    textOnlyTitles.length > 0 &&
      textOnlyTitles.every((title) => getComputedStyle(title).webkitLineClamp === "3"),
    `line-clamps=${textOnlyTitles.map((title) => getComputedStyle(title).webkitLineClamp).join(",")}`,
  )
  const deckCard = textOnlyCards.find((card) => card.dataset.hasDeck === "true")
  const renderedDeck = deckCard?.querySelector(
    ".grid-card-summary:not(.grid-card-summary-measure-probe)",
  )
  check(
    "TEXT_ONLY_DECK_CLAMP_UNCHANGED",
    Boolean(renderedDeck) && getComputedStyle(renderedDeck).webkitLineClamp === "2",
    `deck=${renderedDeck?.textContent.trim() ?? "none"}; clamp=${renderedDeck ? getComputedStyle(renderedDeck).webkitLineClamp : "none"}`,
  )
  const getFixtureCard = (id) => cards.find((card) => card.dataset.entryId === id)
  const textOnlyUnread = getFixtureCard("text-only-unread")
  const textOnlyRead = getFixtureCard("text-only-read")
  const textOnlyStarred = getFixtureCard("text-only-starred")
  const textOnlySelected = getFixtureCard("text-only-selected")
  const imageUnread = getFixtureCard("unread")
  const imageRead = getFixtureCard("read")
  const imageStarred = getFixtureCard("favorite")
  const imageSelected = getFixtureCard("selected")
  check(
    "READ_STATE_UNCHANGED",
    Boolean(textOnlyRead && imageRead) &&
      textOnlyRead.classList.contains("read") &&
      textOnlyRead.querySelector(".grid-card-title").classList.contains("article-entry-title") &&
      getComputedStyle(textOnlyRead.querySelector(".grid-card-title")).fontWeight ===
        getComputedStyle(imageRead.querySelector(".grid-card-title")).fontWeight &&
      getComputedStyle(textOnlyRead.querySelector(".grid-card-title"), "::before").opacity ===
        getComputedStyle(imageRead.querySelector(".grid-card-title"), "::before").opacity,
    `text-only read=${textOnlyRead?.classList.contains("read")}; image read=${imageRead?.classList.contains("read")}`,
  )
  check(
    "UNREAD_STATE_UNCHANGED",
    Boolean(textOnlyUnread && imageUnread) &&
      textOnlyUnread.classList.contains("unread") &&
      getComputedStyle(textOnlyUnread.querySelector(".grid-card-title")).fontWeight ===
        getComputedStyle(imageUnread.querySelector(".grid-card-title")).fontWeight &&
      getComputedStyle(textOnlyUnread.querySelector(".grid-card-title"), "::before").opacity ===
        getComputedStyle(imageUnread.querySelector(".grid-card-title"), "::before").opacity,
    `text-only unread=${textOnlyUnread?.classList.contains("unread")}; image unread=${imageUnread?.classList.contains("unread")}`,
  )
  check(
    "STAR_STATE_UNCHANGED",
    Boolean(textOnlyStarred && imageStarred) &&
      textOnlyStarred.querySelector(".grid-card-star")?.style.opacity === "1" &&
      imageStarred.querySelector(".grid-card-star")?.style.opacity === "1" &&
      textOnlyUnread?.querySelector(".grid-card-star")?.style.opacity === "0",
    `starred=${textOnlyStarred?.querySelector(".grid-card-star")?.style.opacity}/${imageStarred?.querySelector(".grid-card-star")?.style.opacity}; unstarred=${textOnlyUnread?.querySelector(".grid-card-star")?.style.opacity}`,
  )
  check(
    "SELECTED_STATE_UNCHANGED",
    Boolean(textOnlySelected && imageSelected) &&
      textOnlySelected.classList.contains("selected") &&
      imageSelected.classList.contains("selected") &&
      getComputedStyle(textOnlySelected).backgroundImage ===
        getComputedStyle(imageSelected).backgroundImage &&
      getComputedStyle(textOnlySelected).boxShadow === getComputedStyle(imageSelected).boxShadow,
    `selected overlays=${textOnlySelected ? getComputedStyle(textOnlySelected).backgroundImage : "none"}/${imageSelected ? getComputedStyle(imageSelected).backgroundImage : "none"}`,
  )
  check(
    "IMAGE_CARD_INLINE_PADDING_UNCHANGED",
    mediaCards.length > 0 &&
      mediaCards.every((card) => {
        const copyStyle = getComputedStyle(card.querySelector(".grid-card-copy"))
        return copyStyle.paddingInlineStart === "0px" && copyStyle.paddingInlineEnd === "0px"
      }),
    `image-card insets=${mediaCards.map((card) => getComputedStyle(card.querySelector(".grid-card-copy")).paddingInlineStart).join(",")}`,
  )
  check(
    "IMAGE_CARD_GEOMETRY_UNCHANGED",
    mediaCards.length > 0 && mediaCards.every((card) => card.querySelector(".grid-card-media")),
    `image cards=${mediaCards.length}; media elements present`,
  )
  check(
    "IMAGE_CARD_FOOTER_BEHAVIOR_UNCHANGED",
    mediaCards.length > 0 && mediaCards.every((card) => isFooterBottomAnchored(card)),
    `image footer gap/expected=${mediaCards.map((card) => footerGeometry(card)).join(",")}`,
  )
  const mixedRowPairs = cardRects.filter(
    ({ card, rect }) =>
      card.querySelector(".grid-card-content-no-cover") &&
      cardRects.some(
        ({ card: otherCard, rect: otherRect }) =>
          otherCard.querySelector(".grid-card-media") && Math.abs(rect.top - otherRect.top) <= 1,
      ),
  )
  check(
    "MIXED_ROW_WHITESPACE_ACCEPTABLE",
    !mixedRowPairs.some(({ card, rect }) => {
      const imageCard = cardRects.find(
        ({ card: otherCard, rect: otherRect }) =>
          otherCard.querySelector(".grid-card-media") && Math.abs(rect.top - otherRect.top) <= 1,
      )
      const editorialBottom =
        card
          .querySelector(".grid-card-summary:not(.grid-card-summary-measure-probe)")
          ?.getBoundingClientRect().bottom ??
        card.querySelector(".grid-card-title").getBoundingClientRect().bottom
      return (
        !imageCard ||
        Math.abs(rect.height - imageCard.rect.height) > 1 ||
        !isFooterBottomAnchored(card) ||
        card.querySelector(".grid-card-footer").getBoundingClientRect().top - editorialBottom < 16
      )
    }),
    mixedRowPairs.length === 0
      ? "not applicable: no image/text-only mixed row at this viewport"
      : `mixed pairs=${mixedRowPairs.length}; equal-height rows retain top copy, flexible middle space, and bottom footer`,
  )
  check(
    "NO_CONTENT_COLLISION",
    cards.every((card, index) => {
      const rect = card.getBoundingClientRect()
      return cards.slice(index + 1).every((otherCard) => {
        const otherRect = otherCard.getBoundingClientRect()
        return (
          rect.right <= otherRect.left ||
          otherRect.right <= rect.left ||
          rect.bottom <= otherRect.top ||
          otherRect.bottom <= rect.top
        )
      })
    }),
    `cards=${cards.length}`,
  )
  check(
    "NO_TEXT_CLIPPING",
    cards.length > 0 &&
      cards.every((card) => {
        const cardRect = card.getBoundingClientRect()
        const border = Number.parseFloat(getComputedStyle(card).borderTopWidth)
        return [
          ...card.querySelectorAll(
            ".grid-card-meta, .grid-card-title, .grid-card-summary:not(.grid-card-summary-measure-probe), .grid-card-footer",
          ),
        ].every((element) => {
          const rect = element.getBoundingClientRect()
          return (
            rect.left >= cardRect.left + border - 1 &&
            rect.right <= cardRect.right - border + 1 &&
            rect.top >= cardRect.top + border - 1 &&
            rect.bottom <= cardRect.bottom - border + 1
          )
        })
      }),
    "metadata, title, deck, and footer remain inside their card surface",
  )

  if (textOnlyCopyNodes[0] && textOnlyTitles[0]) {
    const copy = textOnlyCopyNodes[0]
    const title = textOnlyTitles[0]
    check(
      "TEXT_ONLY_VISUALLY_DISTINCT",
      Math.abs(copy.clientWidth - title.clientWidth - 32) < 1,
      `copy=${copy.clientWidth}px; title=${title.clientWidth}px; inset=${copy.clientWidth - title.clientWidth}px`,
    )
  }

  const skeleton = document.querySelector(".grid-card-loading-item")
  if (skeleton && cards[0]) {
    const skeletonStyle = getComputedStyle(skeleton)
    const cardStyle = getComputedStyle(cards[0])
    check(
      "SKELETON_GEOMETRY_PARITY",
      skeletonStyle.borderRadius === cardStyle.borderRadius &&
        skeletonStyle.borderTopColor === cardStyle.borderTopColor &&
        skeletonStyle.backgroundColor === cardStyle.backgroundColor &&
        skeletonStyle.overflow === "hidden",
      `skeleton=${skeletonStyle.borderRadius}/${skeletonStyle.borderTopColor}/${skeletonStyle.backgroundColor}; card=${cardStyle.borderRadius}/${cardStyle.borderTopColor}/${cardStyle.backgroundColor}`,
    )
  }

  const report = {
    checks: results,
    failCount: results.filter(({ status }) => status === "FAIL").length,
    viewport: { height: window.innerHeight, width: window.innerWidth },
  }
  globalThis.phase2b2c01Results = report
  document.querySelector("#gate-report").textContent = JSON.stringify(report, null, 2)
  document.querySelector("#gate-status").textContent = report.failCount === 0 ? "PASS" : "FAIL"
  return report
}

const App = () => {
  const initialTheme =
    new URLSearchParams(globalThis.location.search).get("theme") === "dark" ? "dark" : "light"
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    const captureCardInteraction = (event) => {
      const card = event.target.closest?.(".grid-card-wrapper")
      if (!card) {
        return
      }

      const style = getComputedStyle(card)
      const expectedSurface = tokenColor(
        getComputedStyle(document.body).getPropertyValue("--nf-surface-content").trim(),
      )
      const isSelected = card.classList.contains("selected")
      const stateToken = isSelected
        ? "--nf-state-selected"
        : event.type === "pointerover"
          ? "--nf-state-hover"
          : event.type === "pointerdown"
            ? "--nf-state-pressed"
            : null
      const expectedOverlay = stateToken
        ? tokenColor(getComputedStyle(document.body).getPropertyValue(stateToken).trim())
        : null
      const opaque =
        colorIsOpaque(style.backgroundColor) && style.backgroundColor === expectedSurface
      const overlayPresent = !expectedOverlay || style.backgroundImage.includes(expectedOverlay)
      const focusVisible = event.type === "focusin" && card.matches(":focus-visible")
      const focusRingPresent =
        !focusVisible ||
        (style.outlineStyle === "solid" && Number.parseFloat(style.outlineWidth) >= 2)
      const check = {
        background: style.backgroundColor,
        event: event.type,
        focusVisible,
        focusRing: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
        id: card.dataset.entryId,
        overlay: style.backgroundImage,
        status: opaque && overlayPresent && focusRingPresent ? "PASS" : "FAIL",
      }
      const report = globalThis.phase2b2c01InteractionResults ?? []
      report.push(check)
      globalThis.phase2b2c01InteractionResults = report
      document.querySelector("#interaction-report").textContent = JSON.stringify(report, null, 2)
    }

    const observedEvents = ["focusin", "pointerdown", "pointerover"]
    for (const eventName of observedEvents) {
      document.addEventListener(eventName, captureCardInteraction)
    }

    document.body.setAttribute("arco-theme", theme === "dark" ? "dark" : "")
    document.documentElement.dataset.theme = theme
    const handleResize = () => runStructuralGate()
    globalThis.addEventListener("resize", handleResize)
    let gateTimer
    const frame = requestAnimationFrame(() => {
      gateTimer = globalThis.setTimeout(runStructuralGate, 250)
    })
    return () => {
      cancelAnimationFrame(frame)
      globalThis.clearTimeout(gateTimer)
      globalThis.removeEventListener("resize", handleResize)
      for (const eventName of observedEvents) {
        document.removeEventListener(eventName, captureCardInteraction)
      }
    }
  }, [theme])

  return (
    <main className="phase2b2c01-page">
      <header className="phase2b2c01-header">
        <div>
          <p className="phase2b2c01-eyebrow">PHASE 2B.2C-01 / STRUCTURAL GATE</p>
          <h1>Rounded editorial cards</h1>
        </div>
        <div className="phase2b2c01-controls">
          <button onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}>
            Toggle {theme} theme
          </button>
          <button onClick={() => runStructuralGate()}>Run gate</button>
        </div>
      </header>
      <p className="phase2b2c01-intro">
        The cards below use the production ArticleEntry and ArticleGridCard classes and styles. The
        fixtures cover unread, read, selected, favorite, and text-only cards.
      </p>
      <section aria-label="Editorial card fixtures" className="phase2b2c01-grid">
        <FixtureCard id="unread" />
        <FixtureCard deck noCover id="text-only-unread" />
        <FixtureCard read id="read" />
        <FixtureCard selected id="selected" />
        <FixtureCard starred id="favorite" />
        <FixtureCard noCover read id="text-only-read" />
        <FixtureCard noCover selected id="text-only-selected" />
        <FixtureCard noCover starred id="text-only-starred" />
        <FixtureCard noCover id="text-only-short-title" title="A short headline" />
      </section>
      <section aria-label="Loading card fixture" className="phase2b2c01-loading-fixture">
        <div className="grid-card-loading-item">
          <div className="grid-card-loading-media" />
          <div className="grid-card-loading-copy">Loading card surface</div>
        </div>
      </section>
      <section aria-label="Interaction state report" className="phase2b2c01-report">
        <h2>Interaction states</h2>
        <pre id="interaction-report">Move onto or press a card to capture its state.</pre>
      </section>
      <section aria-label="Structural gate report" className="phase2b2c01-report">
        <h2>
          Gate: <span id="gate-status">RUNNING</span>
        </h2>
        <pre id="gate-report">Waiting for layout…</pre>
      </section>
    </main>
  )
}

ReactDOM.createRoot(document.querySelector("#root")).render(<App />)

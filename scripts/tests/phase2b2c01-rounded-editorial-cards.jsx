/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useMemo, useState } from "react"
import ReactDOM from "react-dom/client"

import ArticleGridCard from "@/components/Article/ArticleGridCard"
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

const FixtureCard = ({ id, read = false, selected = false, starred = false, noCover = false }) => {
  const entry = useMemo(
    () => ({
      cardDeckCandidates: [],
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
      title: "A headline with enough words to show how the editorial card reads",
    }),
    [id, noCover, read, starred],
  )

  return (
    <a
      aria-label={`Sample article ${id}`}
      className={`article-entry grid-card-wrapper ${read ? "read" : "unread"}${selected ? " selected" : ""}`}
      data-entry-id={id}
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
        <FixtureCard read id="read" />
        <FixtureCard selected id="selected" />
        <FixtureCard starred id="favorite" />
        <FixtureCard noCover id="text-only" />
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

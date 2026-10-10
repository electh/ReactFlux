/* eslint-disable react-refresh/only-export-components */

import "@arco-design/web-react/dist/css/arco.css"
import { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"

import "@/index.css"
import "@/theme.css"
import "@/App.css"
import "@/components/Article/ArticleEntry.css"
import "@/components/Article/ArticleGridCard.css"
import "@/components/Article/ArticleList.css"
import "@/components/Article/ArticleListItem.css"
import "@/components/Content/Content.css"
import "./phase2b2a-visual-foundation.css"

const ARTICLE_TEXT =
  "A new report follows the people and places behind the story, with details that help explain what changed and why it matters."
const DEMO_IMAGE = "/scripts/tests/fixtures/valid-horizontal.svg"

const readStateFromTokens = (element) => {
  const styles = getComputedStyle(element)
  const marker = getComputedStyle(element.querySelector(".grid-card-title"), "::before")
  const title = element.querySelector(".grid-card-title")
  const summary = element.querySelector(".grid-card-summary")
  const metadata = element.querySelector(".grid-card-meta")
  const image = element.querySelector(".grid-card-cover")
  const star = element.querySelector(".grid-card-star")

  return {
    imageFilter: image ? getComputedStyle(image).filter : "none",
    imageOpacity: image ? getComputedStyle(image).opacity : "none",
    markerColor: marker.backgroundColor,
    markerOpacity: marker.opacity,
    metadataColor: metadata ? getComputedStyle(metadata).color : "",
    opacity: styles.opacity,
    starColor: star ? getComputedStyle(star).color : "",
    starOpacity: star ? getComputedStyle(star).opacity : "",
    summaryColor: summary ? getComputedStyle(summary).color : "",
    titleColor: title ? getComputedStyle(title).color : "",
    titleWeight: title ? getComputedStyle(title).fontWeight : "",
  }
}

const parseColor = (value) => {
  const color = value.trim().toLowerCase()
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color)
  if (hex) {
    const expanded =
      hex[1].length === 3 ? [...hex[1]].map((digit) => digit.repeat(2)).join("") : hex[1]
    return [0, 2, 4].map((index) => Number.parseInt(expanded.slice(index, index + 2), 16))
  }

  const rgb = color.match(/[\d.]+/g)?.map(Number)
  return rgb?.length >= 3 ? rgb.slice(0, 3) : null
}

const colorsMatch = (left, right) => parseColor(left)?.join(",") === parseColor(right)?.join(",")

const relativeLuminance = (color) => {
  const rgb = parseColor(color)
  if (!rgb) {
    return null
  }

  const channels = rgb.map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

const contrastRatio = (foreground, background) => {
  const foregroundLuminance = relativeLuminance(foreground)
  const backgroundLuminance = relativeLuminance(background)
  if (foregroundLuminance === null || backgroundLuminance === null) {
    return 0
  }
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

const getToken = (name) => getComputedStyle(document.body).getPropertyValue(name).trim()

const setHarnessTheme = (theme) => {
  document.body.setAttribute("arco-theme", theme)
  const canvas = getToken("--nf-canvas")
  document.documentElement.style.setProperty("--app-shell-background", canvas)
  document.documentElement.style.setProperty("--app-status-bar-background", canvas)
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute("content", canvas)
  }
}

const hasMediaRule = (mediaName, tokenName) => {
  const visit = (rules) => {
    for (const rule of rules) {
      if (
        rule instanceof CSSMediaRule &&
        rule.conditionText.includes(mediaName) &&
        rule.cssText.includes(tokenName)
      ) {
        return true
      }
      if (rule.cssRules && visit(rule.cssRules)) {
        return true
      }
    }
    return false
  }

  return [...document.styleSheets].some((sheet) => {
    try {
      return visit(sheet.cssRules)
    } catch {
      return false
    }
  })
}

const checkColorNameBridge = () => {
  const previousInlineValue = document.body.style.getPropertyValue("--primary-6")
  const previousPriority = document.body.style.getPropertyPriority("--primary-6")
  document.body.style.setProperty("--primary-6", "240 20 180")
  const accent = parseColor(getToken("--nf-accent"))
  if (previousInlineValue) {
    document.body.style.setProperty("--primary-6", previousInlineValue, previousPriority)
  } else {
    document.body.style.removeProperty("--primary-6")
  }
  return Boolean(accent && accent[0] === 240 && accent[1] === 20 && accent[2] === 180)
}

const runVisualContract = (restoreTheme = "dark") => {
  setHarnessTheme("dark")
  const unread = document.querySelector('[data-story="unread"]')
  const read = document.querySelector('[data-story="read"]')
  const unreadStarred = document.querySelector('[data-story="unread-starred"]')
  const readStarred = document.querySelector('[data-story="read-starred"]')
  const selected = document.querySelector('[data-story="selected"]')
  const simulatedHover = document.querySelector('[data-story="hover"]')
  const noImage = document.querySelector('[data-story="text-only"]')
  const media = document.querySelector('[data-story="unread"] .grid-card-media')
  const pwaBar = document.querySelector(".pwa-status-bar")
  const darkSnapshot = {
    canvas: getToken("--nf-canvas"),
    content: getToken("--nf-surface-content"),
    elevated: getToken("--nf-surface-elevated"),
    raised: getToken("--nf-surface-raised"),
    favorite: getToken("--nf-favorite"),
    unread: getToken("--nf-status-unread"),
    primary: getToken("--nf-text-primary"),
    secondary: getToken("--nf-text-secondary"),
    tertiary: getToken("--nf-text-tertiary"),
    shell: [document.documentElement, document.body, document.querySelector("#root")].map(
      (element) => getComputedStyle(element).backgroundColor,
    ),
    media: media ? getComputedStyle(media).backgroundColor : "",
    pwa: pwaBar ? getComputedStyle(pwaBar).backgroundColor : "",
    themeColor: document.querySelector('meta[name="theme-color"]')?.content ?? "",
    unreadStory: readStateFromTokens(unread),
    readStory: readStateFromTokens(read),
    starredStory: readStateFromTokens(readStarred),
  }
  const unreadMarkerSize = getComputedStyle(unread.querySelector(".grid-card-title"), "::before")
  const readMarker = getComputedStyle(read.querySelector(".grid-card-title"), "::before")
  const titleContrast = contrastRatio(darkSnapshot.readStory.titleColor, darkSnapshot.content)
  const deckContrast = contrastRatio(darkSnapshot.readStory.summaryColor, darkSnapshot.content)
  const metadataContrast = contrastRatio(darkSnapshot.readStory.metadataColor, darkSnapshot.content)
  const surfaceLuminances = [
    darkSnapshot.canvas,
    darkSnapshot.content,
    darkSnapshot.elevated,
    darkSnapshot.raised,
  ].map((surface) => relativeLuminance(surface))
  const selectedStyle = getComputedStyle(selected)
  const hoverStyle = getComputedStyle(simulatedHover)
  const baseStoryStyle = getComputedStyle(unread)
  const focusTarget = selected
  focusTarget.focus({ focusVisible: true, preventScroll: true })
  const focusStyle = getComputedStyle(focusTarget)
  const mediaMatchesToken =
    parseColor(darkSnapshot.media)?.join(",") === parseColor(darkSnapshot.elevated)?.join(",")
  const starredColor = parseColor(darkSnapshot.starredStory.starColor)
  const unreadColor = parseColor(darkSnapshot.unread)
  const colorNameAccentBridge = checkColorNameBridge()
  const reducedMotionRule = hasMediaRule("prefers-reduced-motion", "--nf-motion-fast")
  const reducedTransparencyRule = hasMediaRule("prefers-reduced-transparency", "--nf-glass-fill")
  const forcedColorsRule = hasMediaRule("forced-colors", "--nf-focus-ring")
  const glassTokensPresent = [
    "--nf-glass-fill",
    "--nf-glass-border",
    "--nf-glass-highlight",
    "--nf-glass-shadow",
    "--nf-glass-blur",
    "--nf-glass-fill-solid",
  ].every((token) => Boolean(getToken(token)))
  const darkResults = {
    OLED_CANVAS_APPLIED: darkSnapshot.canvas === "#0b0d10",
    SHELL_CANVAS_ALIGNED: darkSnapshot.shell.every((surface) =>
      colorsMatch(surface, darkSnapshot.canvas),
    ),
    PWA_BACKGROUND_ALIGNED:
      colorsMatch(darkSnapshot.pwa, darkSnapshot.canvas) &&
      colorsMatch(darkSnapshot.themeColor, darkSnapshot.canvas),
    SURFACE_HIERARCHY_DISTINCT: surfaceLuminances.every(
      (value, index) => index === 0 || value > surfaceLuminances[index - 1],
    ),
    UNREAD_MARKER_VISIBLE:
      unreadMarkerSize.opacity === "1" &&
      Number.parseFloat(unreadMarkerSize.width) >= 5 &&
      parseColor(unreadMarkerSize.backgroundColor)?.join(",") === unreadColor?.join(","),
    READ_MARKER_NOT_CONFUSED: readMarker.opacity === "0",
    READ_TITLE_READABLE: titleContrast >= 4.5,
    READ_NOT_DISABLED:
      darkSnapshot.readStory.opacity === "1" &&
      darkSnapshot.readStory.imageFilter === "none" &&
      titleContrast >= 4.5 &&
      deckContrast >= 4.5 &&
      metadataContrast >= 4.5,
    IMAGE_UNMODIFIED_BY_READ:
      darkSnapshot.readStory.imageFilter === "none" &&
      darkSnapshot.readStory.imageOpacity === darkSnapshot.unreadStory.imageOpacity,
    STARRED_VISIBLE:
      darkSnapshot.starredStory.starOpacity === "1" && Boolean(darkSnapshot.starredStory.starColor),
    FAVORITE_DISTINCT_FROM_UNREAD:
      Boolean(starredColor && unreadColor) && starredColor.join(",") !== unreadColor.join(","),
    HOVER_DISTINCT:
      hoverStyle.backgroundColor !== baseStoryStyle.backgroundColor &&
      getToken("--nf-state-hover") !== "transparent",
    SELECTED_DISTINCT:
      selectedStyle.backgroundColor !== "rgba(0, 0, 0, 0)" &&
      selectedStyle.boxShadow.includes("rgb"),
    FOCUS_VISIBLE:
      focusStyle.outlineStyle === "solid" &&
      focusStyle.outlineWidth === "2px" &&
      contrastRatio(focusStyle.outlineColor, darkSnapshot.canvas) >= 3,
    TEXT_PRIMARY_SECONDARY_DISTINCT:
      darkSnapshot.primary !== darkSnapshot.secondary &&
      contrastRatio(darkSnapshot.primary, darkSnapshot.content) >
        contrastRatio(darkSnapshot.tertiary, darkSnapshot.content),
    MEDIA_SURFACE_VALID: mediaMatchesToken,
    REDUCED_MOTION_SUPPORTED: reducedMotionRule,
    REDUCED_TRANSPARENCY_TOKENS_PRESENT: glassTokensPresent && reducedTransparencyRule,
    FORCED_COLORS_FALLBACK_PRESENT: forcedColorsRule,
    COLOR_NAME_ACCENT_PRESERVED: colorNameAccentBridge,
    TEXT_ONLY_CARD_VALID: !noImage.querySelector(".grid-card-media"),
    NO_HORIZONTAL_OVERFLOW:
      document.documentElement.scrollWidth <= window.innerWidth &&
      document.body.scrollWidth <= window.innerWidth,
  }

  setHarnessTheme("light")
  const lightRead = readStateFromTokens(read)
  const lightInput = document.querySelector('[data-arco-sample="input"] .arco-input')
  const lightMenu = document.querySelector('[data-arco-sample="menu"] .arco-dropdown-menu-item')
  const lightSnapshot = {
    canvas: getToken("--nf-canvas"),
    surface: getToken("--nf-surface-content"),
    shell: [document.documentElement, document.body, document.querySelector("#root")].map(
      (element) => getComputedStyle(element).backgroundColor,
    ),
    pwa: getComputedStyle(pwaBar).backgroundColor,
    themeColor: document.querySelector('meta[name="theme-color"]')?.content ?? "",
    readTitleContrast: contrastRatio(lightRead.titleColor, getToken("--nf-surface-content")),
    inputContrast: contrastRatio(
      getComputedStyle(lightInput).color,
      getComputedStyle(lightInput.parentElement).backgroundColor,
    ),
    menuContrast: contrastRatio(
      getComputedStyle(lightMenu).color,
      getComputedStyle(lightMenu.parentElement).backgroundColor,
    ),
  }
  const lightResults = {
    LIGHT_MODE_NO_REGRESSION:
      lightSnapshot.canvas === "#f2f3f5" &&
      lightSnapshot.surface === "#fff" &&
      lightSnapshot.shell.every((surface) => colorsMatch(surface, lightSnapshot.canvas)) &&
      colorsMatch(lightSnapshot.pwa, lightSnapshot.canvas) &&
      colorsMatch(lightSnapshot.themeColor, lightSnapshot.canvas) &&
      lightSnapshot.readTitleContrast >= 4.5 &&
      lightSnapshot.inputContrast >= 4.5 &&
      lightSnapshot.menuContrast >= 4.5,
  }
  setHarnessTheme(restoreTheme)

  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    dark: darkResults,
    light: lightResults,
    measurements: {
      dark: darkSnapshot,
      light: lightSnapshot,
      hoverBackground: hoverStyle.backgroundColor,
      baseBackground: baseStoryStyle.backgroundColor,
      selectedBackground: selectedStyle.backgroundColor,
      focusRing: { color: focusStyle.outlineColor, width: focusStyle.outlineWidth },
      contrast: {
        deck: Number(deckContrast.toFixed(2)),
        metadata: Number(metadataContrast.toFixed(2)),
        title: Number(titleContrast.toFixed(2)),
      },
      pass: [...Object.values(darkResults), ...Object.values(lightResults)].every(Boolean),
    },
  }
}

const StoryCard = ({
  focusable = false,
  hasImage = true,
  isStarred = false,
  label,
  selected = false,
  state,
  title,
  hoverSimulated = false,
}) => {
  const isUnread = state === "unread"
  const entryClass = [
    "article-entry",
    "grid-card-wrapper",
    "phase2b2a-story-card",
    isUnread ? "unread" : "read",
    selected ? "selected" : "",
    hoverSimulated ? "phase2b2a-hover-simulated" : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="phase2b2a-story-example" data-story-example={label}>
      <span className="phase2b2a-story-label">{label}</span>
      <a
        aria-label={`${state} article: ${title}`}
        className={entryClass}
        data-story={label}
        href={`#${label}`}
        tabIndex={focusable || selected ? 0 : -1}
        onClick={(event) => event.preventDefault()}
      >
        <div className={`grid-card-content ${hasImage ? "" : "grid-card-content-no-cover"}`}>
          {hasImage && (
            <div className="grid-card-media">
              <img
                alt=""
                className="grid-card-cover grid-card-cover-ready"
                height="900"
                src={DEMO_IMAGE}
                width="1600"
              />
            </div>
          )}
          <div className="grid-card-copy">
            <div className="grid-card-meta">
              <span className="grid-card-source">Northstar Review</span>
              <time className="grid-card-time" dateTime="2026-10-10T12:00:00Z">
                12 min ago
              </time>
            </div>
            <h3 className="article-entry-title grid-card-title">{title}</h3>
            <p className="grid-card-summary">{ARTICLE_TEXT}</p>
            <div className="grid-card-footer">
              <span className="grid-card-reading-time">4 min read</span>
              <span
                aria-hidden={!isStarred}
                className="grid-card-star"
                data-favorite={isStarred ? "true" : "false"}
                style={{ opacity: isStarred ? 1 : 0 }}
              >
                ★
              </span>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}

const App = () => {
  const [theme, setTheme] = useState("dark")
  const [results, setResults] = useState(null)

  const changeTheme = (nextTheme) => {
    setTheme(nextTheme)
    setHarnessTheme(nextTheme)
  }

  useEffect(() => {
    setHarnessTheme("dark")
    const frame = requestAnimationFrame(() => setResults(runVisualContract("dark")))
    return () => cancelAnimationFrame(frame)
  }, [])

  const runChecks = () => setResults(runVisualContract(theme))

  return (
    <main className="phase2b2a-suite">
      <header className="phase2b2a-header">
        <div className="phase2b2a-heading">
          <h1>NewsFlux visual foundation</h1>
          <p>
            OLED canvas, quiet editorial surfaces, separated story states, and an Arco bridge. This
            page exercises the current Card and Column presenters without changing their data or
            behavior.
          </p>
        </div>
        <div className="phase2b2a-controls">
          <button
            aria-pressed={theme === "dark"}
            className="phase2b2a-control"
            type="button"
            onClick={() => changeTheme("dark")}
          >
            Dark · OLED
          </button>
          <button
            aria-pressed={theme === "light"}
            className="phase2b2a-control"
            type="button"
            onClick={() => changeTheme("light")}
          >
            Light
          </button>
          <button className="phase2b2a-control" type="button" onClick={runChecks}>
            Run visual checks
          </button>
        </div>
      </header>

      <pre className="phase2b2a-results" data-testid="visual-contract-results">
        {results ? JSON.stringify(results, null, 2) : "Running visual checks…"}
      </pre>

      <section className="phase2b2a-section">
        <h2>Story states</h2>
        <p className="phase2b2a-section-intro">
          Unread is marked with a blue dot and stronger title. Read keeps normal contrast and
          imagery. The favorite star remains amber and independent.
        </p>
        <div className="phase2b2a-story-grid">
          <StoryCard
            label="unread"
            state="unread"
            title="The city’s new reading rooms open along the waterfront"
          />
          <StoryCard
            label="read"
            state="read"
            title="A field report traces how the harbor changed over a decade"
          />
          <StoryCard
            isStarred
            label="unread-starred"
            state="unread"
            title="Researchers map a second route through the old district"
          />
          <StoryCard
            isStarred
            label="read-starred"
            state="read"
            title="The archive shares photographs from the first expedition"
          />
          <StoryCard
            selected
            label="selected"
            state="unread"
            title="A selected story remains distinct from its unread marker"
          />
          <StoryCard
            hoverSimulated
            label="hover"
            state="read"
            title="A quiet hover layer leaves the story hierarchy intact"
          />
          <StoryCard
            focusable
            label="keyboard-focus"
            state="unread"
            title="Keyboard focus has a high-contrast two-pixel ring"
          />
          <StoryCard
            hasImage={false}
            label="text-only"
            state="read"
            title="A text-first story still reads as an editorial card"
          />
          <StoryCard
            label="image-card"
            state="read"
            title="The photograph supplies the main visual boundary"
          />
        </div>
      </section>

      <section className="phase2b2a-section">
        <h2>Column row</h2>
        <p className="phase2b2a-section-intro">
          Existing row density and layout remain intact; only semantic text, state, and separator
          roles change.
        </p>
        <div className="phase2b2a-column-shell">
          <a
            aria-label="Unread article in Column layout"
            className="article-entry list-entry-wrapper unread phase2b2a-column-row"
            href="#column-row"
            onClick={(event) => event.preventDefault()}
          >
            <div className="list-entry-content">
              <div className="list-entry-source">
                <span className="list-entry-source-title">Northstar Review</span>
              </div>
              <div className="list-entry-story">
                <h3 className="article-entry-title list-entry-title">
                  The harbor’s reading rooms open to the public this morning
                </h3>
                <span className="list-entry-summary">
                  <span aria-hidden="true" className="list-entry-summary-separator">
                    —
                  </span>
                  {ARTICLE_TEXT}
                </span>
              </div>
              <div className="list-entry-meta">
                <span className="list-entry-reading-time">4 min</span>
                <span className="list-entry-star" style={{ opacity: 1 }}>
                  ★
                </span>
                <time className="list-entry-time" dateTime="2026-10-10T12:00:00Z">
                  12 min ago
                </time>
              </div>
            </div>
          </a>
        </div>
      </section>

      <section className="phase2b2a-section">
        <h2>Content surfaces and state colors</h2>
        <div className="phase2b2a-surface-samples">
          <div className="phase2b2a-surface-sample phase2b2a-surface-canvas">
            <strong>Canvas</strong>
            <code>--nf-canvas</code>
          </div>
          <div className="phase2b2a-surface-sample phase2b2a-surface-content">
            <strong>Content</strong>
            <code>--nf-surface-content</code>
          </div>
          <div className="phase2b2a-surface-sample phase2b2a-surface-elevated">
            <strong>Elevated</strong>
            <code>--nf-surface-elevated</code>
          </div>
          <div className="phase2b2a-surface-sample phase2b2a-surface-raised">
            <strong>Raised</strong>
            <code>--nf-surface-raised</code>
          </div>
        </div>
        <div className="phase2b2a-token-samples" style={{ marginTop: 12 }}>
          <div className="phase2b2a-token-sample phase2b2a-token-accent">
            <strong>Accent</strong>
            <code>--nf-accent</code>
          </div>
          <div className="phase2b2a-token-sample phase2b2a-token-favorite">
            <strong>Favorite</strong>
            <code>--nf-favorite</code>
          </div>
          <div className="phase2b2a-token-sample phase2b2a-token-unread">
            <strong>Unread marker</strong>
            <code>--nf-status-unread</code>
          </div>
          <div className="phase2b2a-token-sample phase2b2a-surface-raised">
            <strong>Focus ring</strong>
            <code>--nf-focus-ring · 2px</code>
          </div>
        </div>
      </section>

      <section className="phase2b2a-section">
        <h2>Arco controls and overlay surfaces</h2>
        <div className="phase2b2a-arco-samples">
          <div className="phase2b2a-arco-sample" data-arco-sample="input">
            <h3>Input and pagination</h3>
            <div className="arco-input-inner-wrapper">
              <input
                readOnly
                aria-label="Search sample"
                className="arco-input"
                value="Search in feeds"
              />
            </div>
            <ul className="arco-pagination" style={{ marginTop: 16, padding: 0 }}>
              <li className="arco-pagination-item arco-pagination-item-active">1</li>
              <li className="arco-pagination-item">2</li>
              <li className="arco-pagination-item">3</li>
            </ul>
          </div>
          <div className="phase2b2a-arco-sample" data-arco-sample="menu">
            <h3>Dropdown and radio</h3>
            <div className="arco-dropdown-menu phase2b2a-arco-menu">
              <div className="arco-dropdown-menu-item">All stories</div>
              <div className="arco-dropdown-menu-item arco-dropdown-menu-item-active">
                Unread stories
              </div>
            </div>
            <div className="arco-radio-group" style={{ marginTop: 14 }}>
              <label className="arco-radio arco-radio-checked">
                <span className="arco-radio-mask" />
                <span className="arco-radio-label">Keep current option</span>
              </label>
            </div>
          </div>
          <div className="phase2b2a-arco-sample">
            <h3>Modal surface</h3>
            <div className="phase2b2a-modal-sample">
              <strong className="arco-modal-title">Overlay sample</strong>
              <p>Controls remain readable above the content canvas.</p>
              <button
                className="arco-btn arco-btn-secondary"
                style={{ marginTop: 12 }}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

document.body.setAttribute("arco-theme", "dark")
document.documentElement.style.setProperty("--app-shell-background", "#0b0d10")
document.documentElement.style.setProperty("--app-status-bar-background", "#0b0d10")

const existingRoot = globalThis.__phase2b2aRoot
const root = existingRoot ?? ReactDOM.createRoot(document.querySelector("#root"))
if (!existingRoot) {
  globalThis.__phase2b2aRoot = root
}
root.render(<App />)

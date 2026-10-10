// Browser regression fixture. Run `pnpm dev` and open this file's HTML entry to execute it.
import "@arco-design/web-react/es/_util/react-19-adapter"
import "@arco-design/web-react/dist/css/arco.css"
import { useStore } from "@nanostores/react"
import Polyglot from "node-polyglot"
import React, { useRef, useState } from "react"
import ReactDOM from "react-dom/client"
import { MemoryRouter } from "react-router"
import "simplebar-react/dist/simplebar.min.css"

import ArticleList from "@/components/Article/ArticleList"
import "@/components/Content/Content.css"
import "@/index.css"
import { polyglotState } from "@/hooks/useLanguage"
import englishPhrases from "@/locales/en-US.json"
import { contentState } from "@/store/contentState"
import { dataState } from "@/store/dataState"
import { getDefaultSettings, settingsState } from "@/store/settingsState"
import "@/theme.css"

const TEST_COUNTS = [48, 2506]
const TEST_DEPTHS = [
  { label: "top", fraction: 0 },
  { label: "mid", fraction: 0.45 },
  { label: "deep", fraction: 0.85 },
]
const TEST_TRANSITIONS = [
  ["column", "card"],
  ["list", "card"],
  ["card", "column", "card"],
  ["column", "card", "column"],
]

const makeEntries = (count) => {
  const feed = {
    category: { id: 1, title: "Runtime tests" },
    feed_url: "https://example.invalid/feed.xml",
    icon: { icon_id: 0 },
    id: 1,
    site_url: "https://example.invalid",
    title: "Runtime test feed",
  }
  const publishedAt = new Date().toISOString()
  return Array.from({ length: count }, (_, index) => ({
    content: `<p>Runtime card-layout fixture entry ${index + 1}.</p>`,
    coverHeight: 0,
    coverSource: null,
    coverWidth: 0,
    feed,
    id: 10_000 + index,
    published_at: publishedAt,
    reading_time: 1,
    starred: false,
    status: "unread",
    title: `Runtime fixture article ${String(index + 1).padStart(4, "0")}`,
    url: `https://example.invalid/articles/${index + 1}`,
  }))
}

const setFixtureCount = (count) => {
  contentState.set({
    ...contentState.get(),
    articleListError: false,
    entries: makeEntries(count),
    filterDate: null,
    filterString: "",
    infoFrom: "all",
    infoId: null,
    isArticleListReady: true,
    loadMoreVisible: false,
    total: count,
  })
}

const setFixtureLayout = (layout) => {
  settingsState.set({ ...settingsState.get(), articleListLayout: layout })
}

const settleLayout = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 180)))
  })

const getArticleListScrollRoot = () => {
  const list = document.querySelector(".entry-list")
  return (
    list?.querySelector(".simplebar-content-wrapper") ??
    list?.querySelector(".adaptive-scroll-area-native") ??
    list
  )
}

const getMetrics = () => {
  const list = document.querySelector(".entry-list")
  const root = getArticleListScrollRoot()
  const rows = [...document.querySelectorAll(".article-card-grid-row")]
  const entryElements = [...document.querySelectorAll("[data-entry-id]")]
  const rootRect = root?.getBoundingClientRect()
  const rowRect = rows[0]?.getBoundingClientRect()
  const visibleEntry = entryElements.find((entry) => {
    const rect = entry.getBoundingClientRect()
    return rect.bottom > (rootRect?.top ?? 0) && rect.top < (rootRect?.bottom ?? 0)
  })
  const visibleEntryRect = visibleEntry?.getBoundingClientRect()
  const layout = settingsState.get().articleListLayout
  const count = contentState.get().entries.length
  const columns = Number.parseInt(
    rows[0]?.style.getPropertyValue("--article-card-grid-columns") ?? "1",
    10,
  )

  return {
    articleListLayout: layout,
    cardColumnCount: columns,
    filteredEntriesLength: count,
    listRect: list
      ? { width: list.getBoundingClientRect().width, height: list.getBoundingClientRect().height }
      : null,
    noHorizontalOverflow:
      document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    rootScrollWidth: root?.scrollWidth ?? 0,
    rootClientWidth: root?.clientWidth ?? 0,
    rowCount: rows.length,
    rowRect: rowRect ? { width: rowRect.width, height: rowRect.height } : null,
    scrollHeight: root?.scrollHeight ?? 0,
    scrollTop: root?.scrollTop ?? 0,
    clientHeight: root?.clientHeight ?? 0,
    virtualItemsLength: layout === "card" ? Math.ceil(count / Math.max(columns, 1)) : count,
    virtualizerKey: `${layout === "card" ? `card-${columns}` : layout}-root-0`,
    entryCount: entryElements.length,
    visibleAnchor: visibleEntry
      ? {
          entryId: visibleEntry.dataset.entryId,
          offset: visibleEntryRect.top - rootRect.top,
        }
      : null,
    viewport: { width: innerWidth, height: innerHeight },
  }
}

const setScrollDepth = async (fraction) => {
  const root = getArticleListScrollRoot()
  let maxScrollTop = 0
  if (root) {
    maxScrollTop = Math.max(0, root.scrollHeight - root.clientHeight)
    if (fraction === 0 && maxScrollTop > 0) {
      root.scrollTop = 1
      await settleLayout()
    }
    root.scrollTop = maxScrollTop * fraction
  }
  await settleLayout()
  return { maxScrollTop, scrollTop: root?.scrollTop ?? 0 }
}

const TestHarness = () => {
  const entryListRef = useRef(null)
  const cardsRef = useRef(null)
  const currentLayout = useStore(settingsState, { keys: ["articleListLayout"] }).articleListLayout
  const [testState, setTestState] = useState({ running: false, results: [] })

  const runSuite = async () => {
    setTestState({ running: true, results: [] })
    const results = []

    for (const count of TEST_COUNTS) {
      setFixtureCount(count)
      for (const depth of TEST_DEPTHS) {
        for (const transition of TEST_TRANSITIONS) {
          const [startLayout, ...nextLayouts] = transition
          setFixtureLayout(startLayout)
          await settleLayout()
          const scrollSetup = await setScrollDepth(depth.fraction)
          const initial = getMetrics()
          let anchorStillRendered = Boolean(initial.visibleAnchor)
          let anchorOffsetDelta = null
          let anchorIndexDelta = null
          let cardResult = null

          for (const layout of nextLayouts) {
            setFixtureLayout(layout)
            await settleLayout()
            const metrics = getMetrics()
            if (initial.visibleAnchor) {
              const anchorElement = document.querySelector(
                `[data-entry-id="${CSS.escape(initial.visibleAnchor.entryId)}"]`,
              )
              const rootElement = getArticleListScrollRoot()
              const anchorRect = anchorElement?.getBoundingClientRect()
              const rootRect = rootElement?.getBoundingClientRect()
              anchorStillRendered = Boolean(
                anchorRect &&
                rootRect &&
                anchorRect.bottom > rootRect.top &&
                anchorRect.top < rootRect.bottom,
              )
              anchorOffsetDelta = anchorStillRendered
                ? Math.abs(anchorRect.top - rootRect.top - initial.visibleAnchor.offset)
                : null
            }
            if (layout === "card") {
              cardResult = {
                ...metrics,
                cardRowsPass: metrics.rowCount > 0,
                cardEntriesPass: metrics.entryCount > 0,
                cardContentWidthPass: metrics.listRect?.width > 40 && metrics.rowRect?.width > 0,
              }
            }
          }

          results.push({
            anchorStillRendered,
            anchorOffsetDelta,
            scrollDepthPass:
              depth.fraction === 0
                ? initial.scrollTop <= 1
                : scrollSetup.maxScrollTop > 1 && initial.scrollTop > 1,
            anchorIndexDelta:
              initial.visibleAnchor && getMetrics().visibleAnchor
                ? Math.abs(
                    Number(getMetrics().visibleAnchor.entryId) -
                      Number(initial.visibleAnchor.entryId),
                  )
                : null,
            initialAnchor: initial.visibleAnchor,
            finalAnchor: getMetrics().visibleAnchor,
            backToListPositionPass:
              depth.fraction === 0 ? getMetrics().scrollTop <= 1 : getMetrics().scrollTop > 1,
            count,
            depth: depth.label,
            noHorizontalOverflowPass: getMetrics().noHorizontalOverflow,
            transition: transition.join(" → "),
            cardResult,
          })
          setFixtureLayout("column")
          await settleLayout()
        }
      }
    }

    setTestState({ running: false, results })
  }

  const passCount = testState.results.filter(
    ({ backToListPositionPass, cardResult, noHorizontalOverflowPass, scrollDepthPass }) =>
      cardResult?.cardRowsPass &&
      cardResult?.cardEntriesPass &&
      cardResult?.cardContentWidthPass &&
      cardResult.rootScrollWidth <= cardResult.rootClientWidth &&
      scrollDepthPass &&
      backToListPositionPass &&
      noHorizontalOverflowPass,
  ).length

  return (
    <MemoryRouter>
      <div className="layout-test-shell">
        <header className="layout-test-toolbar">
          <strong>ReactFlux card runtime regression</strong>
          <span>Layout: {currentLayout}</span>
          <button onClick={() => setFixtureLayout("column")}>Column</button>
          <button onClick={() => setFixtureLayout("list")}>List</button>
          <button onClick={() => setFixtureLayout("card")}>Card</button>
          <button disabled={testState.running} onClick={() => void runSuite()}>
            {testState.running ? "Running suite…" : "Run transition suite"}
          </button>
          {!testState.running && testState.results.length > 0 && (
            <span data-testid="suite-summary">
              {passCount}/{testState.results.length} transition cases passed
            </span>
          )}
        </header>
        <main className="layout-test-content entry-col entry-col-full-width">
          <div className="layout-test-search-bar" />
          <ArticleList
            ref={entryListRef}
            cardsRef={cardsRef}
            getEntries={() => Promise.resolve([])}
            handleEntryClick={() => {}}
            retryArticleList={() => Promise.resolve()}
          />
        </main>
        <pre className="layout-test-results" data-testid="suite-results">
          {JSON.stringify(testState.results, null, 2)}
        </pre>
      </div>
    </MemoryRouter>
  )
}

export default TestHarness

settingsState.set({
  ...getDefaultSettings(),
  articleListLayout: "column",
  enableContextMenu: false,
  markReadBy: "manually",
  markReadOnScroll: false,
  openSourceOnCardClick: false,
  showFeedIcon: false,
})
contentState.set({ ...contentState.get(), activeContent: null, loadMoreVisible: false })
dataState.set({
  ...dataState.get(),
  feedsData: [
    {
      category: { id: 1, title: "Runtime tests" },
      feed_url: "https://example.invalid/feed.xml",
      icon: { icon_id: 0 },
      id: 1,
      site_url: "https://example.invalid",
      title: "Runtime test feed",
    },
  ],
  hasIntegrations: false,
  loadState: {
    ...dataState.get().loadState,
    catalog: { ...dataState.get().loadState.catalog, hasSnapshot: true },
  },
})
polyglotState.setKey("polyglot", new Polyglot({ phrases: englishPhrases, locale: "en-US" }))
setFixtureCount(TEST_COUNTS[0])

const style = document.createElement("style")
style.textContent = `
  html, body, #root { width: 100%; height: 100%; margin: 0; overflow: hidden; }
  .layout-test-shell { display: flex; flex-direction: column; width: 100%; height: 100%; }
  .layout-test-toolbar { display: flex; flex: 0 0 52px; align-items: center; gap: 8px; padding: 0 12px; white-space: nowrap; overflow: auto; }
  .layout-test-toolbar button { flex: 0 0 auto; }
  .layout-test-content { position: relative; display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }
  .layout-test-search-bar { flex: 0 0 44px; }
  .layout-test-results { position: fixed; z-index: 20; right: 0; bottom: 0; width: min(480px, 45vw); max-height: 35vh; overflow: auto; margin: 0; padding: 8px; background: #111d; color: #fff; font: 10px/1.3 monospace; pointer-events: none; }
`
document.head.append(style)

const root =
  globalThis.__phase2bLayoutTestRoot ??
  (globalThis.__phase2bLayoutTestRoot = ReactDOM.createRoot(document.querySelector("#root")))
root.render(<TestHarness />)

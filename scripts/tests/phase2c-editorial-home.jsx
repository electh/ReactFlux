// Local fixtures exercise production routes, Home/Content, reader, context, manager and brand.
import "@arco-design/web-react/es/_util/react-19-adapter"
import Polyglot from "node-polyglot"
import React, { useState } from "react"
import { createRoot } from "react-dom/client"
import { createMemoryRouter, Outlet, RouterProvider } from "react-router"

import {
  emptyHomeFixtures,
  fixtureFeed,
  highlightFixtures,
  paginationEntries,
  phase2cEditorialHomeMatrix,
  routeEntries,
} from "./fixtures/phase2c-editorial-home"

import apiClient from "@/apis/ofetch"
import { ContextProvider } from "@/components/Content/ContentContext"
import HomePageManager from "@/components/HomePageManager"
import Sidebar from "@/components/Sidebar/Sidebar"
import AppDataContext from "@/contexts/app-data-context"
import DesktopSidebarContext from "@/contexts/desktop-sidebar-context"
import useContentContext from "@/hooks/useContentContext"
import useEntryActions, {
  markEntriesAsRead,
  updateEntriesStatusOptimistically,
} from "@/hooks/useEntryActions"
import { polyglotState } from "@/hooks/useLanguage"
import englishPhrases from "@/locales/en-US.json"
import productionRouter from "@/routes"
import "@/liquid-glass.css"
import { authState } from "@/store/authState"
import { contentState, resetContent } from "@/store/contentState"
import {
  commitIdentityData,
  dataState,
  resetData,
  setDataResourceLoadState,
} from "@/store/dataState"
import { feedIconsState } from "@/store/feedIconsState"
import { setCurrentHomeTarget } from "@/store/homePageState"
import { getDefaultSettings, settingsState } from "@/store/settingsState"
import { subscribeEntryStatusMutationEvents } from "@/utils/entry-status-mutation-events"
import {
  createHomeEditorialSession,
  projectHomeSession,
  transitionHomeSession,
} from "@/utils/home-editorial-session"
import "@arco-design/web-react/dist/css/arco.css"
import "simplebar-react/dist/simplebar.min.css"
import "@/index.css"
import "@/theme.css"
import "./phase2c-editorial-home.css"

// Reuse the registered production content routes, replacing only auth/app bootstrap boundaries.
const contentRoutes = productionRouter.routes[1].children.at(0).children
productionRouter.dispose()
const fixtureAuth = {
  server: "https://example.invalid",
  token: "fixture",
  username: "",
  password: "",
}
const requests = []
let fixtureEntries = routeEntries
let fixtureTotal = 2
let paginationPages = null
let deferredPagination = null
let deferredArticleQuery = null
let failPagination = false
let emptyPagePagination = false
let initialHomeQueryServed = false
let failStatusMutation = false
let starMutationRequests = 0
let statusMutationRequests = 0
let deferredFirstStatusMutation = null
let rejectStatusMutationCall = null
let failCount = false
let deferredCount = null
let unloadedStatus = "read"
let articleFailure = false
let identityRetries = 0
let router
const tokens = new WeakMap()
let nextToken = 0
const instanceToken = (node) => {
  if (!tokens.has(node)) {
    tokens.set(node, ++nextToken)
  }
  return tokens.get(node)
}

apiClient.get = async (url) => {
  requests.push(url)
  if (url.startsWith("/v1/entries?")) {
    if (articleFailure) {
      throw new Error("Expected local article query failure")
    }
    const params = new URL(url, "https://fixture.invalid").searchParams
    if (params.get("limit") === "1" && failCount) {
      throw new Error("Expected local canonical count failure")
    }
    if (params.get("limit") === "1" && deferredCount) {
      return deferredCount.promise
    }
    const isEmptyHomePageAppend = emptyPagePagination && initialHomeQueryServed
    if ((params.has("published_before") || isEmptyHomePageAppend) && paginationPages) {
      if (failPagination) {
        throw new Error("Expected local pagination failure")
      }
      if (deferredPagination) {
        await deferredPagination.promise
      }
      const page = paginationPages.shift()
      assert(page, "Unexpected extra Home page request")
      return { entries: page, total: fixtureTotal }
    }
    if (!params.has("published_before") && deferredArticleQuery) {
      await deferredArticleQuery.promise
      deferredArticleQuery = null
    }
    if (emptyPagePagination) {
      initialHomeQueryServed = true
    }
    return { entries: fixtureEntries, total: fixtureTotal }
  }
  const id = Number(url.match(/^\/v1\/entries\/(\d+)$/)?.[1])
  const entry = fixtureEntries.find((candidate) => candidate.id === id)
  if (entry) {
    return entry
  }
  throw new Error(`Unexpected local fixture GET: ${url}`)
}
apiClient.put = async (url, body) => {
  if (url === "/v1/entries" && typeof body?.starred === "boolean") {
    starMutationRequests += 1
    fixtureEntries = fixtureEntries.map((entry) =>
      body.entry_ids.includes(entry.id) ? { ...entry, starred: body.starred } : entry,
    )
    return
  }
  if (url !== "/v1/entries" || !body?.status) {
    throw new Error("Unexpected mutation in routing fixture")
  }
  const mutationCall = ++statusMutationRequests
  if (mutationCall === 1 && deferredFirstStatusMutation) {
    await deferredFirstStatusMutation.promise
  }
  if (failStatusMutation || mutationCall === rejectStatusMutationCall) {
    throw new Error("Expected local status mutation failure")
  }
  for (const id of body.entry_ids) {
    const loaded = fixtureEntries.find((entry) => entry.id === id)
    const previous = loaded?.status ?? (id === 303 ? unloadedStatus : null)
    if (previous && previous !== body.status) {
      fixtureTotal += body.status === "unread" ? 1 : -1
    }
    if (loaded) {
      fixtureEntries = fixtureEntries.map((entry) =>
        entry.id === id ? { ...entry, status: body.status } : entry,
      )
    }
    if (id === 303) {
      unloadedStatus = body.status
    }
  }
}
polyglotState.setKey("polyglot", new Polyglot({ phrases: englishPhrases, locale: "en-US" }))
const appData = {
  refreshIdentity: async () => {
    identityRetries += 1
    commitIdentityData({ id: 1, username: "fixture" })
  },
  refreshFeedData: async () => {},
  refreshCounts: async () => {},
}

const FixtureReaderControls = () => {
  const { handleEntryClick } = useContentContext()
  const { handleToggleStatus } = useEntryActions()
  return (
    <>
      <button
        aria-label="Open local Home article"
        onClick={() => handleEntryClick(contentState.get().entries[0])}
      >
        Open fixture article
      </button>
      <button
        aria-label="Fixture card status action"
        onClick={() => handleToggleStatus(contentState.get().entries[0])}
      >
        Card status action
      </button>
      <button
        aria-label="Fixture scroll read action"
        onClick={() => markEntriesAsRead([contentState.get().entries[0]])}
      >
        Scroll read action
      </button>
    </>
  )
}

const FixtureFrame = () => (
  <AppDataContext.Provider value={appData}>
    <DesktopSidebarContext.Provider
      value={{
        isDesktopSidebarCollapsed: false,
        collapseButtonRef: { current: null },
        detailCloseButtonRef: { current: null },
        reopenButtonRef: { current: null },
        collapseDesktopSidebar: () => {},
        expandDesktopSidebar: () => {},
      }}
    >
      <HomePageManager />
      <div className="harness-stage">
        <Sidebar />
        <div className="harness-content">
          <ContextProvider>
            <div className="harness-fixture-controls">
              <FixtureReaderControls />
            </div>
            <Outlet />
          </ContextProvider>
        </div>
      </div>
    </DesktopSidebarContext.Provider>
  </AppDataContext.Provider>
)

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message)
  }
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 70))
const waitFor = async (predicate, message) => {
  for (let attempt = 0; attempt < 70; attempt += 1) {
    if (predicate()) {
      return
    }
    await settle()
  }
  throw new Error(message)
}
const navigate = async (destination) => {
  await router.navigate(destination)
  await settle()
}
const homeRoot = () => document.querySelector(".home-editorial")
const readerIs = (id) =>
  contentState.get().activeContent?.id === id &&
  document.querySelector(".article-container .article-body")?.textContent.includes(`article ${id}`)
const clickLabel = (label) => {
  const button = [...document.querySelectorAll("button")].find(
    (node) => node.getAttribute("aria-label") === label || node.textContent.trim() === label,
  )
  assert(button && !button.disabled, `Missing enabled ${label} action`)
  button.click()
}

const cards = () => [...document.querySelectorAll(".home-highlights .article-entry")]
const ids = () => cards().map((card) => Number(card.dataset.entryId))
const recentIds = () =>
  [...document.querySelectorAll(".home-recent .article-entry")].map((node) =>
    Number(node.dataset.entryId),
  )
const listRequests = () => requests.filter((url) => url.startsWith("/v1/entries?"))
const scrollRoot = () =>
  homeRoot()?.querySelector(".simplebar-content-wrapper, .adaptive-scroll-area-native")
const sentinels = () => [...document.querySelectorAll(".home-editorial .load-more-container")]
const MATRIX_RUNS_STORAGE_KEY = "phase2c-editorial-home-task10-matrix-runs-v1"
const matrixPairId = (viewport, theme) => `${viewport.width}x${viewport.height}:${theme}`
const readMatrixRuns = () => {
  try {
    return JSON.parse(sessionStorage.getItem(MATRIX_RUNS_STORAGE_KEY) ?? "{}")
  } catch {
    return {}
  }
}
const resetHarness = () => {
  globalThis.sessionStorage.removeItem(MATRIX_RUNS_STORAGE_KEY)
  globalThis.location.reload()
}
const captureHomeHarnessMetrics = (theme) => {
  const state = contentState.get()
  const home = homeRoot()
  const root = scrollRoot()
  const renderedEntryIds = [...document.querySelectorAll(".article-entry[data-entry-id]")].map(
    (node) => Number(node.dataset.entryId),
  )
  const countQueries = listRequests()
    .map((request) => Object.fromEntries(new URL(request, "https://fixture.invalid").searchParams))
    .filter((params) => params.limit === "1")
  const recentRows = [...document.querySelectorAll(".home-recent .article-card-grid-row")]
  const recentColumns = recentRows.map((row) => {
    const value = Number.parseInt(row.style.getPropertyValue("--article-card-grid-columns"), 10)
    return Number.isFinite(value)
      ? value
      : getComputedStyle(row).gridTemplateColumns.split(" ").filter(Boolean).length
  })
  const scrollRect = root?.getBoundingClientRect()
  return {
    viewport: { width: innerWidth, height: innerHeight },
    theme,
    document: {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    },
    sectionOrder: [...(home?.querySelectorAll("section[aria-label]") ?? [])].map((section) =>
      section.getAttribute("aria-label"),
    ),
    duplicateEntryIds: renderedEntryIds.length - new Set(renderedEntryIds).size,
    domCounts: {
      highlights: cards().length,
      recent: recentIds().length,
      entries: renderedEntryIds.length,
      sentinels: sentinels().length,
    },
    recentColumns,
    countQueryVisibility: countQueries,
    loadedEligibleUnreadIds: new Set(
      state.entries.filter((entry) => entry.status === "unread").map((entry) => entry.id),
    ).size,
    pageSize: settingsState.get().pageSize,
    loadMoreVisible: state.loadMoreVisible,
    listState: { total: state.total, isArticleListReady: state.isArticleListReady },
    scrollRoot: root
      ? {
          clientWidth: root.clientWidth,
          clientHeight: root.clientHeight,
          scrollWidth: root.scrollWidth,
          scrollHeight: root.scrollHeight,
          scrollTop: Math.round(root.scrollTop),
          bounds: scrollRect
            ? {
                x: Math.round(scrollRect.x),
                y: Math.round(scrollRect.y),
                width: Math.round(scrollRect.width),
                height: Math.round(scrollRect.height),
              }
            : null,
        }
      : null,
  }
}
const loadNextPage = async (loadedCount) => {
  const root = scrollRoot()
  assert(root && sentinels().length === 1, "Expected one Home pagination sentinel")
  root.scrollTop = root.scrollHeight
  sentinels()[0].scrollIntoView({ block: "end" })
  deferredPagination?.resolve()
  deferredPagination = null
  root.dispatchEvent(new Event("scroll"))
  await waitFor(
    () => contentState.get().entries.length > loadedCount,
    "Home sentinel did not append the next page",
  )
  await settle()
}
const clickMenu = (label) => {
  const item = [...document.querySelectorAll('.mobile-action-menu [role="menuitem"]')].find(
    (node) => node.textContent.includes(label),
  )
  assert(item, `Missing existing menu action ${label}`)
  item.click()
}

const openMenu = async (id) => {
  const card = cards().find((node) => Number(node.dataset.entryId) === id)
  assert(card, `Missing Highlight ${id}`)
  card.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 350,
      clientY: 250,
    }),
  )
  await waitFor(
    () => document.querySelector(".mobile-action-menu"),
    "Existing ArticleEntry menu did not open",
  )
}

const Harness = () => {
  const [probe, setProbe] = useState(null)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState([])
  const [selectedTheme, setSelectedTheme] = useState(() =>
    new URLSearchParams(globalThis.location.search).get("theme") === "dark" ? "dark" : "light",
  )
  const [matrixRuns, setMatrixRuns] = useState(readMatrixRuns)
  const mount = async (
    path = "/",
    {
      identity = "ready",
      queryError = false,
      catalogError = false,
      entries = routeEntries,
      total = 2,
      markReadBy = "manually",
      pageSize = getDefaultSettings().pageSize,
      pages = null,
      deferInitial = false,
      emptyPagePagination: nextEmptyPagePagination = false,
      layout = getDefaultSettings().articleListLayout,
      enableSwipeGesture = getDefaultSettings().enableSwipeGesture,
      orderBy = getDefaultSettings().orderBy,
      orderDirection = getDefaultSettings().orderDirection,
    } = {},
  ) => {
    setProbe(null)
    await settle()
    router?.dispose()
    resetContent()
    resetData()
    requests.length = 0
    identityRetries = 0
    articleFailure = queryError
    fixtureEntries = entries.map((entry) => ({ ...entry }))
    fixtureTotal = total
    paginationPages = pages?.map((page) => page.map((entry) => ({ ...entry }))) ?? null
    deferredPagination = pages?.length
      ? (() => {
          let release
          const promise = new Promise((resolve) => {
            release = resolve
          })
          return { promise, resolve: release }
        })()
      : null
    deferredArticleQuery = deferInitial
      ? (() => {
          let release
          const promise = new Promise((resolve) => {
            release = resolve
          })
          return { promise, resolve: release }
        })()
      : null
    failPagination = false
    emptyPagePagination = nextEmptyPagePagination
    initialHomeQueryServed = false
    failStatusMutation = false
    starMutationRequests = 0
    statusMutationRequests = 0
    deferredFirstStatusMutation = null
    rejectStatusMutationCall = null
    failCount = false
    deferredCount = null
    unloadedStatus = "read"
    authState.set(fixtureAuth)
    settingsState.set({
      ...getDefaultSettings(),
      markReadBy,
      pageSize,
      articleListLayout: layout,
      orderBy,
      orderDirection,
      removeDuplicates: "none",
      enableContextMenu: true,
      showFeedIcon: true,
      enableSwipeGesture,
    })
    if (identity === "ready") {
      commitIdentityData({ id: 1, username: "fixture" })
    } else {
      setDataResourceLoadState("identity", {
        activity: identity === "loading" ? "loading" : "idle",
        error: identity === "error" ? new Error("Expected local identity failure") : null,
      })
    }
    feedIconsState.setKey(991, {
      height: 16,
      width: 16,
      url: `${globalThis.location.origin}/default-feed-icon.png`,
    })
    dataState.setKey("feedsData", [fixtureFeed])
    dataState.setKey("categoriesData", [fixtureFeed.category])
    setDataResourceLoadState("catalog", {
      error: catalogError ? new Error("Expected local catalog failure") : null,
    })
    router = createMemoryRouter(
      [
        { Component: FixtureFrame, children: contentRoutes },
        { path: "/login", element: <p>Local login destination</p> },
      ],
      { initialEntries: [path] },
    )
    setProbe({ router, key: performance.now() })
    await waitFor(() => router.state.initialized, "Content route did not initialize")
    await settle()
  }
  const scenarios = [
    [
      "HOME_ROUTE_ROOT_AND_READER_RETURN",
      async () => {
        await mount()
        assert(router.state.location.pathname === "/" && homeRoot(), "Root did not render Home")
        await waitFor(() => contentState.get().isArticleListReady, "Home list did not load")
        clickLabel("Open local Home article")
        await waitFor(() => readerIs(101), "Root reader 101 did not render")
        assert(
          router.state.location.pathname === "/entry/101",
          "Home open action joined the wrong reader URL",
        )
        clickLabel(englishPhrases.article_card.close_tooltip)
        await waitFor(
          () =>
            router.state.location.pathname === "/" &&
            !contentState.get().activeContent &&
            !document.querySelector(".article-container"),
          "Reader close did not return to slash",
        )
        await navigate(-1)
        await waitFor(() => readerIs(101), "History Back did not reopen 101")
        await navigate(1)
        assert(
          router.state.location.pathname === "/" && !contentState.get().activeContent,
          "History Forward did not close reader",
        )
      },
    ],
    [
      "HOME_READER_PARAM_BRIDGE",
      async () => {
        await mount("/entry/101", { enableSwipeGesture: false })
        await waitFor(() => readerIs(101), "Home parent did not forward child ID 101 into Content")
        await waitFor(() => contentState.get().isArticleListReady, "Reader list did not load")
        clickLabel(englishPhrases.article_card.next_tooltip)
        await waitFor(() => readerIs(202), "Next reader action did not display 202")
        assert(
          router.state.location.pathname === "/entry/202",
          "Next reader action lost Home origin",
        )
        clickLabel(englishPhrases.article_card.previous_tooltip)
        await waitFor(() => readerIs(101), "Previous reader action did not display 101")
        assert(
          router.state.location.pathname === "/entry/101",
          "Previous reader action lost Home origin",
        )
        await mount("/entry/202", { enableSwipeGesture: false })
        await waitFor(() => readerIs(202), "Direct root reader 202 did not render")
        assert(router.state.location.pathname === "/entry/202", "Direct reader URL changed")
      },
    ],
    [
      "HOME_PARENT_MOUNT_PRESERVATION",
      async () => {
        await mount()
        const parent = homeRoot()
        assert(parent, "Home session parent missing")
        const token = instanceToken(parent)
        await waitFor(
          () => contentState.get().isArticleListReady,
          "Home initial query did not complete",
        )
        const initialQueries = requests.filter((url) => url.startsWith("/v1/entries?")).length
        const scrollRoot = parent.querySelector(".simplebar-content-wrapper, [data-native-scroll]")
        assert(scrollRoot, "Home scroll root missing")
        await navigate("/entry/101")
        await waitFor(() => readerIs(101), "Mounted Home reader did not render")
        assert(
          homeRoot() === parent && instanceToken(homeRoot()) === token,
          "Reader navigation replaced Home session instance",
        )
        await navigate("/")
        assert(
          homeRoot() === parent && instanceToken(homeRoot()) === token,
          "Return replaced Home session instance",
        )
        assert(
          parent.querySelector(".simplebar-content-wrapper, [data-native-scroll]") === scrollRoot,
          "Return replaced Home scroll root",
        )
        assert(
          requests.filter((url) => url.startsWith("/v1/entries?")).length === initialQueries,
          "Reader visit implicitly refreshed the Home query",
        )
      },
    ],
    [
      "HOME_LOGO_ROOT",
      async () => {
        await mount("/entry/101")
        setCurrentHomeTarget({ type: "view", id: "today" })
        await settle()
        const brand = document.querySelector(".home-brand")
        assert(brand && !brand.disabled, "Home brand unavailable")
        brand.click()
        await waitFor(
          () => router.state.location.pathname === "/",
          "Home brand followed post-login preference instead of root",
        )
      },
    ],
    [
      "HOME_IDENTITY_FAILURE_RECOVERY",
      async () => {
        await mount("/", { identity: "loading" })
        assert(
          document.querySelector(".route-loading-state"),
          "Home identity loading state missing",
        )
        assert(requests.length === 0, "Home queried before identity readiness")
        for (const path of ["/", "/entry/202"]) {
          await mount(path, { identity: "error" })
          assert(
            router.state.location.pathname === path,
            "Identity failure redirected direct route",
          )
          assert(requests.length === 0 && !homeRoot(), "Identity failure started Home query")
          clickLabel(englishPhrases.actions.retry)
          await waitFor(
            () => identityRetries === 1 && homeRoot(),
            "Identity retry did not recover Home",
          )
          await mount(path, { identity: "error" })
          clickLabel(englishPhrases.sidebar.logout)
          await waitFor(
            () => router.state.location.pathname === "/login",
            "Identity logout unavailable",
          )
          assert(router.state.location.state?.from === path, "Logout lost Home login return path")
          assert(
            authState.get().server === "" && dataState.get().currentUser === null,
            "Logout did not clear session",
          )
        }
        await mount("/entry/202", { queryError: true, catalogError: true })
        await waitFor(() => contentState.get().articleListError, "Article-query failure missing")
        assert(
          router.state.location.pathname === "/entry/202",
          "Article-query error changed direct route",
        )
        assert(
          !document.querySelector(".home-identity-notice"),
          "Article-query error became identity recovery",
        )
        assert(
          homeRoot() && requests.some((url) => url.startsWith("/v1/entries?")),
          "Catalog failure blocked canonical Home query",
        )
      },
    ],
    [
      "HOME_LAST_READ_TRANSITIONS_TO_TUDO_EM_DIA",
      async () => {
        await mount("/", { entries: routeEntries.slice(0, 1), total: 1 })
        await waitFor(() => contentState.get().isArticleListReady, "Initial Home page missing")
        updateEntriesStatusOptimistically([contentState.get().entries[0]], "read")
        await waitFor(
          () => contentState.get().total === 0,
          "Confirmed last read did not reconcile canonical zero",
        )
        assert(contentState.get().loadMoreVisible === false, "Zero total retained pagination")
        assert(
          requests.some(
            (url) => new URL(url, "https://fixture.invalid").searchParams.get("limit") === "1",
          ),
          "Canonical count request missing",
        )
      },
    ],
    [
      "HOME_READ_FAILURE_DOES_NOT_ZERO_TOTAL",
      async () => {
        await mount("/", { entries: routeEntries.slice(0, 1), total: 1 })
        await waitFor(() => contentState.get().isArticleListReady, "Initial Home page missing")
        failStatusMutation = true
        updateEntriesStatusOptimistically([contentState.get().entries[0]], "read")
        await waitFor(
          () => contentState.get().entries[0]?.status === "unread",
          "Rejected read did not roll back",
        )
        await new Promise((resolve) => setTimeout(resolve, 220))
        assert(contentState.get().total === 1, "Rejected read replaced valid total")
        assert(
          !requests.some(
            (url) => new URL(url, "https://fixture.invalid").searchParams.get("limit") === "1",
          ),
          "Rejected read issued canonical count",
        )
      },
    ],
    [
      "HOME_COUNT_FAILURE_PRESERVES_TOTAL_AND_PAGINATION",
      async () => {
        await mount("/", { entries: paginationEntries(20), total: 21, pageSize: 20 })
        await waitFor(() => contentState.get().isArticleListReady, "Initial Home page missing")
        assert(contentState.get().loadMoreVisible, "Fixture did not start with pagination")
        const initialRequests = listRequests().length
        failCount = true
        updateEntriesStatusOptimistically([contentState.get().entries[0]], "read")
        await waitFor(() => listRequests().length > initialRequests, "Failed count request missing")
        await settle()
        assert(
          contentState.get().total === 21 && contentState.get().loadMoreVisible,
          "Failed count replaced valid total or pagination",
        )
      },
    ],
    [
      "HOME_MARK_UNREAD_RECONCILES_TOTAL",
      async () => {
        await mount()
        await waitFor(() => contentState.get().isArticleListReady, "Initial Home page missing")
        updateEntriesStatusOptimistically([contentState.get().entries[0]], "read")
        await waitFor(() => contentState.get().total === 1, "Read did not settle")
        updateEntriesStatusOptimistically([contentState.get().entries[0]], "unread")
        await waitFor(() => contentState.get().total === 2, "Unread did not reconcile total")
      },
    ],
    [
      "HOME_REJECTED_UNREAD_REVERSAL_RECONCILES_CONFIRMED_READ",
      async () => {
        const entries = [
          routeEntries[0],
          routeEntries[1],
          { ...routeEntries[0], id: 303, title: "Third loaded article" },
          { ...routeEntries[0], id: 404, title: "Loaded backfill article" },
        ]
        await mount("/", { entries, total: 4 })
        await waitFor(() => contentState.get().isArticleListReady, "Initial Home page missing")
        let releaseFirstMutation
        deferredFirstStatusMutation = {
          promise: new Promise((resolve) => {
            releaseFirstMutation = resolve
          }),
        }
        rejectStatusMutationCall = 2
        let observedSession = createHomeEditorialSession({
          requestKey: "fixture",
          sessionRevision: dataState.get().sessionRevision,
          entries: contentState.get().entries,
        })
        const unsubscribe = subscribeEntryStatusMutationEvents((statusEvent) => {
          observedSession = transitionHomeSession(
            observedSession,
            statusEvent,
            contentState.get().entries,
          )
        })
        try {
          updateEntriesStatusOptimistically([contentState.get().entries[0]], "read")
          await waitFor(() => statusMutationRequests === 1, "Read request did not start")
          updateEntriesStatusOptimistically([contentState.get().entries[0]], "unread")
          assert(
            JSON.stringify(
              projectHomeSession(observedSession, contentState.get().entries).highlightIds,
            ) === JSON.stringify([101, 202, 303]),
            "Queued reversal changed Highlight placement before settlement",
          )
          releaseFirstMutation()
          await waitFor(() => statusMutationRequests === 2, "Queued unread request did not start")
          await waitFor(
            () =>
              contentState.get().total === 3 &&
              contentState.get().entries.find(({ id }) => id === 101)?.status === "read" &&
              observedSession.highlightIds[0] === 404,
            "Rejected reversal did not reconcile the confirmed read",
          )
          assert(
            JSON.stringify(
              projectHomeSession(observedSession, contentState.get().entries).highlightIds,
            ) === JSON.stringify([404, 202, 303]),
            "Confirmed read ID remained projected or displaced surviving Highlights",
          )
          assert(
            Object.keys(observedSession.pendingStatusById).length === 0 &&
              fixtureEntries.find(({ id }) => id === 101).status === "read" &&
              fixtureTotal === 3,
            "Rejected unread status or pending mutation survived",
          )
        } finally {
          unsubscribe()
          releaseFirstMutation()
        }
      },
    ],
    [
      "HOME_UNLOADED_MARK_UNREAD_REENABLES_PAGINATION",
      async () => {
        await mount("/", { entries: paginationEntries(20), total: 20, pageSize: 20 })
        await waitFor(() => contentState.get().isArticleListReady, "Initial Home page missing")
        const ids = contentState.get().entries.map(({ id }) => id)
        const requestCount = requests.length
        updateEntriesStatusOptimistically(
          [{ ...routeEntries[0], id: 303, status: "read" }],
          "unread",
        )
        await waitFor(
          () => contentState.get().total === 21,
          `Unread count did not grow: total=${contentState.get().total}, entries=${contentState.get().entries.length}, pageSize=${settingsState.get().pageSize}, requests=${requests.length}`,
        )
        assert(
          JSON.stringify(contentState.get().entries.map(({ id }) => id)) === JSON.stringify(ids),
          "Unloaded record was inserted",
        )
        assert(contentState.get().loadMoreVisible, "Unread count growth did not expose pagination")
        assert(
          requests.length === requestCount + 1 &&
            requests.every((url) => !url.includes("/v1/entries/303")),
          "Unloaded unread triggered an entry fetch",
        )
      },
    ],
    [
      "HOME_TOTAL_RECONCILIATION_STALE_SESSION_PROTECTED",
      async () => {
        await mount("/", { entries: paginationEntries(20), total: 20, pageSize: 20 })
        await waitFor(() => contentState.get().isArticleListReady, "Initial Home page missing")
        const initialRequests = listRequests().length
        let resolveCount
        deferredCount = {
          promise: new Promise((resolve) => {
            resolveCount = resolve
          }),
        }
        updateEntriesStatusOptimistically([contentState.get().entries[0]], "read")
        await waitFor(() => listRequests().length > initialRequests, "Deferred count did not start")
        fixtureTotal = 30
        settingsState.set({ ...settingsState.get(), showHiddenFeeds: true })
        await waitFor(
          () => contentState.get().isArticleListReady && contentState.get().total === 30,
          `New Home session did not commit: total=${contentState.get().total}, entries=${contentState.get().entries.length}, pageSize=${settingsState.get().pageSize}, ready=${contentState.get().isArticleListReady}, requests=${listRequests().length}`,
        )
        resolveCount({ entries: [], total: 0 })
        await settle()
        assert(
          contentState.get().total === 30 && contentState.get().loadMoreVisible,
          "Old count mutated newer Home session",
        )
      },
    ],
    [
      "HOME_READ_ON_VIEW_STATUS_PATH",
      async () => {
        await mount("/", { entries: routeEntries.slice(0, 1), total: 1, markReadBy: "view" })
        await waitFor(() => contentState.get().isArticleListReady, "Initial Home page missing")
        clickLabel("Open local Home article")
        await waitFor(
          () => contentState.get().total === 0,
          "Read-on-view did not use Home count path",
        )
      },
    ],
    [
      "HOME_READER_STATUS_ACTION_PATH",
      async () => {
        await mount("/", { entries: routeEntries.slice(0, 1), total: 1 })
        await waitFor(() => contentState.get().isArticleListReady, "Initial Home page missing")
        clickLabel("Open local Home article")
        await waitFor(() => readerIs(101), "Reader did not open")
        clickLabel(englishPhrases.article_card.mark_as_read_tooltip)
        await waitFor(
          () => contentState.get().total === 0,
          "Reader status action did not use Home count path",
        )
      },
    ],
    [
      "HOME_CARD_STATUS_ACTION_PATH",
      async () => {
        await mount("/", { entries: routeEntries.slice(0, 1), total: 1 })
        await waitFor(() => contentState.get().isArticleListReady, "Initial Home page missing")
        clickLabel("Fixture card status action")
        await waitFor(
          () => contentState.get().total === 0,
          "Card action path did not reconcile total",
        )
      },
    ],
    [
      "HOME_MARK_READ_ON_SCROLL_STATUS_PATH",
      async () => {
        await mount("/", { entries: routeEntries.slice(0, 1), total: 1 })
        await waitFor(() => contentState.get().isArticleListReady, "Initial Home page missing")
        clickLabel("Fixture scroll read action")
        await waitFor(
          () => contentState.get().total === 0,
          "Scroll read helper did not reconcile total",
        )
      },
    ],
  ]
  const mountHighlights = async (entries) => {
    await mount("/", {
      entries,
      total: new Set(entries.filter((entry) => entry.status === "unread").map((entry) => entry.id))
        .size,
    })
    await waitFor(
      () => homeRoot()?.getAttribute("aria-busy") === "false",
      "Home session did not become ready",
    )
  }
  const highlightScenarios = [
    [
      "HOME_PRIMARY_NEWEST",
      async () => {
        for (const entries of [highlightFixtures.image, highlightFixtures.textOnly]) {
          await mountHighlights(entries)
          assert(
            cards()[0]?.classList.contains("home-highlight-primary") && ids()[0] === 101,
            "Newest unread entry is not Primary",
          )
          if (entries === highlightFixtures.image) {
            assert(
              cards()[0].querySelector(".grid-card-cover"),
              "Image Primary lost the existing Grid media presenter",
            )
          }
        }
      },
    ],
    [
      "HOME_MAX_THREE_HIGHLIGHTS",
      async () => {
        for (const [entries, count] of [
          [highlightFixtures.image, 3],
          [highlightFixtures.two, 2],
          [highlightFixtures.one, 1],
        ]) {
          await mountHighlights(entries)
          assert(cards().length === count, `Expected ${count} real ArticleEntry Highlights`)
        }
      },
    ],
    [
      "HOME_PRIMARY_TEXT_ONLY",
      async () => {
        await mountHighlights(highlightFixtures.textOnly)
        const primary = cards()[0]
        assert(primary?.classList.contains("home-highlight-primary"), "Text-only Primary missing")
        assert(
          primary.querySelector(".grid-card-content-no-cover") &&
            !primary.querySelector(".grid-card-media, .grid-card-cover"),
          "Text-only Primary reserved empty media",
        )
        assert(
          primary.querySelector(".grid-card-copy")?.textContent.includes("Highlight article 101"),
          "Text-only Primary copy missing",
        )
      },
    ],
    [
      "HOME_SECONDARIES_BALANCED_ORDER",
      async () => {
        for (const entries of [highlightFixtures.image, highlightFixtures.shared]) {
          await mountHighlights(entries)
          assert(
            JSON.stringify(ids()) === "[101,202,303]",
            "Highlights lost deterministic slot order",
          )
          const [first, second] = cards().slice(1)
          assert(
            first.classList.contains("home-highlight-secondary-1") &&
              second.classList.contains("home-highlight-secondary-2"),
            "Secondary slot identities missing",
          )
          assert(
            first.closest(".home-highlight-secondaries") ===
              second.closest(".home-highlight-secondaries") &&
              Math.abs(first.getBoundingClientRect().width - second.getBoundingClientRect().width) <
                1,
            "Secondaries are not equivalent siblings",
          )
        }
        // No Recent candidate remains: Primary and then Secondary 1 must stay vacant.
        await mountHighlights(highlightFixtures.textOnly)
        await openMenu(101)
        clickMenu(englishPhrases.article_card.mark_as_read_tooltip)
        await waitFor(
          () => statusMutationRequests === 1 && contentState.get().total === 2,
          "Primary read did not settle",
        )
        await settle()
        assert(
          ids().join(",") === "202,303" &&
            !document.querySelector(".home-highlight-primary") &&
            cards()[0]?.classList.contains("home-highlight-secondary-1"),
          "Vacant Primary promoted a Secondary",
        )
        await openMenu(202)
        clickMenu(englishPhrases.article_card.mark_as_read_tooltip)
        await waitFor(
          () => statusMutationRequests === 2 && contentState.get().total === 1,
          "Secondary read did not settle",
        )
        await settle()
        assert(
          ids().join(",") === "303" && cards()[0]?.classList.contains("home-highlight-secondary-2"),
          "Vacant Secondary compacted surviving slot",
        )
      },
    ],
    [
      "HOME_HIGHLIGHT_ACTIONS",
      async () => {
        await mountHighlights(highlightFixtures.textOnly)
        const before = ids().join(",")
        assert(
          cards()[0]?.classList.contains("unread") &&
            cards()[1]?.querySelector(".grid-card-star")?.style.opacity === "1",
          "Existing unread/starred presentation missing",
        )
        cards()[0].focus()
        assert(document.activeElement === cards()[0], "Highlight is not keyboard focusable")
        await openMenu(101)
        clickMenu(englishPhrases.article_card.star_tooltip)
        await waitFor(
          () =>
            starMutationRequests === 1 &&
            contentState.get().entries.find((entry) => entry.id === 101)?.starred,
          "Highlight star action did not use existing mutation",
        )
        await settle()
        assert(
          ids().join(",") === before &&
            cards()[0]?.querySelector(".grid-card-star")?.style.opacity === "1",
          "Star recomposed Highlights or lost presenter status",
        )
        await openMenu(101)
        clickMenu(englishPhrases.article_card.unstar_tooltip)
        await waitFor(
          () =>
            starMutationRequests === 2 &&
            !contentState.get().entries.find((entry) => entry.id === 101)?.starred,
          "Highlight unstar action did not use existing mutation",
        )
        await settle()
        assert(
          ids().join(",") === before &&
            cards()[0]?.querySelector(".grid-card-star")?.style.opacity === "0",
          "Unstar recomposed Highlights or lost presenter status",
        )
        cards()[0].click()
        await waitFor(() => readerIs(101), "Actual Highlight activation did not open reader")
        assert(
          router.state.location.pathname === "/entry/101" &&
            cards()[0]?.classList.contains("selected"),
          "Existing Highlight selection/origin missing",
        )
        clickLabel(englishPhrases.article_card.close_tooltip)
        await waitFor(
          () => router.state.location.pathname === "/",
          "Highlight reader did not close to Home",
        )
        await openMenu(101)
        clickMenu(englishPhrases.article_card.mark_as_read_tooltip)
        await waitFor(
          () => contentState.get().total === 2,
          "Highlight read action did not use existing status mutation",
        )
        await settle()
        assert(!ids().includes(101), "Confirmed Highlight read did not remove card")
        await mountHighlights(highlightFixtures.image)
        const stage = document.querySelector(".harness-stage")
        const scrollSpacer = document.createElement("div")
        scrollSpacer.style.height = `${globalThis.innerHeight}px`
        document.body.append(scrollSpacer)
        stage.scrollIntoView({ block: "start" })
        stage.style.height = "320px"
        stage.style.minHeight = "0px"
        settingsState.set({ ...settingsState.get(), markReadOnScroll: true })
        try {
          await settle()
          const scrollRoot = homeRoot().querySelector(
            ".simplebar-content-wrapper, .adaptive-scroll-area-native",
          )
          assert(
            scrollRoot && scrollRoot.scrollHeight > scrollRoot.clientHeight,
            `Highlight scroll root missing: ${scrollRoot?.scrollHeight ?? "none"}/${scrollRoot?.clientHeight ?? "none"}`,
          )
          const primaryRect = homeRoot()
            .querySelector(".home-highlight-slot-primary")
            .getBoundingClientRect()
          const scrollRootRect = scrollRoot.getBoundingClientRect()
          const initiallyVisibleHeight = Math.max(
            0,
            Math.min(primaryRect.bottom, scrollRootRect.bottom, globalThis.innerHeight) -
              Math.max(primaryRect.top, scrollRootRect.top, 0),
          )
          assert(
            initiallyVisibleHeight / primaryRect.height >= 0.2,
            "Primary Highlight must be visible at the read observer threshold before scroll",
          )
          scrollRoot.scrollTop = scrollRoot.scrollHeight
          await waitFor(
            () => statusMutationRequests > 0 && !ids().includes(101),
            "Mounted Highlight read-on-scroll did not use existing observer/mutation",
          )
        } finally {
          settingsState.set({ ...settingsState.get(), markReadOnScroll: false })
          stage.style.height = ""
          stage.style.minHeight = ""
          scrollSpacer.remove()
        }
      },
    ],
    [
      "HOME_DEDUPE_BY_ENTRY_ID",
      async () => {
        await mountHighlights(highlightFixtures.image)
        assert(
          cards().length === 3 &&
            new Set(ids()).size === cards().length &&
            ids().join(",") === "101,202,303",
          "Duplicate ID rendered or an eligible Highlight was missing",
        )
        await mountHighlights(highlightFixtures.shared)
        assert(
          ids().join(",") === "101,202,303",
          "Shared feed/category incorrectly deduped distinct IDs",
        )
      },
    ],
  ]
  const mountPagination = async (count, { total = count + 1000, pages = [] } = {}) => {
    await mount("/", { entries: paginationEntries(count), total, pageSize: count, pages })
    await waitFor(
      () => homeRoot()?.getAttribute("aria-busy") === "false",
      "Home pagination session did not become ready",
    )
  }
  const recentScenarios = [
    [
      "HOME_RECENT_GRID",
      async () => {
        for (const count of [3, 20, 250]) {
          await mountPagination(count)
          assert(ids().join(",") === "10000,10001,10002", "Initial Highlights changed")
          assert(
            recentIds().join(",") ===
              paginationEntries(count)
                .slice(3)
                .map(({ id }) => id)
                .join(","),
            `Recent lost canonical order at ${count} loaded records`,
          )
          assert(sentinels().length === 1, "Home composition must own one sentinel")
          assert(
            [...document.querySelectorAll(".home-recent .article-entry")].every((node) =>
              node.classList.contains("grid-card-wrapper"),
            ),
            "Recent did not reuse the existing Grid card presenter",
          )
          const recent = homeRoot().querySelector(".home-recent")
          assert(
            homeRoot().querySelector(".home-highlights").compareDocumentPosition(sentinels()[0]) &
              Node.DOCUMENT_POSITION_FOLLOWING &&
              (!recent ||
                recent.compareDocumentPosition(sentinels()[0]) & Node.DOCUMENT_POSITION_FOLLOWING),
            "Sentinel did not follow Highlights and Recent",
          )
          assert(Boolean(recent) === count > 3, "Empty Recent section was rendered")
          assert(
            sentinels()[0]
              .closest(".simplebar-content, .adaptive-scroll-area-native")
              ?.contains(homeRoot().querySelector(".home-highlights")),
            "Sentinel is outside the persistent composition scroll root",
          )
        }
      },
    ],
    [
      "HOME_DEDUPE_BY_ENTRY_ID",
      async () => {
        const entries = paginationEntries(20)
        await mount("/", { entries: [...entries.toReversed(), entries[0], entries[6]], total: 20 })
        await waitFor(() => ids().length === 3, "Highlights missing")
        const rendered = [...ids(), ...recentIds()]
        assert(
          rendered.length === 20 && new Set(rendered).size === 20,
          "Home deduped distinct records by shared title/hash/URL or repeated entry IDs",
        )
        assert(
          recentIds().join(",") ===
            entries
              .slice(3)
              .map(({ id }) => id)
              .join(","),
          "Recent order did not follow published_at descending",
        )
      },
    ],
    [
      "HOME_LOAD_MORE_STABLE",
      async () => {
        await mountPagination(20, { pages: [paginationEntries(20, 18)] })
        const highlights = cards()
        const root = scrollRoot()
        await loadNextPage(20)
        assert(ids().join(",") === "10000,10001,10002", "Append changed Highlight slots/order")
        assert(
          cards().every((node, index) => node === highlights[index]),
          "Append remounted Highlights",
        )
        assert(scrollRoot() === root, "Append replaced the persistent scroll root")
        assert(
          recentIds().join(",") ===
            paginationEntries(38)
              .slice(3)
              .map(({ id }) => id)
              .join(","),
          "Page overlap was not appended by ID to Recent",
        )
        assert(sentinels().length === 1, "Append duplicated the sentinel")
      },
    ],
    [
      "HOME_ONE_CURSOR",
      async () => {
        await mountPagination(20, {
          pages: [paginationEntries(20, 18), paginationEntries(20, 36)],
        })
        await loadNextPage(20)
        await loadNextPage(38)
        const queries = listRequests().map(
          (url) => new URL(url, "https://fixture.invalid").searchParams,
        )
        assert(queries.length === 3, "Home created a second query/pagination chain")
        assert(
          queries.every(
            (query) =>
              query.get("status") === "unread" &&
              query.get("limit") === "20" &&
              query.get("order") === "published_at" &&
              query.get("direction") === "desc",
          ),
          "Pagination did not reuse canonical Home query policy",
        )
        const cursor = (index) =>
          String(Date.parse(paginationEntries(index + 1)[index].published_at) / 1000)
        assert(
          !queries[0].has("published_before") &&
            queries[1].get("published_before") === cursor(18) &&
            queries[2].get("published_before") === cursor(36),
          "Home cursor sequence did not advance once per page",
        )
      },
    ],
    [
      "HOME_EMPTY_RECENT_SENTINEL",
      async () => {
        for (const count of [1, 2, 3]) {
          await mountPagination(count, { pages: [paginationEntries(count, count)] })
          assert(
            recentIds().length === 0 && !homeRoot().querySelector(".home-recent"),
            "Recent should be absent",
          )
          assert(
            sentinels().length === 1 && contentState.get().loadMoreVisible,
            "Empty Recent lost pagination",
          )
          const initialIds = ids().join(",")
          await loadNextPage(count)
          assert(ids().join(",") === initialIds, "Pagination filled or reordered Highlight slots")
          assert(recentIds().length === count, "Empty Recent did not receive appended records")
        }
      },
    ],
    [
      "HOME_NO_EXTRA_HIGHLIGHT_FETCH",
      async () => {
        await mountPagination(20)
        await settle()
        assert(
          listRequests().length === 1 && requests.length === 1,
          "Highlights issued an extra fetch",
        )
        assert(
          contentState.get().entries.length === 20 && recentIds().length === 17,
          "Highlights exceeded the page budget",
        )
      },
    ],
    [
      "HOME_LARGE_PAGE_APPEND",
      async () => {
        await mountPagination(250, { pages: [paginationEntries(250, 248)] })
        await loadNextPage(250)
        assert(contentState.get().entries.length === 498, "Large page append lost ID deduplication")
        assert(ids().join(",") === "10000,10001,10002", "Large append reordered Highlights")
        assert(
          recentIds().join(",") ===
            paginationEntries(498)
              .slice(3)
              .map(({ id }) => id)
              .join(","),
          "Large page Recent order/append is incomplete",
        )
        assert(
          sentinels().length === 1 && listRequests().length === 2,
          "Large append created extra pagination owners",
        )
      },
    ],
  ]
  const listSentinelScenarios = [
    [
      "LIST_VIRTUALIZED_SHARED_SENTINEL_APPEND",
      async () => {
        await mount("/all", {
          entries: paginationEntries(250),
          total: 1000,
          pageSize: 250,
          layout: "card",
          orderBy: "published_at",
          orderDirection: "desc",
          pages: [paginationEntries(250, 248)],
        })
        await waitFor(
          () => document.querySelector(".article-card-grid-row"),
          "Virtualized Grid missing",
        )
        const root = document.querySelector(
          ".entry-list .simplebar-content-wrapper, .entry-list.adaptive-scroll-area-native",
        )
        const sentinel = document.querySelector(".entry-list .load-more-container")
        assert(
          root && sentinel && document.querySelectorAll(".load-more-container").length === 1,
          "Ordinary ArticleList lost the shared sentinel",
        )
        assert(
          document.querySelectorAll(".entry-list .article-entry").length < 250,
          "Ordinary Grid no longer virtualizes loaded records",
        )
        root.scrollTop = root.scrollHeight
        sentinel.scrollIntoView({ block: "end" })
        deferredPagination?.resolve()
        deferredPagination = null
        root.dispatchEvent(new Event("scroll"))
        await waitFor(
          () => contentState.get().entries.length === 498,
          "Virtualized sentinel failed to append",
        )
        assert(listRequests().length === 2, "Ordinary list started extra requests")
        assert(
          document.querySelectorAll(".load-more-container").length === 1,
          "Virtualized append duplicated the sentinel",
        )
        assert(
          document.querySelector(
            ".entry-list .simplebar-content-wrapper, .entry-list.adaptive-scroll-area-native",
          ) === root,
          "Virtualized append replaced the scroll root",
        )
      },
    ],
  ]
  const stateScenarios = [
    [
      "HOME_LOADING",
      async () => {
        await mount("/", { deferInitial: true, entries: [], total: 0 })
        assert(
          document.querySelector(".home-state-loading[aria-busy='true']"),
          "Initial canonical query did not render the Home editorial skeleton",
        )
        assert(
          !document.querySelector(".home-state-zero-unread"),
          "Pending query was presented as global zero unread",
        )
        deferredArticleQuery?.resolve()
        deferredArticleQuery = null
        await waitFor(
          () => document.querySelector(".home-state-zero-unread"),
          "Successful zero result did not replace initial loading",
        )
      },
    ],
    [
      "HOME_LOW_UNREAD_COUNTS",
      async () => {
        for (const [entries, expected] of [
          [highlightFixtures.one, 1],
          [highlightFixtures.two, 2],
        ]) {
          await mountHighlights(entries)
          assert(cards().length === expected, `Expected exactly ${expected} loaded Highlights`)
          assert(
            !document.querySelector(".home-highlight-slot-placeholder"),
            "A filler card rendered",
          )
          assert(!document.querySelector(".home-recent"), "Empty Recent section rendered")
        }
      },
    ],
    [
      "HOME_EMPTY_RECENT",
      async () => {
        await mount("/", {
          entries: emptyHomeFixtures.emptyPageWithMore.entries,
          total: emptyHomeFixtures.emptyPageWithMore.total,
          pageSize: 20,
          pages: [emptyHomeFixtures.emptyPageWithMore.nextPage],
          emptyPagePagination: true,
        })
        await waitFor(
          () => homeRoot()?.getAttribute("aria-busy") === "false",
          "Empty Home query did not become ready",
        )
        assert(cards().length === 0 && recentIds().length === 0, "Empty loaded page rendered cards")
        assert(!document.querySelector(".home-recent"), "Empty Recent section rendered")
        assert(
          !document.querySelector(".home-state-zero-unread"),
          "Positive total rendered zero state",
        )
        assert(
          sentinels().length === 1,
          `Empty loaded page lost its shared sentinel (ready=${contentState.get().isArticleListReady}, total=${contentState.get().total}, loadMore=${contentState.get().loadMoreVisible}, session=${homeRoot()?.getAttribute("aria-busy")})`,
        )
        assert(contentState.get().loadMoreVisible, "Positive total did not preserve pagination")
        deferredPagination?.resolve()
        deferredPagination = null
        await waitFor(
          () => contentState.get().entries.length === 12,
          "Empty page sentinel did not append",
        )
      },
    ],
    [
      "HOME_ZERO_UNREAD",
      async () => {
        await mount("/", emptyHomeFixtures.zeroUnread)
        await waitFor(
          () => document.querySelector(".home-state-zero-unread"),
          "Successful canonical zero did not render the calm Home state",
        )
        assert(
          document
            .querySelector(".home-state-zero-unread")
            ?.textContent.includes(englishPhrases.article_list.no_unread_articles),
          "Global zero state did not use the existing localized no-unread message",
        )

        await mount("/", { entries: routeEntries.slice(0, 1), total: 2 })
        await waitFor(() => contentState.get().isArticleListReady, "Home query did not load")
        failCount = true
        updateEntriesStatusOptimistically([contentState.get().entries[0]], "read")
        await waitFor(
          () =>
            requests.some(
              (url) => new URL(url, "https://fixture.invalid").searchParams.get("limit") === "1",
            ),
          "Failed guarded count reconciliation was not requested",
        )
        await settle()
        assert(
          !document.querySelector(".home-state-zero-unread") && contentState.get().total === 2,
          "Failed count reconciliation produced a false zero-unread state",
        )
      },
    ],
    [
      "HOME_ZERO_UNREAD_REFRESH_ERROR_RETRY",
      async () => {
        await mount("/", emptyHomeFixtures.zeroUnread)
        await waitFor(
          () => document.querySelector(".home-state-zero-unread"),
          "Successful canonical zero did not render before refresh",
        )
        const initialRequests = listRequests().length
        articleFailure = true
        document.body.focus()
        document.body.dispatchEvent(
          new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            code: "KeyR",
            key: "r",
            keyCode: 82,
            which: 82,
          }),
        )
        await waitFor(
          () => contentState.get().articleListError,
          "Zero-session explicit refresh rejection missing",
        )
        assert(
          document.querySelector(".home-state-zero-unread"),
          "Failed refresh replaced the valid zero-unread state",
        )
        assert(
          document.querySelector(".home-state-refresh-error[role='alert'] button"),
          "Zero-unread refresh failure did not expose retry",
        )
        const priorSnapshotRevision = contentState.get().articleListSnapshotRevision
        articleFailure = false
        deferredArticleQuery = (() => {
          let release
          const promise = new Promise((resolve) => {
            release = resolve
          })
          return { promise, resolve: release }
        })()
        clickLabel(englishPhrases.actions.retry)
        await waitFor(
          () => listRequests().length === initialRequests + 2,
          "Zero-session retry request did not start",
        )
        const retryCompleted = () =>
          contentState.get().isArticleListReady &&
          !contentState.get().articleListError &&
          contentState.get().articleListSnapshotRevision > priorSnapshotRevision
        assert(
          contentState.get().articleListSnapshotRevision === priorSnapshotRevision &&
            !contentState.get().isArticleListReady,
          "Zero-session retry committed before its response was released",
        )
        assert(!retryCompleted(), "Zero-session retry completed without a response")
        deferredArticleQuery.resolve()
        deferredArticleQuery = null
        await waitFor(retryCompleted, "Zero-session refresh retry did not complete")
        assert(
          document.querySelector(".home-state-zero-unread") &&
            !document.querySelector(".home-state-refresh-error"),
          "Successful zero-session retry did not restore the calm zero state",
        )
        assert(
          listRequests().length === initialRequests + 2,
          "Zero-session refresh/retry started unexpected requests",
        )
      },
    ],
    [
      "HOME_INITIAL_ERROR",
      async () => {
        await mount("/", { queryError: true })
        await waitFor(() => contentState.get().articleListError, "Initial query rejection missing")
        assert(
          document.querySelector(".home-state-initial-error[role='alert']"),
          "Initial article-query failure did not render an in-surface Home error",
        )
        assert(
          !document.querySelector(".home-state-zero-unread"),
          "Failed initial query was presented as global zero unread",
        )
        articleFailure = false
        clickLabel(englishPhrases.actions.retry)
        await waitFor(
          () => homeRoot()?.getAttribute("aria-busy") === "false",
          "Retry did not recover Home",
        )
        assert(
          homeRoot().querySelector(".home-state-initial-error") === null,
          "Retry left initial error visible",
        )
        assert(listRequests().length === 2, "Retry did not use the existing canonical query")
      },
    ],
    [
      "HOME_REFRESH_ERROR_WITH_CONTENT",
      async () => {
        await mountHighlights(highlightFixtures.image)
        const originalCards = cards()
        const initialRequests = listRequests().length
        articleFailure = true
        document.body.focus()
        document.body.dispatchEvent(
          new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            code: "KeyR",
            key: "r",
            keyCode: 82,
            which: 82,
          }),
        )
        document.body.dispatchEvent(
          new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            code: "KeyR",
            key: "r",
            keyCode: 82,
            which: 82,
          }),
        )
        await waitFor(
          () => contentState.get().articleListError,
          "Explicit refresh rejection missing",
        )
        assert(
          listRequests().length === initialRequests + 1,
          "Repeated refresh started overlapping canonical requests",
        )
        assert(
          document.querySelector(".home-state-refresh-error[role='alert']"),
          "Refresh rejection did not render its distinct in-surface error",
        )
        assert(
          originalCards.length === cards().length &&
            originalCards.every((card, index) => card === cards()[index]),
          "Failed refresh replaced the exact valid Home projection",
        )
        assert(
          !document.querySelector(".home-state-initial-error"),
          "Refresh used initial-error state",
        )
        articleFailure = false
        clickLabel(englishPhrases.actions.retry)
        await waitFor(
          () =>
            homeRoot()?.getAttribute("aria-busy") === "false" &&
            !contentState.get().articleListError,
          "Refresh retry did not complete",
        )
        assert(
          listRequests().length === initialRequests + 2,
          "Refresh/retry started unexpected requests",
        )
      },
    ],
    [
      "HOME_LOAD_MORE_ERROR",
      async () => {
        await mountPagination(20, { pages: [paginationEntries(20, 18)] })
        const originalCards = cards()
        failPagination = true
        const root = scrollRoot()
        root.scrollTop = root.scrollHeight
        sentinels()[0].scrollIntoView({ block: "end" })
        root.dispatchEvent(new Event("scroll"))
        await waitFor(() => contentState.get().loadMoreError, "Load-more rejection missing")
        assert(
          originalCards.every((card, index) => card === cards()[index]),
          "Load-more failure replaced Home Highlights",
        )
        assert(
          document.querySelectorAll(".home-editorial .load-more-container").length === 1 &&
            sentinels()[0].querySelector("button"),
          "Load-more retry was not local to the sole shared sentinel",
        )
        assert(
          !document.querySelector(".home-state-refresh-error, .home-state-initial-error"),
          "Page error duplicated sentinel error",
        )
        failPagination = false
        deferredPagination?.resolve()
        deferredPagination = null
        sentinels()[0].querySelector("button").click()
        await waitFor(
          () => contentState.get().entries.length > 20,
          "Sentinel retry did not append page",
        )
        assert(contentState.get().loadMoreError === false, "Sentinel retry left error state active")
      },
    ],
  ]
  const responsiveScenarios = [
    [
      "HOME_RESPONSIVE_VIEWPORT_STAGE",
      async () => {
        await mountHighlights(highlightFixtures.image)
        const stage = document.querySelector(".harness-stage")
        const stageRect = stage?.getBoundingClientRect()
        assert(
          stageRect && Math.abs(stageRect.top) < 1 && Math.abs(stageRect.height - innerHeight) < 1,
          `Responsive fixture did not use the exact viewport height: top=${stageRect?.top}, height=${stageRect?.height}, viewport=${innerHeight}`,
        )
        assert(
          getComputedStyle(document.querySelector(".harness-controls")).display === "none" &&
            getComputedStyle(document.querySelector(".harness-fixture-controls")).display ===
              "none",
          "Harness controls reduced the Home viewport during the responsive matrix",
        )
      },
    ],
    [
      "HOME_NO_OVERFLOW",
      async () => {
        await mountHighlights(highlightFixtures.image)
        assert(
          document.documentElement.scrollWidth <= window.innerWidth,
          `Home overflowed: ${document.documentElement.scrollWidth}px > ${window.innerWidth}px`,
        )
      },
    ],
    [
      "HOME_SECTION_HIERARCHY",
      async () => {
        await mountHighlights(highlightFixtures.image)
        const headings = [...homeRoot().querySelectorAll(".home-section-heading")].map((node) =>
          node.textContent.trim(),
        )
        assert(
          JSON.stringify(headings) === JSON.stringify(["Highlights", "Latest"]),
          `Expected editorial section hierarchy; found ${headings.join(" / ")}`,
        )
        const sections = [...homeRoot().querySelectorAll("section[aria-label]")].map((node) =>
          node.getAttribute("aria-label"),
        )
        assert(
          sections.indexOf("Highlights") < sections.indexOf("Latest"),
          "Home section DOM order is not Highlights then Recent",
        )
      },
    ],
    [
      "HOME_SECONDARY_LAYOUT",
      async () => {
        await mountPagination(12)
        const primary = homeRoot().querySelector(".home-highlight-slot-primary")
        const secondaries = [
          ...homeRoot().querySelectorAll(".home-highlight-secondaries .article-entry"),
        ]
        assert(primary && secondaries.length === 2, "Primary or both Secondary cards are missing")
        const primaryRect = primary.getBoundingClientRect()
        const secondaryRects = secondaries.map((node) => node.getBoundingClientRect())
        const expectedWide = window.innerWidth >= 700
        assert(
          expectedWide
            ? Math.abs(secondaryRects[0].top - secondaryRects[1].top) < 2
            : secondaryRects[1].top > secondaryRects[0].top,
          `Secondary layout did not match ${window.innerWidth}px viewport`,
        )
        if (window.innerWidth >= 884) {
          const highlightsRect = homeRoot()
            .querySelector(".home-highlights")
            .getBoundingClientRect()
          assert(
            Math.abs(primaryRect.width - highlightsRect.width) < 2,
            `At 884px and wider, Primary (${primaryRect.width}px) does not span Highlights (${highlightsRect.width}px)`,
          )
        }
        globalThis.__phase2cHomeResponsive = {
          viewport: [window.innerWidth, window.innerHeight],
          contentWidth: homeRoot().querySelector(".home-editorial-content").clientWidth,
          primaryWidth: Math.round(primaryRect.width),
          highlightsWidth: Math.round(homeRoot().querySelector(".home-highlights").clientWidth),
          secondaryWidths: secondaryRects.map((rect) => Math.round(rect.width)),
          secondaryColumns: expectedWide ? 2 : 1,
          recentTop: Math.round(
            homeRoot().querySelector(".home-recent").getBoundingClientRect().top,
          ),
          appHeight: document.querySelector(".harness-stage").clientHeight,
        }
      },
    ],
    [
      "HOME_RECENT_GRID",
      async () => {
        await mountPagination(12)
        const row = homeRoot().querySelector(".home-recent .article-card-grid-row")
        assert(row, "Recent Grid row missing")
        const cells = [...row.children]
        const viewportWidth = window.innerWidth
        const availableWidth = homeRoot().querySelector(".home-editorial-content").clientWidth
        const expectedColumns = Math.max(1, Math.min(3, Math.floor((availableWidth + 12) / 312)))
        assert(
          cells.length === expectedColumns,
          `Recent Grid columns were ${cells.length}; expected ${expectedColumns} from ${availableWidth}px at ${viewportWidth}px`,
        )
        assert(
          [...homeRoot().querySelectorAll(".home-recent .article-card-grid-row")].every(
            (node) => Number(node.style.getPropertyValue("--article-card-grid-columns")) <= 3,
          ),
          "Recent exceeded the existing three-column Grid maximum",
        )
        const widths = cells.map((cell) => Math.round(cell.getBoundingClientRect().width))
        let density = null
        if (viewportWidth === 1024 && window.innerHeight === 768) {
          const scrollRoot = homeRoot().querySelector(
            ".simplebar-content-wrapper, .adaptive-scroll-area-native",
          )
          const recent = homeRoot().querySelector(".home-recent")
          const heading = recent?.querySelector(".home-section-heading")
          assert(scrollRoot && recent && heading, "1024×768 Home density elements are missing")
          assert(
            scrollRoot.scrollHeight > scrollRoot.clientHeight,
            "Recent is not reachable inside the Home scroll area at 1024×768",
          )
          const rootRect = scrollRoot.getBoundingClientRect()
          const recentRect = recent.getBoundingClientRect()
          const headingHeight = heading.getBoundingClientRect().height
          const recentOffset = scrollRoot.scrollTop + recentRect.top - rootRect.top
          const desiredScroll = Math.min(
            Math.max(0, recentOffset + headingHeight + 12 - scrollRoot.clientHeight),
            scrollRoot.scrollHeight - scrollRoot.clientHeight,
          )
          scrollRoot.scrollTop = desiredScroll
          await settle()
          const updatedRootRect = scrollRoot.getBoundingClientRect()
          const updatedHeadingRect = heading.getBoundingClientRect()
          const headingVisible =
            updatedHeadingRect.top < updatedRootRect.bottom &&
            updatedHeadingRect.bottom > updatedRootRect.top
          assert(headingVisible, "Recent heading is not discoverable by scrolling at 1024×768")
          density = {
            scrollClientHeight: scrollRoot.clientHeight,
            scrollHeight: scrollRoot.scrollHeight,
            scrollTop: Math.round(scrollRoot.scrollTop),
            recentHeadingVisibleAfterScroll: headingVisible,
            recentColumns: cells.length,
            recentCardWidths: widths,
          }
        }
        globalThis.__phase2cHomeResponsive = {
          ...globalThis.__phase2cHomeResponsive,
          recentColumns: cells.length,
          recentCardWidths: widths,
          recentGridWidth: Math.round(row.getBoundingClientRect().width),
          ...(density ? { density } : {}),
        }
      },
    ],
    [
      "HOME_SEARCH_ONLY",
      async () => {
        await mountHighlights(highlightFixtures.image)
        const controls = [...document.querySelectorAll(".home-editorial .search-and-sort-bar")]
        assert(controls.length === 1, "Home search control missing")
        const buttons = [...controls[0].querySelectorAll(".button-group button")]
        assert(buttons.length === 1, `Home exposed ${buttons.length} search/filter controls`)
        assert(
          !controls[0].querySelector(".arco-picker, [aria-label*='Sort'], .status-filter"),
          "Date, sort, or status control leaked onto Home",
        )
      },
    ],
    [
      "HOME_SEARCH_ROUTES_TO_ALL",
      async () => {
        await mountHighlights(highlightFixtures.image)
        const searchButton = document.querySelector(".home-editorial .button-group button")
        assert(searchButton, "Home search button missing")
        searchButton.click()
        await waitFor(() => document.querySelector(".search-modal input"), "Search modal missing")
        const input = document.querySelector(".search-modal input")
        const inputValueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        ).set
        inputValueSetter.call(input, "editorial fixture query")
        input.dispatchEvent(new Event("input", { bubbles: true }))
        await settle()
        clickLabel(englishPhrases.search.confirm)
        await waitFor(
          () => router.state.location.pathname === "/all",
          "Home search did not route to /all",
        )
        assert(
          contentState.get().filterString === "editorial fixture query",
          "Home search did not reuse the existing query state",
        )
      },
    ],
    [
      "LIST_SEARCH_DATE_SORT_PRESERVED",
      async () => {
        await mount("/all")
        const bar = document.querySelector(".entry-col .search-and-sort-bar")
        const buttons = [...bar.querySelectorAll(".button-group button")]
        assert(buttons.length === 3, "Ordinary list lost Search, Date, or Sort")
        const initialDirection = settingsState.get().orderDirection
        buttons[2].click()
        await waitFor(
          () => settingsState.get().orderDirection !== initialDirection,
          "Ordinary Sort no longer updates the existing order preference",
        )
        assert(router.state.location.pathname === "/all", "Ordinary Sort changed routes")

        buttons[0].click()
        await waitFor(
          () => document.querySelector(".search-modal input"),
          "List Search modal missing",
        )
        const input = document.querySelector(".search-modal input")
        const inputValueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        ).set
        inputValueSetter.call(input, "ordinary list query")
        input.dispatchEvent(new Event("input", { bubbles: true }))
        await settle()
        clickLabel(englishPhrases.search.confirm)
        await waitFor(
          () => contentState.get().filterString === "ordinary list query",
          "Ordinary Search did not update its existing query state",
        )
        assert(router.state.location.pathname === "/all", "Ordinary Search added Home navigation")

        const dateButton = [...document.querySelectorAll(".entry-col .button-group button")].find(
          (button) => button.getAttribute("aria-label") === englishPhrases.search.select_date,
        )
        assert(dateButton, "Ordinary Date control missing")
        dateButton.click()
        await waitFor(
          () => document.querySelector(".arco-picker-container"),
          "Ordinary Date control did not open the existing calendar",
        )
        const clearDateButton = [...document.querySelectorAll(".calendar-actions button")].find(
          (button) => button.textContent.trim() === englishPhrases.search.clear_date,
        )
        assert(clearDateButton, "Ordinary Date clear action missing")
        clearDateButton.click()
        assert(contentState.get().filterDate === null, "Ordinary Date clear did not preserve state")
        assert(router.state.location.pathname === "/all", "Ordinary Date changed routes")
      },
    ],
    [
      "HOME_LIGHT",
      async () => {
        await mountHighlights(highlightFixtures.image)
        document.body.removeAttribute("arco-theme")
        await new Promise((resolve) => setTimeout(resolve, 240))
        const card = homeRoot().querySelector(".grid-card-wrapper")
        const control = homeRoot().querySelector(".nf-glass-control")
        const cardStyle = card && getComputedStyle(card)
        const controlStyle = control && getComputedStyle(control)
        const contentToken = getComputedStyle(document.body)
          .getPropertyValue("--nf-surface-content")
          .trim()
        assert(
          cardStyle &&
            cardStyle.backgroundColor !== "rgba(0, 0, 0, 0)" &&
            cardStyle.backdropFilter === "none",
          "Light Home content surface is not opaque",
        )
        assert(
          controlStyle && controlStyle.backdropFilter !== "none",
          "Light Home chrome is not Liquid Glass",
        )
        globalThis.__phase2cHomeThemeMetrics = {
          ...globalThis.__phase2cHomeThemeMetrics,
          light: {
            card: cardStyle.backgroundColor,
            contentToken,
            chromeBlur: controlStyle.backdropFilter,
          },
        }
      },
    ],
    [
      "HOME_DARK",
      async () => {
        await mountHighlights(highlightFixtures.image)
        document.body.setAttribute("arco-theme", "dark")
        await new Promise((resolve) => setTimeout(resolve, 240))
        const card = homeRoot().querySelector(".grid-card-wrapper")
        const control = homeRoot().querySelector(".nf-glass-control")
        const cardStyle = card && getComputedStyle(card)
        const controlStyle = control && getComputedStyle(control)
        const contentToken = getComputedStyle(document.body)
          .getPropertyValue("--nf-surface-content")
          .trim()
        assert(
          cardStyle &&
            cardStyle.backgroundColor !== "rgba(0, 0, 0, 0)" &&
            cardStyle.backdropFilter === "none",
          "Dark Home content surface is not opaque",
        )
        assert(
          document.body.getAttribute("arco-theme") === "dark" &&
            contentToken === "#101317" &&
            cardStyle.backgroundColor === "rgb(16, 19, 23)",
          `Dark content surface did not apply: body=${contentToken}, computed=${cardStyle.backgroundColor}`,
        )
        assert(
          controlStyle && controlStyle.backdropFilter !== "none",
          "Dark Home chrome is not Liquid Glass",
        )
        globalThis.__phase2cHomeThemeMetrics = {
          ...globalThis.__phase2cHomeThemeMetrics,
          dark: {
            card: cardStyle.backgroundColor,
            contentToken,
            chromeBlur: controlStyle.backdropFilter,
          },
        }
      },
    ],
  ]
  const matrixScenarios = [
    [
      "HARNESS_SCENARIO_MATRIX_COMPLETE",
      async () => {
        const requiredViewports = [
          "390x844",
          "768x1024",
          "884x1104",
          "1024x768",
          "1280x800",
          "1440x900",
        ]
        const requiredThemes = ["light", "dark"]
        const requiredGates = [
          "HOME_NO_OVERFLOW",
          "HOME_SECTION_HIERARCHY",
          "HOME_PRIMARY_TEXT_ONLY",
          "HOME_SECONDARY_LAYOUT",
          "HOME_RECENT_GRID",
          "HOME_EMPTY_RECENT",
          "HOME_LOADING",
          "HOME_REFRESH_ERROR_WITH_CONTENT",
          "HOME_LIGHT",
          "HOME_DARK",
          "HOME_IDENTITY_FAILURE_RECOVERY",
          "HOME_LAST_READ_TRANSITIONS_TO_TUDO_EM_DIA",
          "HOME_READ_FAILURE_DOES_NOT_ZERO_TOTAL",
          "HOME_MARK_UNREAD_RECONCILES_TOTAL",
          "HOME_UNLOADED_MARK_UNREAD_REENABLES_PAGINATION",
          "HOME_TOTAL_RECONCILIATION_STALE_SESSION_PROTECTED",
        ]
        const requiredProductScenarios = [
          "THREE_PLUS_UNREAD_WITH_IMAGE_PRIMARY",
          "THREE_PLUS_UNREAD_WITH_TEXT_ONLY_PRIMARY",
          "TWO_UNREAD",
          "ONE_UNREAD",
          "ZERO_UNREAD",
          "MIXED_IMAGE_AND_TEXT_ONLY",
          "DIVERSE_SOURCE_AND_CATEGORY",
          "SAME_SOURCE_AND_CATEGORY",
          "LOADING",
          "INITIAL_ERROR",
          "REFRESH_ERROR_RETAINS_CONTENT",
          "LOAD_MORE_ERROR",
          "AFTER_READ_BACKFILL",
          "AFTER_MARK_UNREAD",
          "AFTER_STAR_AND_UNSTAR",
        ]
        const requiredManualGates = [
          "EDITORIAL_HIERARCHY_CLEAR",
          "PRIMARY_NOT_OVERSIZED",
          "SECONDARIES_BALANCED",
          "RECENT_VISIBLE_AS_CONTINUATION",
          "TEXT_ONLY_PRIMARY_FEELS_INTENTIONAL",
          "NO_GLASS_CONTENT_SURFACES",
          "OLED_SURFACE_SEPARATION",
          "NO_LAYOUT_JUMP_ON_READER_RETURN",
          "NO_UNEXPECTED_RECOMPOSE",
          "TOUCH_TARGETS_USABLE",
          "MOBILE_SINGLE_PANE",
        ]
        const allScenarios = [
          ...scenarios,
          ...highlightScenarios,
          ...recentScenarios,
          ...listSentinelScenarios,
          ...stateScenarios,
          ...responsiveScenarios,
          ...matrixScenarios,
        ]
        const gateNames = new Set(allScenarios.map(([name]) => name))
        const matrix = phase2cEditorialHomeMatrix
        const viewportIds = matrix.viewports.map(({ width, height }) => `${width}x${height}`)
        const productScenarioIds = new Set(matrix.scenarios.map(({ id }) => id))
        const manualGateIds = matrix.manualGates.map(({ name }) => name)
        const missing = {
          viewports: requiredViewports.filter((viewport) => !viewportIds.includes(viewport)),
          unexpectedViewports: viewportIds.filter(
            (viewport) => !requiredViewports.includes(viewport),
          ),
          themes: requiredThemes.filter((theme) => !matrix.themes.includes(theme)),
          unexpectedThemes: matrix.themes.filter((theme) => !requiredThemes.includes(theme)),
          gates: [...new Set([...requiredGates, ...matrix.automatedGates])].filter(
            (gate) => !matrix.automatedGates.includes(gate) || !gateNames.has(gate),
          ),
          productScenarios: requiredProductScenarios.filter(
            (scenario) => !productScenarioIds.has(scenario),
          ),
          scenarios: matrix.scenarios
            .filter(
              ({ id, covers, fixtures }) =>
                !id ||
                covers.length === 0 ||
                fixtures.length === 0 ||
                covers.some((gate) => !gateNames.has(gate)),
            )
            .map(({ id, covers, fixtures }) => {
              const missingCoverage = covers.filter((gate) => !gateNames.has(gate))
              return `${id || "UNNAMED"}${missingCoverage.length > 0 ? ` missing gates ${missingCoverage.join(",")}` : " missing fixture/coverage"}`
            }),
          manualGates: matrix.manualGates
            .filter(({ name, status }) => !name || status !== "MANUAL_REQUIRED")
            .map(({ name }) => name || "UNNAMED"),
          unexpectedManualGates: manualGateIds.filter(
            (gate) => !requiredManualGates.includes(gate),
          ),
          missingManualGates: requiredManualGates.filter((gate) => !manualGateIds.includes(gate)),
        }
        const missingSummary = Object.entries(missing)
          .filter(([, values]) => values.length)
          .map(([type, values]) => `${type}=[${values.join(", ")}]`)
          .join("; ")
        assert(!missingSummary, `Harness scenario matrix is incomplete: ${missingSummary}`)
      },
    ],
  ]
  const scenarioSuites = [
    { name: "routes", scenarios },
    { name: "highlights", scenarios: highlightScenarios },
    { name: "recent", scenarios: recentScenarios },
    { name: "list-sentinel-regression", scenarios: listSentinelScenarios },
    { name: "states-and-recovery", scenarios: stateScenarios },
    { name: "responsive-visual", scenarios: responsiveScenarios },
    { name: "matrix-completeness", scenarios: matrixScenarios },
  ]
  const runSuites = async (selectedSuites, { recordViewportTheme = false } = {}) => {
    setRunning(true)
    setResults([])
    const next = []
    try {
      for (const { name: suite, scenarios: selectedScenarios } of selectedSuites) {
        const responsiveMode = selectedScenarios === responsiveScenarios
        if (responsiveMode) {
          document.body.classList.add("phase2c-responsive-running")
          await new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          })
        }
        try {
          for (const [name, scenario] of selectedScenarios) {
            if (selectedTheme === "dark") {
              document.body.setAttribute("arco-theme", "dark")
            } else {
              document.body.removeAttribute("arco-theme")
            }
            try {
              await scenario()
              next.push({
                suite,
                name,
                status: "PASS",
                gateClass: "AUTOMATED",
                metrics: captureHomeHarnessMetrics(selectedTheme),
                ...(name === "HOME_SECONDARY_LAYOUT" || name === "HOME_RECENT_GRID"
                  ? { responsive: globalThis.__phase2cHomeResponsive }
                  : {}),
                ...(name === "HOME_LIGHT" || name === "HOME_DARK"
                  ? { themes: globalThis.__phase2cHomeThemeMetrics }
                  : {}),
              })
            } catch (error) {
              next.push({
                suite,
                name,
                status: "FAIL",
                gateClass: "AUTOMATED",
                error: error.message,
                path: router?.state.location.pathname,
                activeId: contentState.get().activeContent?.id,
                readerText: document.querySelector(".article-body")?.textContent,
                metrics: captureHomeHarnessMetrics(selectedTheme),
              })
            }
            setResults([...next])
          }
        } finally {
          if (responsiveMode) {
            document.body.classList.remove("phase2c-responsive-running")
          }
        }
      }
      if (recordViewportTheme) {
        const viewport = phase2cEditorialHomeMatrix.viewports.find(
          ({ width, height }) => width === innerWidth && height === innerHeight,
        )
        if (viewport) {
          const id = matrixPairId(viewport, selectedTheme)
          const run = {
            viewport: id.split(":", 1)[0],
            theme: selectedTheme,
            passed: next.filter(({ status }) => status === "PASS").length,
            total: next.length,
            status: next.every(({ status }) => status === "PASS") ? "PASS" : "FAIL",
            completedAt: new Date().toISOString(),
          }
          const records = { ...readMatrixRuns(), [id]: run }
          sessionStorage.setItem(MATRIX_RUNS_STORAGE_KEY, JSON.stringify(records))
          setMatrixRuns(records)
        }
      }
    } finally {
      document.body.classList.remove("phase2c-responsive-running")
      setRunning(false)
    }
  }
  const run = async (selectedScenarios = scenarios) => {
    const suite = scenarioSuites.find(({ scenarios: candidate }) => candidate === selectedScenarios)
    return runSuites([{ name: suite?.name ?? "selected", scenarios: selectedScenarios }])
  }
  const runCompleteMatrix = () => runSuites(scenarioSuites, { recordViewportTheme: true })
  return (
    <main>
      <div className="harness-controls">
        <h1>Phase 2C editorial Home harness</h1>
        <p>Local deterministic network fixtures, production route and reader lifecycle.</p>
        <label htmlFor="phase2c-harness-theme">Run theme</label>
        <select
          data-testid="harness-theme"
          disabled={running}
          id="phase2c-harness-theme"
          value={selectedTheme}
          onChange={(event) => setSelectedTheme(event.target.value)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark / OLED</option>
        </select>
        <button disabled={running} onClick={() => void run(scenarios)}>
          Run route scenario
        </button>
        <button disabled={running} onClick={() => void run(highlightScenarios)}>
          Run Highlights scenario
        </button>
        <button disabled={running} onClick={() => void run(recentScenarios)}>
          Run Recent pagination scenario
        </button>
        <button disabled={running} onClick={() => void run(listSentinelScenarios)}>
          Run shared list sentinel regression
        </button>
        <button disabled={running} onClick={() => void run(stateScenarios)}>
          Run Home loading and recovery scenario
        </button>
        <button disabled={running} onClick={() => void run(responsiveScenarios)}>
          Run Home responsive visual gates
        </button>
        <button disabled={running} onClick={() => void run(matrixScenarios)}>
          Run scenario matrix completeness gate
        </button>
        <button disabled={running} onClick={() => void runCompleteMatrix()}>
          Run all scenarios at this viewport and theme
        </button>
        <button data-testid="reset-harness" disabled={running} onClick={resetHarness}>
          Reset harness session
        </button>
        <p data-testid="suite-summary">
          {running
            ? "RUNNING"
            : `${results.filter(({ status }) => status === "PASS").length}/${results.length} automated gates PASS`}
        </p>
        <section aria-labelledby="harness-matrix-heading" className="harness-matrix-report">
          <h2 id="harness-matrix-heading">Viewport and theme matrix</h2>
          <p data-testid="matrix-coverage-summary">
            {Object.values(matrixRuns).filter(({ status }) => status === "PASS").length}/
            {phase2cEditorialHomeMatrix.viewports.length * phase2cEditorialHomeMatrix.themes.length}{" "}
            viewport/theme pairs PASS
          </p>
          <pre data-testid="matrix-coverage">{JSON.stringify(matrixRuns, null, 2)}</pre>
        </section>
        <section aria-labelledby="harness-manual-heading" className="harness-manual-report">
          <h2 id="harness-manual-heading">Perceptual device gates</h2>
          <p>
            These checks require human review on the deployed device and are not automated PASS
            results.
          </p>
          <ul data-testid="manual-gates">
            {phase2cEditorialHomeMatrix.manualGates.map(({ name, status }) => (
              <li key={name}>
                <code>{name}</code>: <strong>{status}</strong>
              </li>
            ))}
          </ul>
        </section>
        <pre data-testid="suite-results">{JSON.stringify(results, null, 2)}</pre>
      </div>
      {probe && <RouterProvider key={probe.key} router={probe.router} />}
    </main>
  )
}

const root =
  globalThis.__phase2cHomeRoot ??
  (globalThis.__phase2cHomeRoot = createRoot(document.querySelector("#root")))
root.render(<Harness />)

export default Harness

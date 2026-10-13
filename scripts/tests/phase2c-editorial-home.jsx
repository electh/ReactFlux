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
            <FixtureReaderControls />
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
        await mount("/entry/101")
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
        await mount("/entry/202")
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
        await mount("/", { entries: routeEntries.slice(0, 1), total: 2 })
        await waitFor(() => contentState.get().isArticleListReady, "Initial Home page missing")
        assert(contentState.get().loadMoreVisible, "Fixture did not start with pagination")
        failCount = true
        updateEntriesStatusOptimistically([contentState.get().entries[0]], "read")
        await waitFor(
          () =>
            requests.some(
              (url) => new URL(url, "https://fixture.invalid").searchParams.get("limit") === "1",
            ),
          "Failed count request missing",
        )
        await settle()
        assert(
          contentState.get().total === 2 && contentState.get().loadMoreVisible,
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
        await mount()
        await waitFor(() => contentState.get().isArticleListReady, "Initial Home page missing")
        const ids = contentState.get().entries.map(({ id }) => id)
        const requestCount = requests.length
        updateEntriesStatusOptimistically(
          [{ ...routeEntries[0], id: 303, status: "read" }],
          "unread",
        )
        await waitFor(() => contentState.get().total === 3, "Unread count did not grow")
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
        await mount("/", { entries: routeEntries.slice(0, 1), total: 1 })
        await waitFor(() => contentState.get().isArticleListReady, "Initial Home page missing")
        let resolveCount
        deferredCount = {
          promise: new Promise((resolve) => {
            resolveCount = resolve
          }),
        }
        updateEntriesStatusOptimistically([contentState.get().entries[0]], "read")
        await waitFor(
          () =>
            requests.some(
              (url) => new URL(url, "https://fixture.invalid").searchParams.get("limit") === "1",
            ),
          "Deferred count did not start",
        )
        fixtureTotal = 9
        settingsState.set({ ...settingsState.get(), showHiddenFeeds: true })
        await waitFor(
          () => contentState.get().isArticleListReady && contentState.get().total === 9,
          "New Home session did not commit",
        )
        resolveCount({ entries: [], total: 0 })
        await settle()
        assert(
          contentState.get().total === 9 && contentState.get().loadMoreVisible,
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
        stage.style.height = "260px"
        settingsState.set({ ...settingsState.get(), markReadOnScroll: true })
        await settle()
        const scrollRoot = homeRoot().querySelector(
          ".simplebar-content-wrapper, .adaptive-scroll-area-native",
        )
        assert(
          scrollRoot && scrollRoot.scrollHeight > scrollRoot.clientHeight,
          "Highlight scroll root missing",
        )
        scrollRoot.scrollTop = scrollRoot.scrollHeight
        await waitFor(
          () => statusMutationRequests > 0 && !ids().includes(101),
          "Mounted Highlight read-on-scroll did not use existing observer/mutation",
        )
        settingsState.set({ ...settingsState.get(), markReadOnScroll: false })
        stage.style.height = ""
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
      "HOME_REFRESH_ERROR_PRESERVES_CONTENT",
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
  const run = async (selectedScenarios = scenarios) => {
    setRunning(true)
    setResults([])
    const next = []
    for (const [name, scenario] of selectedScenarios) {
      try {
        await scenario()
        next.push({ name, status: "PASS" })
      } catch (error) {
        next.push({
          name,
          status: "FAIL",
          error: error.message,
          path: router?.state.location.pathname,
          activeId: contentState.get().activeContent?.id,
          readerText: document.querySelector(".article-body")?.textContent,
        })
      }
      setResults([...next])
    }
    setRunning(false)
  }
  return (
    <main>
      <div className="harness-controls">
        <h1>Phase 2C editorial Home harness</h1>
        <p>Local deterministic network fixtures, production route and reader lifecycle.</p>
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
        <p data-testid="suite-summary">
          {running
            ? "RUNNING"
            : `${results.filter(({ status }) => status === "PASS").length}/${results.length} PASS`}
        </p>
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

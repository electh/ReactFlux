// Local fixtures exercise production routes, Home/Content, reader, context, manager and brand.
/* eslint-disable react-compiler/react-compiler -- Imperative deterministic fixture orchestration replaces only network/provider boundaries. */
import "@arco-design/web-react/es/_util/react-19-adapter"
import Polyglot from "node-polyglot"
import React, { useState } from "react"
import { createRoot } from "react-dom/client"
import { createMemoryRouter, Outlet, RouterProvider } from "react-router"

import { fixtureFeed, routeEntries } from "./fixtures/phase2c-editorial-home"

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
import { setCurrentHomeTarget } from "@/store/homePageState"
import { getDefaultSettings, settingsState } from "@/store/settingsState"
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
let failStatusMutation = false
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
    return { entries: fixtureEntries, total: fixtureTotal }
  }
  const id = Number(url.match(/^\/v1\/entries\/(\d+)$/)?.[1])
  const entry = routeEntries.find((candidate) => candidate.id === id)
  if (entry) {
    return entry
  }
  throw new Error(`Unexpected local fixture GET: ${url}`)
}
apiClient.put = async (url, body) => {
  if (url !== "/v1/entries" || !body?.status) {
    throw new Error("Unexpected mutation in routing fixture")
  }
  if (failStatusMutation) {
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
    failStatusMutation = false
    failCount = false
    deferredCount = null
    unloadedStatus = "read"
    authState.set(fixtureAuth)
    settingsState.set({ ...getDefaultSettings(), markReadBy, removeDuplicates: "none" })
    if (identity === "ready") {
      commitIdentityData({ id: 1, username: "fixture" })
    } else {
      setDataResourceLoadState("identity", {
        activity: identity === "loading" ? "loading" : "idle",
        error: identity === "error" ? new Error("Expected local identity failure") : null,
      })
    }
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
  const run = async () => {
    setRunning(true)
    setResults([])
    const next = []
    for (const [name, scenario] of scenarios) {
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
        <h1>Phase 2C editorial Home route scenario</h1>
        <p>Local deterministic network fixtures, production route and reader lifecycle.</p>
        <button disabled={running} onClick={() => void run()}>
          Run route scenario
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

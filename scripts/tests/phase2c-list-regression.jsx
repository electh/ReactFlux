// Local deterministic harness: real list hooks/API adapters, mocked network boundary only.
/* eslint-disable react-compiler/react-compiler -- Deterministic fixture orchestration controls the mocked network boundary. */
/* eslint-disable react-hooks/globals, react-hooks/immutability -- Isolated scenarios reset module-scoped fixture state outside React render. */
import "@arco-design/web-react/es/_util/react-19-adapter"
import { useStore } from "@nanostores/react"
import Polyglot from "node-polyglot"
import React, { useLayoutEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter, useLocation } from "react-router"

import * as entriesApi from "@/apis/entries"
import apiClient from "@/apis/ofetch"
import FooterPanel from "@/components/Content/FooterPanel"
import AppDataContext from "@/contexts/app-data-context"
import useArticleList from "@/hooks/useArticleList"
import { polyglotState } from "@/hooks/useLanguage"
import useLoadMore from "@/hooks/useLoadMore"
import englishPhrases from "@/locales/en-US.json"
import { contentState } from "@/store/contentState"
import { dataState } from "@/store/dataState"
import { getDefaultSettings, settingsState } from "@/store/settingsState"

const feed = {
  id: 1,
  title: "Fixture feed",
  site_url: "https://example.invalid",
  category: { id: 1, title: "Fixture category" },
}
const entry = (id, published_at, overrides = {}) => ({
  id,
  published_at,
  created_at: published_at,
  changed_at: published_at,
  status: "unread",
  starred: false,
  title: `Entry ${id}`,
  url: `https://example.invalid/${id}`,
  hash: `hash-${id}`,
  content: "<p>Deterministic local article content for list ordering regression.</p>",
  reading_time: 1,
  feed,
  ...overrides,
})
// Intentionally not editorial recency order: the ordinary path must keep server order.
const ordinaryEntries = [
  entry(31, "2026-10-10T10:00:00Z"),
  entry(12, "2026-10-12T10:00:00Z", { feed: { ...feed, id: 2 } }),
  entry(24, "2026-10-11T10:00:00Z"),
]
const homeEntries = [
  entry(101, "2026-10-12T10:00:00Z", { title: "Same title" }),
  entry(102, "2026-10-11T10:00:00Z", { title: "Same title" }),
]
const allAdapter = (status, _starred, filters) => entriesApi.getAllEntries(status, filters)
const feedAdapter = (status, starred, filters) =>
  entriesApi.getFeedEntries(1, status, starred, filters)
// Fallback exposes pre-implementation Home leaks while keeping the harness executable in RED.
const homeAdapter = (...args) =>
  entriesApi.getHomeEntries ? entriesApi.getHomeEntries(...args) : allAdapter(...args)
const controls = { current: null }
const requests = []
let respond
let mutationRequests = 0
let mutationFailure = false
let mutationFailureAfter = Infinity
let countRefreshes = 0
let serverEntries = []
let deferredMutation = null
apiClient.get = async (url) => {
  requests.push(url)
  return respond(url)
}
apiClient.put = async (url, body) => {
  mutationRequests += 1
  if (deferredMutation) {
    await deferredMutation.promise
  }
  if (mutationFailure || mutationRequests > mutationFailureAfter) {
    throw new Error("Expected local mark-all failure")
  }
  const ids = url === "/v1/entries" ? body.entry_ids : serverEntries.map(({ id }) => id)
  serverEntries = serverEntries.map((item) =>
    ids.includes(item.id) ? { ...item, status: "read" } : item,
  )
}
polyglotState.setKey("polyglot", new Polyglot({ phrases: englishPhrases, locale: "en-US" }))

const ListProbe = ({ source }) => {
  const adapter = source === "home" ? homeAdapter : source === "feed" ? feedAdapter : allAdapter
  const sourceId = source === "feed" ? 1 : null
  const list = useArticleList(source, sourceId, adapter)
  const pagination = useLoadMore()
  const content = useStore(contentState)
  const location = useLocation()
  useLayoutEffect(() => {
    controls.current = {
      ...list,
      loadMore: () => pagination.handleLoadMore(adapter),
      path: location.pathname,
    }
  })
  return (
    <>
      <ol aria-label="Committed entries">
        {content.entries.map(({ id, title }, index) => (
          <li key={`${id}:${index}`} data-entry-id={id}>
            {title} ({id})
          </li>
        ))}
      </ol>
      {source !== "home" && (
        <FooterPanel
          getEntries={adapter}
          info={{ from: source, id: sourceId }}
          refreshArticleList={list.fetchArticleList}
          markAllAsRead={() =>
            apiClient.put(
              source === "feed" ? "/v1/feeds/1/mark-all-as-read" : "/v1/users/1/mark-all-as-read",
            )
          }
        />
      )}
    </>
  )
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 40))
const waitFor = async (predicate) => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (predicate()) {
      return
    }
    await settle()
  }
  throw new Error("Fixture timed out")
}
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message)
  }
}
const assertIds = (ids) => {
  assert(
    JSON.stringify(contentState.get().entries.map(({ id }) => id)) === JSON.stringify(ids),
    "Committed server order/IDs changed",
  )
  assert(
    JSON.stringify(
      [...document.querySelectorAll("[data-entry-id]")].map((node) => Number(node.dataset.entryId)),
    ) === JSON.stringify(ids),
    "Rendered order/IDs changed",
  )
}
const query = (index = 0) => new URL(requests[index], "https://fixture.invalid").searchParams
const canonical = (params, limit, cursor, globallyVisible = true) => {
  const expected = {
    order: "published_at",
    direction: "desc",
    limit: String(limit),
    globally_visible: String(globallyVisible),
    status: "unread",
    ...(cursor !== undefined && { published_before: String(cursor) }),
  }
  assert(
    JSON.stringify(Object.fromEntries([...params].toSorted())) ===
      JSON.stringify(Object.fromEntries(Object.entries(expected).toSorted())),
    `Noncanonical Home query: ${params}`,
  )
}
const serverRespond = (url) => {
  const params = new URL(url, "https://fixture.invalid").searchParams
  let matching = serverEntries
  if (params.get("status")) {
    matching = matching.filter(({ status }) => status === params.get("status"))
  }
  if (params.get("search")) {
    matching = matching.filter(({ title }) => title.includes(params.get("search")))
  }
  if (params.get("published_after")) {
    matching = matching.filter(
      ({ published_at }) =>
        Date.parse(published_at) / 1000 >= Number(params.get("published_after")),
    )
  }
  if (params.get("published_before")) {
    matching = matching.filter(
      ({ published_at }) =>
        Date.parse(published_at) / 1000 <= Number(params.get("published_before")),
    )
  }
  if (url.startsWith("/v1/feeds/1/")) {
    matching = matching.filter((item) => item.feed.id === 1)
  }
  return { entries: matching.slice(0, Number(params.get("limit") || 1000)), total: matching.length }
}
const clickMarkAll = () => {
  const button = document.querySelector(
    `button[aria-label="${CSS.escape(englishPhrases.article_list.mark_all_as_read_tooltip)}"]`,
  )
  assert(button && !button.disabled, "Real FooterPanel Mark All Read control missing")
  button.click()
}

const Harness = () => {
  const [probe, setProbe] = useState(null)
  const [results, setResults] = useState([])
  const [running, setRunning] = useState(false)
  const mount = async (
    source,
    settingChanges = {},
    contentChanges = {},
    entries = ordinaryEntries,
  ) => {
    setProbe(null)
    await settle()
    controls.current = null
    requests.length = 0
    mutationRequests = 0
    mutationFailure = false
    mutationFailureAfter = Infinity
    countRefreshes = 0
    deferredMutation = null
    serverEntries = entries.map((item) => ({ ...item }))
    respond = () => ({ entries, total: 8 })
    dataState.setKey("sessionRevision", dataState.get().sessionRevision + 1)
    settingsState.set({
      ...getDefaultSettings(),
      removeDuplicates: "none",
      pageSize: 2,
      showHiddenFeeds: false,
      showStatus: "all",
      skipMarkAllReadConfirmation: true,
      orderBy: "created_at",
      orderDirection: "asc",
      ...settingChanges,
    })
    contentState.set({
      ...contentState.get(),
      entries: [],
      total: 0,
      articleListError: false,
      articleListRevision: contentState.get().articleListRevision + 1,
      filterString: "",
      filterDate: null,
      infoFrom: source,
      infoId: source === "feed" ? 1 : null,
      isArticleListReady: false,
      loadMoreVisible: false,
      ...contentChanges,
    })
    dataState.setKey("feedsData", [
      feed,
      { ...feed, id: 2, title: "Next fixture feed", category: { id: 2, title: "Next category" } },
    ])
    dataState.setKey("categoriesData", [feed.category, { id: 2, title: "Next category" }])
    dataState.setKey("unreadInfo", { 1: 2, 2: 3 })
    setProbe({ source, key: contentState.get().articleListRevision })
    await waitFor(() => contentState.get().isArticleListReady && controls.current)
    await settle()
  }
  const requiredListRegressionGates = [
    "NO_ALL_RANKING",
    "NO_UNREAD_RANKING",
    "ALL_SORT_PREFERENCE_PRESERVED",
    "UNREAD_FILTER_PRESERVED",
    "MARK_ALL_READ_SUCCESS",
    "MARK_ALL_READ_FILTER_SCOPE",
    "MARK_ALL_READ_NO_JUMP_ON_FAILURE",
    "MARK_ALL_READ_JUMP_TO_NEXT",
    "STALE_SESSION_PROTECTION",
    "PARTIAL_FAILURE_RECONCILIATION",
    "COUNTS_REFRESH",
  ]
  const requiredHomeQueryGates = [
    "HOME_CANONICAL_QUERY",
    "HOME_ID_ONLY_INITIAL",
    "HOME_ID_ONLY_REFRESH",
    "HOME_ID_ONLY_APPEND",
    "HOME_REFRESH_FAILURE_PRESERVES",
  ]
  const expectedHelperSuites = [
    {
      file: "src/utils/article-list-request-key.test.js",
      coverage: ["ALL_SORT_PREFERENCE_PRESERVED", "UNREAD_FILTER_PRESERVED"],
    },
    {
      file: "src/utils/article-list-filters.test.js",
      coverage: ["filtered-total-refresh-predicate"],
    },
    {
      file: "src/utils/reconcile-entries-after-mark-read.test.js",
      coverage: ["successful-mark-read-subset", "batch-reconciliation"],
    },
  ]
  const scenarios = [
    [
      "LIST_REGRESSION_MATRIX_COMPLETE",
      async () => {
        const registry = listRegressionMatrix
        const registered = registry.runtimeGates.map(({ name }) => name)
        const plannedNames = [...requiredListRegressionGates, ...requiredHomeQueryGates]
        const scenarioNames = scenarios
          .map(([name]) => name)
          .filter((name) => name !== "LIST_REGRESSION_MATRIX_COMPLETE")
        assert(
          JSON.stringify(registered.toSorted()) === JSON.stringify(plannedNames.toSorted()) &&
            JSON.stringify(registered.toSorted()) === JSON.stringify(scenarioNames.toSorted()),
          "Runtime gate registry does not exactly match the named integration scenarios",
        )
        const planOwned = registry.runtimeGates.filter(({ name }) =>
          requiredListRegressionGates.includes(name),
        )
        assert(
          JSON.stringify(planOwned.map(({ name }) => name).toSorted()) ===
            JSON.stringify(requiredListRegressionGates.toSorted()) &&
            planOwned.every(({ owner }) => owner === "scripts/tests/phase2c-list-regression.jsx"),
          "Plan-owned runtime gates are missing, renamed, duplicated, or assigned to another owner",
        )
        assert(
          JSON.stringify(registry.helperSuites) === JSON.stringify(expectedHelperSuites),
          "Helper-level suites are missing or claim broader coverage than their tests",
        )
      },
    ],
    [
      "NO_ALL_RANKING",
      async () => {
        await mount("all")
        assertIds([31, 12, 24])
      },
    ],
    [
      "NO_UNREAD_RANKING",
      async () => {
        await mount("all", { showStatus: "unread" })
        assertIds([31, 12, 24])
        assert(query().get("status") === "unread", "Unread status missing")
      },
    ],
    [
      "ALL_SORT_PREFERENCE_PRESERVED",
      async () => {
        await mount("all")
        assert(
          query().get("order") === "created_at" && query().get("direction") === "asc",
          "Initial preference ignored",
        )
        settingsState.set({
          ...settingsState.get(),
          orderBy: "published_at",
          orderDirection: "desc",
        })
        await waitFor(() => requests.length === 2 && contentState.get().isArticleListReady)
        assert(
          query(1).get("order") === "published_at" && query(1).get("direction") === "desc",
          "Updated preference ignored",
        )
        await settle()
        assertIds([31, 12, 24])
      },
    ],
    [
      "UNREAD_FILTER_PRESERVED",
      async () => {
        await mount(
          "all",
          { showStatus: "unread", orderBy: "published_at" },
          { filterString: "climate", filterDate: "2026-10-10" },
        )
        const params = query()
        assert(
          params.get("status") === "unread" && params.get("search") === "climate",
          "Configured unread search missing",
        )
        assert(
          params.get("published_after") === String(new Date(2026, 9, 10).getTime() / 1000) &&
            params.get("published_before") ===
              String(new Date(2026, 9, 10, 23, 59, 59).getTime() / 1000),
          `Configured date missing: ${params}`,
        )
        assertIds([31, 12, 24])
      },
    ],
    [
      "HOME_CANONICAL_QUERY",
      async () => {
        await mount(
          "home",
          { showStatus: "starred" },
          { filterString: "ignored", filterDate: "2026-10-10" },
          homeEntries,
        )
        canonical(query(), 2)
        await entriesApi.getHomeEntries()
        canonical(query(1), 2)
        await entriesApi.getHomeEntries({ pageSize: 1 })
        canonical(query(2), 1)
        const count = requests.length
        settingsState.set({
          ...settingsState.get(),
          showStatus: "all",
          orderBy: "changed_at",
          orderDirection: "desc",
        })
        contentState.set({ ...contentState.get(), filterString: "other", filterDate: null })
        await settle()
        assert(
          requests.length === count,
          "Ordinary status/sort/search/date controls refetched Home",
        )
        settingsState.set({ ...settingsState.get(), showHiddenFeeds: true })
        await waitFor(() => requests.length > count && contentState.get().isArticleListReady)
        canonical(query(count), 2, undefined, false)
        await entriesApi.getHomeEntries({ pageSize: 1 })
        canonical(query(count + 1), 1, undefined, false)
      },
    ],
    [
      "HOME_ID_ONLY_INITIAL",
      async () => {
        await mount("home", { removeDuplicates: "title" }, {}, [
          ...homeEntries,
          { ...homeEntries[0], title: "Duplicate must not replace first" },
        ])
        assertIds([101, 102])
        assert(
          contentState.get().entries[0].title === "Same title",
          "Home replaced the first occurrence",
        )
        assert(mutationRequests === 0, "Home marked functional duplicates read")
      },
    ],
    [
      "HOME_ID_ONLY_REFRESH",
      async () => {
        await mount("home", { removeDuplicates: "title" }, {}, homeEntries)
        respond = () => ({
          entries: [
            homeEntries[1],
            homeEntries[0],
            { ...homeEntries[1], title: "Duplicate must not replace first" },
          ],
          total: 8,
        })
        await controls.current.fetchArticleList()
        await settle()
        assertIds([102, 101])
        assert(
          contentState.get().entries[0].title === "Same title",
          "Home refresh replaced the first occurrence",
        )
        assert(mutationRequests === 0, "Home refresh marked functional duplicates read")
      },
    ],
    [
      "HOME_ID_ONLY_APPEND",
      async () => {
        await mount("home", { removeDuplicates: "title" }, {}, homeEntries)
        respond = () => ({
          entries: [
            homeEntries[1],
            entry(103, "2026-10-10T10:00:00Z", { title: "Same title" }),
            entry(103, "2026-10-10T10:00:00Z", { title: "Same title" }),
          ],
          total: 8,
        })
        await controls.current.loadMore()
        await settle()
        canonical(query(1), 2, 1_791_799_200)
        assertIds([101, 102, 103])
        assert(mutationRequests === 0, "Home append marked duplicates read")
      },
    ],
    [
      "HOME_REFRESH_FAILURE_PRESERVES",
      async () => {
        await mount("home", {}, {}, homeEntries)
        const snapshot = contentState.get().articleListSnapshotRevision
        respond = () => {
          throw new Error("Expected fixture refresh failure")
        }
        await controls.current.fetchArticleList()
        await settle()
        assertIds([101, 102])
        assert(
          contentState.get().total === 8 &&
            contentState.get().articleListError &&
            contentState.get().isArticleListReady,
          "Refresh failure lost committed snapshot/error",
        )
        assert(
          contentState.get().articleListSnapshotRevision === snapshot,
          "Failed refresh advanced successful snapshot revision",
        )
      },
    ],
    [
      "MARK_ALL_READ_SUCCESS",
      async () => {
        await mount("all", { showStatus: "unread" }, {}, ordinaryEntries)
        respond = serverRespond
        clickMarkAll()
        await waitFor(() => mutationRequests === 1 && countRefreshes === 1)
        assertIds([])
        assert(
          serverEntries.every(({ status }) => status === "read"),
          "Fast-path mutation did not mark server entries",
        )
      },
    ],
    [
      "MARK_ALL_READ_FILTER_SCOPE",
      async () => {
        const scoped = [
          entry(41, "2026-10-10T10:00:00Z", { title: "climate A" }),
          entry(42, "2026-10-10T11:00:00Z", { title: "climate B" }),
          entry(43, "2026-10-11T10:00:00Z", { title: "other" }),
        ]
        await mount(
          "all",
          { showStatus: "unread" },
          { filterString: "climate", filterDate: "2026-10-10" },
          scoped,
        )
        respond = serverRespond
        clickMarkAll()
        await waitFor(() => countRefreshes === 1)
        const batchQuery = requests
          .map((url) => new URL(url, "https://fixture.invalid").searchParams)
          .find((params) => params.get("limit") === "1000")
        assert(
          batchQuery?.get("search") === "climate" &&
            batchQuery.has("published_after") &&
            batchQuery.has("published_before"),
          "Batch request lost search/date scope",
        )
        assert(
          serverEntries.find(({ id }) => id === 43).status === "unread",
          "Out-of-scope entry was marked read",
        )
        assertIds([43])
      },
    ],
    [
      "MARK_ALL_READ_NO_JUMP_ON_FAILURE",
      async () => {
        await mount(
          "feed",
          { showStatus: "unread", markAllReadJumpToNext: true },
          {},
          ordinaryEntries,
        )
        respond = serverRespond
        mutationFailure = true
        clickMarkAll()
        await waitFor(() => countRefreshes === 1)
        assert(controls.current.path === "/feed/1", "Failed Mark All Read navigated away")
        assert(
          serverEntries.every(({ status }) => status === "unread"),
          "Failed mutation changed server fixture",
        )
      },
    ],
    [
      "MARK_ALL_READ_JUMP_TO_NEXT",
      async () => {
        await mount(
          "feed",
          { showStatus: "unread", markAllReadJumpToNext: true },
          {},
          ordinaryEntries,
        )
        respond = serverRespond
        clickMarkAll()
        await waitFor(() => controls.current.path === "/feed/2")
        assert(countRefreshes === 1, "Jump happened before refreshed counts")
      },
    ],
    [
      "STALE_SESSION_PROTECTION",
      async () => {
        await mount(
          "feed",
          { showStatus: "unread", markAllReadJumpToNext: true },
          {},
          ordinaryEntries,
        )
        respond = serverRespond
        let resolveMutation
        deferredMutation = {
          promise: new Promise((resolve) => {
            resolveMutation = resolve
          }),
        }
        clickMarkAll()
        await waitFor(() => mutationRequests === 1)
        dataState.setKey("sessionRevision", dataState.get().sessionRevision + 1)
        resolveMutation()
        await settle()
        assert(
          countRefreshes === 0 && controls.current.path === "/feed/1",
          "Old session mutation committed FooterPanel effects",
        )
      },
    ],
    [
      "PARTIAL_FAILURE_RECONCILIATION",
      async () => {
        const scoped = ordinaryEntries.map((item) => ({ ...item, title: `scope ${item.id}` }))
        await mount("all", { showStatus: "unread" }, { filterString: "scope" }, scoped)
        respond = (url) => {
          const response = serverRespond(url)
          const params = new URL(url, "https://fixture.invalid").searchParams
          return params.get("limit") === "1000"
            ? { ...response, entries: response.entries.slice(0, 2) }
            : response
        }
        mutationFailureAfter = 1
        clickMarkAll()
        await waitFor(() => mutationRequests === 2 && countRefreshes === 1)
        assertIds([24])
        assert(
          serverEntries.filter(({ status }) => status === "read").length === 2,
          "Failed later batch lost confirmed work",
        )
      },
    ],
    [
      "COUNTS_REFRESH",
      async () => {
        await mount("all", { showStatus: "unread" }, {}, ordinaryEntries)
        respond = serverRespond
        clickMarkAll()
        await waitFor(() => countRefreshes === 1)
        assert(dataState.get().unreadInfo[1] === 0, "Success did not refresh source count")
        await mount("all", { showStatus: "unread" }, {}, ordinaryEntries)
        respond = serverRespond
        mutationFailure = true
        clickMarkAll()
        await waitFor(() => countRefreshes === 1)
        assert(dataState.get().unreadInfo[1] === 2, "Failure did not refresh source count")
      },
    ],
  ]
  const listRegressionMatrix = {
    completenessGate: "LIST_REGRESSION_MATRIX_COMPLETE",
    runtimeGates: scenarios.slice(1).map(([name]) => ({
      name,
      owner: "scripts/tests/phase2c-list-regression.jsx",
      scope: requiredListRegressionGates.includes(name) ? "list-integration" : "home-query",
    })),
    helperSuites: expectedHelperSuites,
  }
  const runtimeOwners = new Map(
    listRegressionMatrix.runtimeGates.map(({ name, owner }) => [name, owner]),
  )
  const run = async () => {
    setRunning(true)
    setResults([])
    const nextResults = []
    for (const [name, scenario] of scenarios) {
      try {
        await scenario()
        nextResults.push({
          name,
          status: "PASS",
          owner:
            name === "LIST_REGRESSION_MATRIX_COMPLETE"
              ? "matrix-registry"
              : runtimeOwners.get(name),
          requests: [...requests],
        })
      } catch (error) {
        nextResults.push({
          name,
          status: "FAIL",
          owner:
            name === "LIST_REGRESSION_MATRIX_COMPLETE"
              ? "matrix-registry"
              : runtimeOwners.get(name),
          error: error.message,
          requests: [...requests],
        })
      }
      setResults([...nextResults])
    }
    setRunning(false)
  }
  return (
    <main>
      <h1>Phase 2C list regression</h1>
      <p>Deterministic local network fixtures; production list hooks and API adapters.</p>
      <button disabled={running} onClick={() => void run()}>
        Run list regression
      </button>
      <p data-testid="suite-summary">
        {running
          ? "RUNNING"
          : `${results.filter(({ status }) => status === "PASS").length}/${results.length} PASS`}
      </p>
      <section aria-labelledby="list-regression-matrix-heading">
        <h2 id="list-regression-matrix-heading">Regression matrix ownership</h2>
        <p>
          Integration behavior is exercised by its named runtime scenario. Helper suites below
          provide narrower unit coverage and do not replace those scenarios.
        </p>
        <pre data-testid="regression-matrix">{JSON.stringify(listRegressionMatrix, null, 2)}</pre>
      </section>
      {probe && (
        <AppDataContext.Provider
          value={{
            refreshCounts: async () => {
              countRefreshes += 1
              dataState.setKey("unreadInfo", {
                1: serverEntries.filter((item) => item.feed.id === 1 && item.status === "unread")
                  .length,
                2: 3,
              })
            },
          }}
        >
          <MemoryRouter initialEntries={[probe.source === "feed" ? "/feed/1" : "/all"]}>
            <ListProbe key={probe.key} source={probe.source} />
          </MemoryRouter>
        </AppDataContext.Provider>
      )}
      <pre data-testid="suite-results">{JSON.stringify(results, null, 2)}</pre>
    </main>
  )
}

const root =
  globalThis.__phase2cListRegressionRoot ??
  (globalThis.__phase2cListRegressionRoot = createRoot(document.querySelector("#root")))
root.render(<Harness />)

export default Harness

// Local deterministic harness: real list hooks/API adapters, mocked network boundary only.
/* eslint-disable react-compiler/react-compiler -- Deterministic fixture orchestration controls the mocked network boundary. */
import "@arco-design/web-react/es/_util/react-19-adapter"
import { useStore } from "@nanostores/react"
import Polyglot from "node-polyglot"
import React, { useLayoutEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import * as entriesApi from "@/apis/entries"
import apiClient from "@/apis/ofetch"
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
// Fallback exposes pre-implementation Home leaks while keeping the harness executable in RED.
const homeAdapter = (...args) =>
  entriesApi.getHomeEntries ? entriesApi.getHomeEntries(...args) : allAdapter(...args)
const controls = { current: null }
const requests = []
let respond
let mutationRequests = 0
apiClient.get = async (url) => {
  requests.push(url)
  return respond(url)
}
apiClient.put = async () => {
  mutationRequests += 1
  throw new Error("Unexpected mutation in request fixture")
}
polyglotState.setKey("polyglot", new Polyglot({ phrases: englishPhrases, locale: "en-US" }))

const ListProbe = ({ source }) => {
  const adapter = source === "home" ? homeAdapter : allAdapter
  const list = useArticleList(source, null, adapter)
  const pagination = useLoadMore()
  const content = useStore(contentState)
  useLayoutEffect(() => {
    controls.current = { ...list, loadMore: () => pagination.handleLoadMore(adapter) }
  })
  return (
    <ol aria-label="Committed entries">
      {content.entries.map(({ id, title }, index) => (
        <li key={`${id}:${index}`} data-entry-id={id}>
          {title} ({id})
        </li>
      ))}
    </ol>
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
    respond = () => ({ entries, total: 8 })
    dataState.setKey("sessionRevision", dataState.get().sessionRevision + 1)
    settingsState.set({
      ...getDefaultSettings(),
      removeDuplicates: "none",
      pageSize: 2,
      showHiddenFeeds: false,
      showStatus: "all",
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
      infoId: null,
      isArticleListReady: false,
      loadMoreVisible: false,
      ...contentChanges,
    })
    setProbe({ source, key: contentState.get().articleListRevision })
    await waitFor(() => contentState.get().isArticleListReady && controls.current)
    await settle()
  }
  const scenarios = [
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
        await mount("home", { removeDuplicates: "title" }, {}, homeEntries)
        assertIds([101, 102])
        assert(mutationRequests === 0, "Home marked functional duplicates read")
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
  ]
  const run = async () => {
    setRunning(true)
    setResults([])
    const nextResults = []
    for (const [name, scenario] of scenarios) {
      try {
        await scenario()
        nextResults.push({ name, status: "PASS", requests: [...requests] })
      } catch (error) {
        nextResults.push({ name, status: "FAIL", error: error.message, requests: [...requests] })
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
      {probe && <ListProbe key={probe.key} source={probe.source} />}
      <pre data-testid="suite-results">{JSON.stringify(results, null, 2)}</pre>
    </main>
  )
}

const root =
  globalThis.__phase2cListRegressionRoot ??
  (globalThis.__phase2cListRegressionRoot = createRoot(document.querySelector("#root")))
root.render(<Harness />)

export default Harness

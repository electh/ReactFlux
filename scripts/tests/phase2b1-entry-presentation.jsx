/* eslint-disable react-refresh/only-export-components */

import "@arco-design/web-react/es/_util/react-19-adapter"
import "@arco-design/web-react/dist/css/arco.css"
import Polyglot from "node-polyglot"
import React, { useState } from "react"
import ReactDOM from "react-dom/client"

import {
  ARTICLE_PARAGRAPH,
  entryPresentationFixtures,
} from "./fixtures/phase2b1-entry-presentation"

import ArticleGridCard from "@/components/Article/ArticleGridCard"
import "@/components/Article/ArticleEntry.css"
import { polyglotState } from "@/hooks/useLanguage"
import englishPhrases from "@/locales/en-US.json"
import { getDefaultSettings, settingsState } from "@/store/settingsState"
import prepareEntry from "@/utils/entry-presentation"

import "./phase2b1-entry-presentation.css"

settingsState.set({
  ...getDefaultSettings(),
  articleListLayout: "card",
  showCardSummary: true,
  showDetailedRelativeTime: false,
  showEstimatedReadingTime: true,
  showFeedIcon: false,
})
polyglotState.setKey("polyglot", new Polyglot({ phrases: englishPhrases, locale: "en-US" }))

const makeVisualEntry = ({ content, id, starred = false, title }) =>
  prepareEntry({
    author: "NewsFlux Design Desk",
    content,
    enclosures: [],
    feed: { site_url: "https://newsflux.home/", title: "Design Desk" },
    id,
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reading_time: 4,
    starred,
    status: "unread",
    title,
    url: `https://newsflux.home/entry/${id}`,
  })

const visualEntries = [
  {
    entry: makeVisualEntry({
      content: `<figure><img src="/scripts/tests/fixtures/valid-horizontal.svg" width="1600" height="900" alt="Editorial landscape"></figure><p>${ARTICLE_PARAGRAPH}</p>`,
      id: 90_001,
      title: "Unread · editorial image",
    }),
    name: "unread",
    state: "Unread",
  },
  {
    entry: makeVisualEntry({
      content: `<figure><img src="/scripts/tests/fixtures/valid-vertical.svg" width="600" height="1000" alt="Vertical editorial portrait"></figure><p>${ARTICLE_PARAGRAPH}</p>`,
      id: 90_002,
      starred: true,
      title: "Read and starred · vertical image",
    }),
    name: "read-starred",
    state: "Read + starred",
  },
  {
    entry: makeVisualEntry({
      content: `<img src="/scripts/tests/fixtures/broken-image.jpg" width="1800" height="1000" alt="Broken first candidate"><img src="/scripts/tests/fixtures/valid-hero.svg" width="1200" height="675" alt="Valid fallback image"><p>${ARTICLE_PARAGRAPH}</p>`,
      id: 90_003,
      title: "Broken first candidate · fallback",
    }),
    name: "fallback",
    state: "Fallback image",
  },
  {
    entry: makeVisualEntry({
      content: `<p>${ARTICLE_PARAGRAPH}</p>`,
      id: 90_004,
      title: "No image · text-first card",
    }),
    name: "no-image",
    state: "No image",
  },
]

const makeBenchmarkEntry = (id, content) => ({
  content,
  enclosures: [],
  feed: { site_url: "https://example.test/feed", title: "Benchmark" },
  id,
  published_at: "2026-10-10T12:00:00.000Z",
  reading_time: 3,
  status: "unread",
  title: `Benchmark entry ${id}`,
})

const BENCHMARK_HTML = `<article><figure><img src="https://example.test/images/feature.jpg" width="1600" height="900" alt="Main editorial photograph"></figure><p>${ARTICLE_PARAGRAPH}</p><p>A second paragraph adds context for the report and gives the reader enough background to understand the timeline and decisions made by the people involved.</p><div class="share-buttons"><a href="https://example.test/share">Share this article</a></div><video poster="https://example.test/images/video-poster.jpg" width="1280" height="720"></video></article>`

const waitForImages = (timeout = 1800) =>
  new Promise((resolve) => {
    globalThis.setTimeout(resolve, timeout)
  })

const runCorpus = () => {
  const fetchBefore = globalThis.__phase2b1FetchCalls
  const results = entryPresentationFixtures.map((fixture) => {
    const entry = prepareEntry(fixture.entry)
    const selectedCandidate = entry.coverCandidates[0] ?? null
    const imagePass = (entry.coverSource ?? null) === fixture.expectedImage
    const imageReason = entry.coverReason
    const imageReasonPass = fixture.expectedImageReason
      ? imageReason.includes(fixture.expectedImageReason)
      : true
    const imageRejectedReasonPass = fixture.expectedRejectedImageReason
      ? (entry.coverRejectedReasons[fixture.expectedRejectedImageReason] ?? 0) > 0
      : true
    const excerptPass = entry.previewText === fixture.expectedExcerpt
    const excerptReasonPass = entry.previewReason.includes(fixture.expectedPreviewReason)
    const excerptConfidencePass = entry.previewText
      ? entry.previewConfidence > 0 && entry.previewConfidence <= 0.95
      : entry.previewConfidence === 0

    return {
      coverReason: imageReason,
      excerptReason: entry.previewReason,
      excerptSource: entry.previewSource,
      excerptConfidence: entry.previewConfidence,
      excerptPass,
      excerptConfidencePass,
      excerptReasonPass,
      expectedExcerpt: fixture.expectedExcerpt,
      expectedImage: fixture.expectedImage,
      expectedReason: fixture.expectedImageReason || fixture.expectedPreviewReason,
      id: fixture.id,
      imageRejectedReasonPass,
      imagePass,
      imageReasonPass,
      imageScore: selectedCandidate?.score ?? null,
      imageSourceType: selectedCandidate?.kind ?? "none",
      name: fixture.name,
      kind: fixture.kind,
      selectedExcerpt: entry.previewText,
      selectedImage: entry.coverSource,
      selectedReason: selectedCandidate?.reason ?? imageReason,
    }
  })

  const imageResults = results.filter(({ kind }) => kind === "image")
  const excerptResults = results.filter(({ kind }) => kind === "excerpt")

  return {
    imageFixturesPass: imageResults.filter(
      ({ imagePass, imageReasonPass, imageRejectedReasonPass }) =>
        imagePass && imageReasonPass && imageRejectedReasonPass,
    ).length,
    imageFixturesTotal: imageResults.length,
    excerptFixturesPass: excerptResults.filter(
      ({ excerptPass, excerptReasonPass, excerptConfidencePass }) =>
        excerptPass && excerptReasonPass && excerptConfidencePass,
    ).length,
    excerptFixturesTotal: excerptResults.length,
    noExtraNetworkRequests: globalThis.__phase2b1FetchCalls === fetchBefore,
    results,
  }
}

const runBenchmarks = () => {
  const samples = []
  const fetchBefore = globalThis.__phase2b1FetchCalls

  for (const count of [50, 500, 2500]) {
    const start = performance.now()
    for (let index = 0; index < count; index += 1) {
      prepareEntry(makeBenchmarkEntry(index + 1, BENCHMARK_HTML))
    }
    const elapsed = performance.now() - start
    samples.push({
      averageMsPerEntry: Number((elapsed / count).toFixed(4)),
      count,
      totalMs: Number(elapsed.toFixed(2)),
    })
  }

  return {
    noExtraNetworkRequests: globalThis.__phase2b1FetchCalls === fetchBefore,
    samples,
  }
}

const runVisualChecks = () => {
  const unread = document.querySelector('[data-example="unread"] .grid-card-title')
  const read = document.querySelector('[data-example="read-starred"] .grid-card-title')
  const readStar = document.querySelector('[data-example="read-starred"] .grid-card-star')
  const horizontalImage = document.querySelector('[data-example="unread"] .grid-card-cover')
  const verticalImage = document.querySelector('[data-example="read-starred"] .grid-card-cover')
  const noImageCard = document.querySelector('[data-example="no-image"]')
  const focusTarget = document.querySelector('[data-example="unread"] .grid-card-wrapper')
  focusTarget?.focus({ focusVisible: true })

  const unreadWeight = unread ? getComputedStyle(unread).fontWeight : ""
  const readWeight = read ? getComputedStyle(read).fontWeight : ""
  const horizontalFit = horizontalImage ? getComputedStyle(horizontalImage).objectFit : ""
  const verticalFit = verticalImage ? getComputedStyle(verticalImage).objectFit : ""
  const focusOutline = focusTarget ? getComputedStyle(focusTarget).outlineStyle : ""

  return {
    focusVisible: focusOutline !== "none" && getComputedStyle(focusTarget).outlineWidth !== "0px",
    horizontalCover: horizontalFit === "cover",
    noImageIsTextFirst: noImageCard?.querySelector("img") === null,
    readStarredDistinct: readStar ? Number(getComputedStyle(readStar).opacity) === 1 : false,
    readUnreadDistinct: Number(unreadWeight) > Number(readWeight),
    verticalContain: verticalFit === "contain",
  }
}

const Harness = () => {
  const [suiteResult, setSuiteResult] = useState(null)
  const [running, setRunning] = useState(false)

  const run = async () => {
    setRunning(true)
    await waitForImages(300)
    const corpus = runCorpus()
    const benchmark = runBenchmarks()
    await waitForImages()

    const fallbackImage = document.querySelector('[data-example="fallback"] .grid-card-cover')
    const fallbackPass = Boolean(fallbackImage?.src.endsWith("/valid-hero.svg"))
    const visuals = runVisualChecks()
    const result = { benchmark, corpus, fallbackPass, visuals }
    globalThis.__phase2b1Result = result
    setSuiteResult(result)
    setRunning(false)
  }

  return (
    <main className="phase2b1-suite">
      <h1>Phase 2B.1 · content presentation regression</h1>
      <p className="phase2b1-intro">
        Local fixture run. Image URLs in the article data are inspected only; the preparation
        pipeline does not fetch article pages or images.
      </p>
      <button className="phase2b1-run" disabled={running} onClick={() => void run()}>
        {running ? "Running corpus and benchmark…" : "Run corpus and benchmark"}
      </button>
      <pre className="phase2b1-results" data-testid="suite-results">
        {suiteResult ? JSON.stringify(suiteResult, null, 2) : "Not run yet."}
      </pre>
      <h2 className="phase2b1-preview-heading">Read state and image handling</h2>
      <section className="phase2b1-preview-grid">
        {visualEntries.map(({ entry, name, state }) => (
          <div key={entry.id} className="phase2b1-preview-card" data-example={name}>
            <span className="phase2b1-preview-state">{state}</span>
            <a
              aria-label={entry.title}
              className={`article-entry grid-card-wrapper ${name === "unread" ? "unread" : "read"} ${name === "read-starred" ? "selected" : ""}`}
              href="#"
              tabIndex={0}
              onClick={(event) => event.preventDefault()}
            >
              <ArticleGridCard entry={entry} previewContent={entry.previewText} />
            </a>
          </div>
        ))}
      </section>
    </main>
  )
}

globalThis.__phase2b1FetchCalls = 0
const originalFetch = globalThis.fetch.bind(globalThis)
globalThis.fetch = (...args) => {
  globalThis.__phase2b1FetchCalls += 1
  return originalFetch(...args)
}

const rootElement = document.querySelector("#root")
const root = globalThis.__phase2b1Root ?? ReactDOM.createRoot(rootElement)
globalThis.__phase2b1Root = root
root.render(<Harness />)

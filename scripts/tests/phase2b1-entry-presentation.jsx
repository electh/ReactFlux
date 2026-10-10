/* eslint-disable react-refresh/only-export-components */

import "@arco-design/web-react/es/_util/react-19-adapter"
import "@arco-design/web-react/dist/css/arco.css"
import Polyglot from "node-polyglot"
import React, { useState } from "react"
import ReactDOM from "react-dom/client"

import {
  ARTICLE_PARAGRAPH,
  cardSynopsisFixtures,
  cardSynopsisPresenterFixtures,
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
  {
    entry: makeVisualEntry({
      content: `<p>The regional transit authority published a detailed service plan this morning, listing new schedules, station changes, transfer rules, and several other updates for commuters across the city. ${"The extended notice also repeats background information for passengers. ".repeat(4)}</p>`,
      id: 90_005,
      title: "Regional transit authority publishes a detailed city service plan",
    }),
    name: "synopsis-truncated",
    state: "Two-line synopsis",
  },
]

const synopsisPresentationEntries = [
  ...cardSynopsisFixtures.map((fixture) => ({
    entry: prepareEntry(fixture.entry),
    name: `synopsis-${fixture.id}`,
    state: fixture.expectedSource === "none" ? "No eligible sentence" : fixture.id,
  })),
  ...cardSynopsisPresenterFixtures.map((fixture) => ({
    ...fixture,
    state: "Excerpt without synopsis",
  })),
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
    const excerptSourcePass = entry.previewSource === fixture.expectedPreviewSource

    return {
      coverReason: imageReason,
      excerptReason: entry.previewReason,
      excerptSource: entry.previewSource,
      excerptConfidence: entry.previewConfidence,
      excerptPass,
      excerptConfidencePass,
      excerptSourcePass,
      excerptReasonPass,
      expectedExcerpt: fixture.expectedExcerpt,
      expectedPreviewSource: fixture.expectedPreviewSource,
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
  const expectedNonempty = excerptResults.filter(
    ({ expectedExcerpt }) => expectedExcerpt.trim().length > 0,
  )
  const actualNonempty = excerptResults.filter(
    ({ selectedExcerpt }) => selectedExcerpt.trim().length > 0,
  )
  const truePositive = excerptResults.filter(
    ({ expectedExcerpt, selectedExcerpt }) => expectedExcerpt.trim() && selectedExcerpt.trim(),
  )
  const sourceCounts = Object.fromEntries(
    ["paragraph", "block", "document-fallback", "none"].map((source) => [
      source,
      excerptResults.filter(({ excerptSource }) => excerptSource === source).length,
    ]),
  )
  const synopsisResults = cardSynopsisFixtures.map((fixture) => {
    const entry = prepareEntry(fixture.entry)
    const textPass =
      fixture.expectedSource === "none"
        ? entry.cardSynopsis === ""
        : fixture.expectedSentence
          ? entry.cardSynopsisTruncated
            ? entry.cardSynopsis.endsWith("…") &&
              fixture.expectedSentence.startsWith(entry.cardSynopsis.slice(0, -1)) &&
              /\s/u.test(fixture.expectedSentence[entry.cardSynopsis.length - 1] ?? "")
            : entry.cardSynopsis === fixture.expectedSentence
          : Boolean(entry.cardSynopsis)
    const indexPass = entry.cardSynopsisSentenceIndex === fixture.expectedSentenceIndex
    const sourcePass = entry.cardSynopsisSource === fixture.expectedSource
    const overlapPass =
      entry.cardSynopsisTitleOverlapAssisted === fixture.expectedTitleOverlapAssisted
    const truncatedPass = entry.cardSynopsisTruncated === fixture.expectedTruncated
    const previewPass = fixture.expectedPreviewNonempty ? Boolean(entry.previewText) : true

    return {
      actualSentenceIndex: entry.cardSynopsisSentenceIndex,
      expectedSentence: fixture.expectedSentence ?? null,
      expectedSentenceIndex: fixture.expectedSentenceIndex,
      expectedSource: fixture.expectedSource,
      expectedPreviewNonempty: fixture.expectedPreviewNonempty,
      expectedTitleOverlapAssisted: fixture.expectedTitleOverlapAssisted,
      expectedTruncated: fixture.expectedTruncated,
      id: fixture.id,
      isFirstSentence: entry.cardSynopsisIsFirstSentence,
      name: fixture.name,
      selectedSynopsis: entry.cardSynopsis,
      source: entry.cardSynopsisSource,
      titleOverlapAssisted: entry.cardSynopsisTitleOverlapAssisted,
      truncated: entry.cardSynopsisTruncated,
      length: entry.cardSynopsis.length,
      previewText: entry.previewText,
      pass: textPass && indexPass && sourcePass && overlapPass && truncatedPass && previewPass,
      previewPass,
      sourcePass,
    }
  })
  const synopsisLengths = synopsisResults.map(({ length }) => length).filter((length) => length > 0)
  const synopsisSourceCounts = Object.fromEntries(
    ["sentence", "excerpt-fallback", "none"].map((source) => [
      source,
      synopsisResults.filter((result) => result.source === source).length,
    ]),
  )

  return {
    excerptCoverage: {
      falseEmpty: excerptResults.filter(
        ({ expectedExcerpt, selectedExcerpt }) =>
          expectedExcerpt.trim().length > 0 && selectedExcerpt.trim().length === 0,
      ).length,
      falsePositive: excerptResults.filter(
        ({ expectedExcerpt, selectedExcerpt }) =>
          expectedExcerpt.trim().length === 0 && selectedExcerpt.trim().length > 0,
      ).length,
      nonemptyActual: actualNonempty.length,
      nonemptyExpected: expectedNonempty.length,
      precision: actualNonempty.length > 0 ? truePositive.length / actualNonempty.length : null,
      coverage: expectedNonempty.length > 0 ? truePositive.length / expectedNonempty.length : null,
      sourceCounts,
    },
    imageFixturesPass: imageResults.filter(
      ({ imagePass, imageReasonPass, imageRejectedReasonPass }) =>
        imagePass && imageReasonPass && imageRejectedReasonPass,
    ).length,
    imageFixturesTotal: imageResults.length,
    synopsis: {
      equalsFirstSentence: synopsisResults.filter(({ isFirstSentence }) => isFirstSentence).length,
      differsFromFirstSentence: synopsisResults.filter(({ isFirstSentence }) => !isFirstSentence)
        .length,
      fallbackToExcerpt: synopsisSourceCounts["excerpt-fallback"],
      synopsisNone: synopsisSourceCounts.none,
      excerptFallbackInternal: synopsisSourceCounts["excerpt-fallback"],
      length: {
        maximum: Math.max(0, ...synopsisLengths),
        minimum: Math.min(...synopsisLengths),
      },
      selectionCount: synopsisSourceCounts.sentence,
      sourceSentenceIndices: synopsisResults.map(({ actualSentenceIndex, id }) => ({
        id,
        index: actualSentenceIndex,
      })),
      sourceCounts: synopsisSourceCounts,
      titleOverlapAssistedSelection: synopsisResults.filter(
        ({ titleOverlapAssisted }) => titleOverlapAssisted,
      ).length,
      truncatedCount: synopsisResults.filter(({ truncated }) => truncated).length,
      fixturesPass: synopsisResults.filter(({ pass }) => pass).length,
      fixturesTotal: synopsisResults.length,
      results: synopsisResults,
    },
    excerptFixturesPass: excerptResults.filter(
      ({ excerptPass, excerptReasonPass, excerptConfidencePass, excerptSourcePass }) =>
        excerptPass && excerptReasonPass && excerptConfidencePass && excerptSourcePass,
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

const measureNaturalSummary = (summary) => {
  const computed = getComputedStyle(summary)
  const bounds = summary.getBoundingClientRect()
  const clone = summary.cloneNode(true)
  const copiedProperties = [
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "line-height",
    "letter-spacing",
    "text-align",
    "text-indent",
    "text-transform",
    "white-space",
    "word-break",
    "overflow-wrap",
    "box-sizing",
    "padding-inline-start",
    "padding-inline-end",
    "border-inline-start-width",
    "border-inline-end-width",
  ]

  for (const property of copiedProperties) {
    clone.style.setProperty(property, computed.getPropertyValue(property))
  }
  clone.style.setProperty("position", "fixed")
  clone.style.setProperty("left", "-10000px")
  clone.style.setProperty("top", "0")
  clone.style.setProperty("visibility", "hidden")
  clone.style.setProperty("pointer-events", "none")
  clone.style.setProperty("display", "block")
  clone.style.setProperty("width", `${bounds.width}px`)
  clone.style.setProperty("height", "auto")
  clone.style.setProperty("min-height", "0")
  clone.style.setProperty("max-height", "none")
  clone.style.setProperty("overflow", "visible")
  clone.style.setProperty("-webkit-line-clamp", "unset")
  clone.style.setProperty("line-clamp", "none")
  clone.style.setProperty("-webkit-box-orient", "initial")
  document.body.append(clone)

  const naturalUnclampedHeight = clone.getBoundingClientRect().height
  clone.remove()
  const lineHeight = Number.parseFloat(computed.lineHeight)

  return {
    lineHeight,
    naturalLineCount:
      lineHeight > 0 ? Math.max(1, Math.ceil(naturalUnclampedHeight / lineHeight - 0.01)) : null,
    naturalUnclampedHeight,
    renderedClampedHeight: bounds.height,
    text: summary.textContent ?? "",
  }
}

const runVisualChecks = () => {
  const unread = document.querySelector('[data-example="unread"] .grid-card-title')
  const read = document.querySelector('[data-example="read-starred"] .grid-card-title')
  const readStar = document.querySelector('[data-example="read-starred"] .grid-card-star')
  const readImage = document.querySelector('[data-example="read-starred"] .grid-card-cover')
  const readSummary = document.querySelector('[data-example="read-starred"] .grid-card-summary')
  const readMeta = document.querySelector('[data-example="read-starred"] .grid-card-meta')
  const horizontalImage = document.querySelector('[data-example="unread"] .grid-card-cover')
  const verticalImage = document.querySelector('[data-example="read-starred"] .grid-card-cover')
  const noImageCard = document.querySelector('[data-example="no-image"]')
  const focusTarget = document.querySelector('[data-example="unread"] .grid-card-wrapper')
  const truncatedEntry = visualEntries.find(({ name }) => name === "synopsis-truncated")?.entry
  const truncatedSummary = document.querySelector(
    '[data-example="synopsis-truncated"] .grid-card-summary',
  )
  const truncatedSummaryStyle = truncatedSummary ? getComputedStyle(truncatedSummary) : null
  const synopsisLineHeight = truncatedSummaryStyle
    ? Number.parseFloat(truncatedSummaryStyle.lineHeight)
    : 0
  const synopsisHeight = truncatedSummary?.getBoundingClientRect().height ?? 0
  focusTarget?.focus({ focusVisible: true })

  const unreadWeight = unread ? getComputedStyle(unread).fontWeight : ""
  const readWeight = read ? getComputedStyle(read).fontWeight : ""
  const readTitleColor = read ? getComputedStyle(read).color : ""
  const readImageFilter = readImage ? getComputedStyle(readImage).filter : ""
  const readSummaryColor = readSummary ? getComputedStyle(readSummary).color : ""
  const readMetaColor = readMeta ? getComputedStyle(readMeta).color : ""
  const horizontalFit = horizontalImage ? getComputedStyle(horizontalImage).objectFit : ""
  const verticalFit = verticalImage ? getComputedStyle(verticalImage).objectFit : ""
  const focusOutline = focusTarget ? getComputedStyle(focusTarget).outlineStyle : ""
  const truncatedSynopsis = truncatedEntry?.cardSynopsis ?? ""
  const fitMeasurements = [
    ...document.querySelectorAll("[data-synopsis-fit] .grid-card-summary"),
  ].map((summary) => {
    const measured = measureNaturalSummary(summary)
    return {
      ...measured,
      name: summary.closest("[data-example]")?.dataset.example ?? "unknown",
      length: measured.text.length,
      clampRequired: measured.naturalLineCount > 2,
    }
  })
  const pipelineNoSynopsisEntry = synopsisPresentationEntries.find(
    ({ entry }) => entry.cardSynopsisSource === "none",
  )?.entry
  const pipelineNoSynopsisSummary = document.querySelector(
    '[data-example="synopsis-S12"] .grid-card-summary',
  )
  const explicitEmptySynopsisFixture = cardSynopsisPresenterFixtures[0]
  const explicitEmptySynopsisSummary = document.querySelector(
    '[data-example="presenter-explicit-empty"] .grid-card-summary',
  )
  const rawExcerptFallbackCount = [
    {
      entry: explicitEmptySynopsisFixture.entry,
      selector: '[data-example="presenter-explicit-empty"] .grid-card-summary',
    },
    {
      entry: pipelineNoSynopsisEntry,
      selector: '[data-example="synopsis-S12"] .grid-card-summary',
    },
  ].filter(({ entry, selector }) => {
    const summary = document.querySelector(selector)
    return (
      Boolean(entry?.previewText) &&
      !entry?.cardSynopsis &&
      summary?.textContent.trim() === entry.previewText.trim()
    )
  }).length
  const synopsisLengths = fitMeasurements.map(({ length }) => length)
  const clampRequiredCount = fitMeasurements.filter(({ clampRequired }) => clampRequired).length
  const maxNaturalLines = Math.max(
    0,
    ...fitMeasurements.map(({ naturalLineCount }) => naturalLineCount ?? 0),
  )
  const truncatedPrefix = truncatedSynopsis.endsWith("…") ? truncatedSynopsis.slice(0, -1) : ""
  const truncatedOriginal = truncatedEntry?.content
    ?.replaceAll(/<[^>]*>/g, "")
    .replaceAll(/\s+/g, " ")
    .trim()

  return {
    twoLineSynopsis:
      Boolean(truncatedSummary) &&
      (truncatedSummaryStyle?.getPropertyValue("-webkit-line-clamp") === "2" ||
        truncatedSummaryStyle?.getPropertyValue("line-clamp") === "2") &&
      synopsisHeight <= synopsisLineHeight * 2 + 1,
    noHorizontalOverflow:
      document.documentElement.scrollWidth <= window.innerWidth &&
      document.body.scrollWidth <= window.innerWidth,
    noMidWordCut:
      Boolean(truncatedPrefix) &&
      truncatedOriginal?.startsWith(truncatedPrefix) &&
      /\s/u.test(truncatedOriginal?.[truncatedPrefix.length] ?? ""),
    ellipsisWhenNeeded:
      Boolean(truncatedEntry?.cardSynopsisTruncated) && truncatedSynopsis.endsWith("…"),
    presenterExplicitEmptySuppressesSummary:
      explicitEmptySynopsisFixture.expectedRenderedSummary === null &&
      Boolean(explicitEmptySynopsisFixture.entry.previewText) &&
      !explicitEmptySynopsisFixture.entry.cardSynopsis &&
      explicitEmptySynopsisSummary === null,
    pipelineExcerptWithoutSynopsisSuppressesSummary:
      Boolean(pipelineNoSynopsisEntry?.previewText) &&
      pipelineNoSynopsisEntry?.cardSynopsisSource === "none" &&
      !pipelineNoSynopsisEntry?.cardSynopsis &&
      pipelineNoSynopsisSummary === null,
    presenterRawExcerptFallbackCount: rawExcerptFallbackCount,
    presenterRawExcerptFallbackZero: rawExcerptFallbackCount === 0,
    naturalSynopsisLinesLe2: fitMeasurements.length > 0 && clampRequiredCount === 0,
    naturalSynopsisFit: {
      averageSynopsisLength:
        synopsisLengths.length > 0
          ? Number(
              (
                synopsisLengths.reduce((sum, length) => sum + length, 0) / synopsisLengths.length
              ).toFixed(1),
            )
          : 0,
      clampRequiredCount,
      count: fitMeasurements.length,
      maxNaturalLines,
      maximumSynopsisLength: Math.max(0, ...synopsisLengths),
      measurements: fitMeasurements,
    },
    synopsisDebug: {
      lineClamp: truncatedSummary
        ? truncatedSummaryStyle.getPropertyValue("-webkit-line-clamp")
        : "missing-summary",
      lineHeight: synopsisLineHeight,
      renderedHeight: synopsisHeight,
      synopsis: truncatedSynopsis,
      truncated: truncatedEntry?.cardSynopsisTruncated ?? null,
    },
    viewport: { height: window.innerHeight, width: window.innerWidth },
    textFirstCard: noImageCard?.querySelector("img") === null,
    imageCard: Boolean(document.querySelector('[data-example="unread"] .grid-card-cover')),
    focusVisible: focusOutline !== "none" && getComputedStyle(focusTarget).outlineWidth !== "0px",
    horizontalCover: horizontalFit === "cover",
    noImageIsTextFirst: noImageCard?.querySelector("img") === null,
    readImageUndesaturated: readImageFilter === "none",
    readMetadataContrast: readMetaColor === readTitleColor,
    readPreviewContrast: readSummaryColor === readTitleColor,
    readTitleNormalWeight: Number(readWeight) <= 400,
    readStarredDistinct: readStar ? Number(getComputedStyle(readStar).opacity) === 1 : false,
    readUnreadDistinct: Number(unreadWeight) > Number(readWeight),
    verticalContain: verticalFit === "contain",
  }
}

globalThis.__phase2b1RunVisualChecks = runVisualChecks

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
      <h2 className="phase2b1-preview-heading">Synopsis selection and natural fit</h2>
      <section className="phase2b1-preview-grid phase2b1-synopsis-grid">
        {synopsisPresentationEntries.map(({ entry, name, state }) => (
          <div
            key={entry.id}
            className="phase2b1-preview-card"
            data-example={name}
            data-synopsis-fit=""
          >
            <span className="phase2b1-preview-state">{state}</span>
            <a
              aria-label={entry.title}
              className="article-entry grid-card-wrapper read"
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

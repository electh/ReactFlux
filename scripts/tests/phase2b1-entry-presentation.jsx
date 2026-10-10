/* eslint-disable react-refresh/only-export-components */

import "@arco-design/web-react/es/_util/react-19-adapter"
import "@arco-design/web-react/dist/css/arco.css"
import Polyglot from "node-polyglot"
import React, { useState } from "react"
import ReactDOM from "react-dom/client"

import {
  ARTICLE_PARAGRAPH,
  cardDeckFixtures,
  cardDeckPresenterFixtures,
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

const CARD_VISUAL_DECK = "Researchers published findings from a new reader study."

const visualEntries = [
  {
    entry: makeVisualEntry({
      content: `<figure><img src="/scripts/tests/fixtures/valid-horizontal.svg" width="1600" height="900" alt="Editorial landscape"></figure><p>${CARD_VISUAL_DECK}</p>`,
      id: 90_001,
      title: "Unread · editorial image",
    }),
    name: "unread",
    state: "Unread",
  },
  {
    entry: makeVisualEntry({
      content: `<figure><img src="/scripts/tests/fixtures/valid-vertical.svg" width="600" height="1000" alt="Vertical editorial portrait"></figure><p>${CARD_VISUAL_DECK}</p>`,
      id: 90_002,
      starred: true,
      title: "Read and starred · vertical image",
    }),
    name: "read-starred",
    state: "Read + starred",
  },
  {
    entry: makeVisualEntry({
      content: `<img src="/scripts/tests/fixtures/broken-image.jpg" width="1800" height="1000" alt="Broken first candidate"><img src="/scripts/tests/fixtures/valid-hero.svg" width="1200" height="675" alt="Valid fallback image"><p>${CARD_VISUAL_DECK}</p>`,
      id: 90_003,
      title: "Broken first candidate · fallback",
    }),
    name: "fallback",
    state: "Fallback image",
  },
  {
    entry: makeVisualEntry({
      content: `<p>${CARD_VISUAL_DECK}</p>`,
      id: 90_004,
      title: "No image · text-first card",
    }),
    name: "no-image",
    state: "No image",
  },
  {
    entry: makeVisualEntry({
      content:
        "<p>Durante o encontro, artistas e profissionais conversaram sobre o futuro da produção audiovisual brasileira.</p><p>A carta pede ao Congresso que proteja a democracia e a liberdade no cinema.</p>",
      id: 90_005,
      title: "Kleber Mendonça Filho, Wagner Moura e mais assinam carta aberta",
    }),
    name: "card-deck-long",
    state: "Editorial deck · long source sentence",
  },
]

const cardDeckPresentationEntries = [
  ...cardDeckFixtures.map((fixture) => ({
    entry: prepareEntry(fixture.entry),
    expectedPresenterDeck: fixture.expectedPresenterDeck,
    name: `card-deck-${fixture.id}`,
    state: fixture.expectedSource === "none" ? "Empty deck" : fixture.id,
  })),
  ...cardDeckPresenterFixtures.map((fixture) => ({
    ...fixture,
    state: "Empty deck with excerpt present",
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
const VISIBLE_DECK_SELECTOR = ".grid-card-summary:not(.grid-card-summary-measure-probe)"

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
  const cardDeckResults = cardDeckFixtures.map((fixture) => {
    const entry = prepareEntry(fixture.entry)
    const textPass = entry.cardDeck === fixture.expectedDeck
    const sourcePass = entry.cardDeckSource === fixture.expectedSource
    const indexPass = entry.cardDeckSentenceIndex === fixture.expectedSentenceIndex
    const previewPass = fixture.expectedPreviewNonempty
      ? Boolean(entry.previewText)
      : !entry.previewText

    return {
      actualSentenceIndex: entry.cardDeckSentenceIndex,
      candidateCount: entry.cardDeckCandidates.length,
      candidateScores: entry.cardDeckCandidates.map(({ score }) => score),
      rankedCandidateTexts: entry.cardDeckCandidates.map(({ text }) => text),
      expectedDeck: fixture.expectedDeck,
      expectedSentenceIndex: fixture.expectedSentenceIndex,
      expectedSource: fixture.expectedSource,
      expectedPreviewNonempty: fixture.expectedPreviewNonempty,
      id: fixture.id,
      name: fixture.name,
      selectedDeck: entry.cardDeck,
      source: entry.cardDeckSource,
      length: entry.cardDeck.length,
      previewText: entry.previewText,
      pass: textPass && sourcePass && indexPass && previewPass,
      previewPass,
      sourcePass,
    }
  })
  const cardDeckLengths = cardDeckResults.map(({ length }) => length).filter((length) => length > 0)
  const cardDeckSourceCounts = Object.fromEntries(
    ["sentence", "excerpt", "none"].map((source) => [
      source,
      cardDeckResults.filter((result) => result.source === source).length,
    ]),
  )
  const boilerplatePattern =
    /(?:comments?|comentários?|compartilhe|newsletter|publicidade|anúncio|leia mais|continue lendo)/iu
  const noRawBoilerplate = cardDeckResults.every(
    ({ selectedDeck }) => !boilerplatePattern.test(selectedDeck),
  )
  const candidateRankingPass = cardDeckResults.every(
    ({ candidateCount, candidateScores }) =>
      candidateCount <= 8 &&
      candidateScores.every((score, index) => index === 0 || candidateScores[index - 1] >= score),
  )
  const spiderNoirFixture = cardDeckResults.find(({ id }) => id === "D24")
  const mostraSpFixture = cardDeckResults.find(({ id }) => id === "D25")
  const titleRelevanceSelection =
    spiderNoirFixture?.actualSentenceIndex === 2 &&
    spiderNoirFixture.candidateScores[0] > spiderNoirFixture.candidateScores[1] &&
    mostraSpFixture?.actualSentenceIndex === 2 &&
    mostraSpFixture.candidateScores[0] > mostraSpFixture.candidateScores[1]

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
    cardDeck: {
      fixturesPass: cardDeckResults.filter(({ pass }) => pass).length,
      fixturesTotal: cardDeckResults.length,
      sourceCounts: cardDeckSourceCounts,
      emptyCount: cardDeckSourceCounts.none,
      averageLength:
        cardDeckLengths.length > 0
          ? Number(
              (
                cardDeckLengths.reduce((sum, length) => sum + length, 0) / cardDeckLengths.length
              ).toFixed(1),
            )
          : 0,
      maximumLength: Math.max(0, ...cardDeckLengths),
      candidateRankingPass,
      titleRelevanceSelection,
      noRawBoilerplate,
      results: cardDeckResults,
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

const measureRenderedDeck = (summary) => {
  if (!summary) {
    return {
      lineClamp: "",
      lineHeight: null,
      naturalLineCount: null,
      renderedClampedHeight: 0,
      renderedLineCount: null,
      text: "",
    }
  }

  const computed = getComputedStyle(summary)
  const bounds = summary.getBoundingClientRect()
  const lineHeight = Number.parseFloat(computed.lineHeight)
  const renderedLineCount =
    lineHeight > 0 ? Math.max(1, Math.ceil(bounds.height / lineHeight - 0.01)) : null

  return {
    lineClamp:
      computed.getPropertyValue("-webkit-line-clamp") || computed.getPropertyValue("line-clamp"),
    lineHeight,
    naturalLineCount: Number(summary.dataset.naturalLines) || null,
    renderedClampedHeight: bounds.height,
    renderedLineCount,
    text: summary.textContent ?? "",
  }
}

const runVisualChecks = () => {
  const unread = document.querySelector('[data-example="unread"] .grid-card-title')
  const read = document.querySelector('[data-example="read-starred"] .grid-card-title')
  const readStar = document.querySelector('[data-example="read-starred"] .grid-card-star')
  const readImage = document.querySelector('[data-example="read-starred"] .grid-card-cover')
  const readSummary = document.querySelector(
    `[data-example="read-starred"] ${VISIBLE_DECK_SELECTOR}`,
  )
  const readMeta = document.querySelector('[data-example="read-starred"] .grid-card-meta')
  const horizontalImage = document.querySelector('[data-example="unread"] .grid-card-cover')
  const verticalImage = document.querySelector('[data-example="read-starred"] .grid-card-cover')
  const noImageCard = document.querySelector('[data-example="no-image"]')
  const focusTarget = document.querySelector('[data-example="unread"] .grid-card-wrapper')
  const longDeckEntry = visualEntries.find(({ name }) => name === "card-deck-long")?.entry
  const longDeckSummary = document.querySelector(
    `[data-example="card-deck-long"] ${VISIBLE_DECK_SELECTOR}`,
  )
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
  const deckMeasurements = [
    ...document.querySelectorAll(`[data-card-deck-fit] ${VISIBLE_DECK_SELECTOR}`),
  ].map((summary) => ({
    ...measureRenderedDeck(summary),
    name: summary.closest("[data-example]")?.dataset.example ?? "unknown",
    length: summary.textContent?.length ?? 0,
  }))
  const maximumRenderedLines = Math.max(
    0,
    ...deckMeasurements.map(({ renderedLineCount }) => renderedLineCount ?? 0),
  )
  const allDecksRespectTwoLineClamp =
    deckMeasurements.length > 0 &&
    deckMeasurements.every(
      ({ lineClamp, renderedLineCount }) => lineClamp === "2" && renderedLineCount <= 2,
    )
  const longDeckMeasurement = measureRenderedDeck(longDeckSummary)
  const openLetterUsesTwoLines =
    Boolean(longDeckEntry?.cardDeckCandidates?.[0]?.text) &&
    longDeckEntry.cardDeckCandidates[0].text.length > 60 &&
    longDeckMeasurement.renderedLineCount === 2 &&
    longDeckMeasurement.text === longDeckSummary?.dataset.cardDeckText
  const openLetterKeepsSourceText =
    Boolean(longDeckEntry?.cardDeckCandidates?.[0]?.text) &&
    longDeckEntry.cardDeckCandidates[0].text.length > 60 &&
    (!longDeckSummary || longDeckMeasurement.text === longDeckSummary.dataset.cardDeckText)
  const explicitEmptyDeckFixture = cardDeckPresenterFixtures[0]
  const explicitEmptyDeckSummary = document.querySelector(
    `[data-example="presenter-explicit-empty"] ${VISIBLE_DECK_SELECTOR}`,
  )
  const noContentDeckFixture = cardDeckPresentationEntries.find(
    ({ name }) => name === "card-deck-D20",
  )
  const noContentDeckSummary = document.querySelector(
    `[data-example="card-deck-D20"] ${VISIBLE_DECK_SELECTOR}`,
  )
  const boilerplateFixture = cardDeckPresentationEntries.find(
    ({ name }) => name === "card-deck-D22",
  )
  const boilerplateSummary = document.querySelector(
    `[data-example="card-deck-D22"] ${VISIBLE_DECK_SELECTOR}`,
  )
  const noRawBoilerplate =
    Boolean(boilerplateFixture?.entry.cardDeck) &&
    !/(?:comments?|comentários?|compartilhe|newsletter|publicidade|anúncio|leia mais|continue lendo)/iu.test(
      boilerplateFixture.entry.cardDeck,
    ) &&
    (!boilerplateSummary ||
      boilerplateSummary.textContent.trim() === boilerplateSummary.dataset.cardDeckText)

  const fitFallbackFixture = cardDeckPresentationEntries.find(
    ({ name }) => name === "card-deck-D28",
  )
  const fitFallbackSummary = document.querySelector(
    `[data-example="card-deck-D28"] ${VISIBLE_DECK_SELECTOR}`,
  )
  const allTooLongFixture = cardDeckPresentationEntries.find(({ name }) => name === "card-deck-D29")
  const allTooLongSummary = document.querySelector(
    `[data-example="card-deck-D29"] ${VISIBLE_DECK_SELECTOR}`,
  )
  const selectedDecks = [
    ...document.querySelectorAll(`[data-card-deck-fit] ${VISIBLE_DECK_SELECTOR}`),
  ].map((summary) => ({
    ...measureRenderedDeck(summary),
    name: summary.closest("[data-example]")?.dataset.example ?? "unknown",
    source: summary.dataset.cardDeckSource,
    actualText: summary.textContent || "",
    text: summary.dataset.cardDeckText || "",
  }))
  const selectedDeckFitsNaturally = selectedDecks.every(
    ({ naturalLineCount, renderedLineCount }) =>
      naturalLineCount !== null && naturalLineCount <= 2 && renderedLineCount <= 2,
  )
  const selectedDecksAreComplete = selectedDecks.every(
    ({ actualText, source, text }) =>
      actualText === text &&
      /[.!?][”’"')\]]?$/u.test(text) &&
      ["sentence", "excerpt"].includes(source),
  )
  const fitFallbackPass =
    Boolean(fitFallbackFixture?.expectedPresenterDeck) &&
    fitFallbackSummary?.textContent.trim() === fitFallbackFixture.expectedPresenterDeck &&
    fitFallbackSummary?.dataset.cardDeckSource === "sentence" &&
    Number(fitFallbackSummary?.dataset.naturalLines) <= 2
  const allTooLongSuppressed =
    Boolean(allTooLongFixture?.entry.cardDeckCandidates.length >= 2) &&
    allTooLongFixture.entry.cardDeckCandidates.every(({ text }) => text.length > 100) &&
    allTooLongSummary === null

  return {
    cardDeckMaxLines: allDecksRespectTwoLineClamp,
    cardDeckNotFixed60Char: openLetterKeepsSourceText,
    cardDeckUsesAvailableSecondLine: openLetterUsesTwoLines,
    completeSentenceFit: selectedDeckFitsNaturally && selectedDecksAreComplete,
    selectedDeckNaturalLinesLe2: selectedDeckFitsNaturally,
    selectedDeckClampRequired: selectedDecks.filter(
      ({ naturalLineCount, renderedLineCount }) => naturalLineCount > renderedLineCount,
    ).length,
    fitFallbackPass,
    allCandidatesTooLongSuppressed: allTooLongSuppressed,
    noRawBoilerplate,
    emptyDeckSuppressed:
      explicitEmptyDeckFixture.expectedRenderedSummary === null &&
      Boolean(explicitEmptyDeckFixture.entry.previewText) &&
      !explicitEmptyDeckFixture.entry.cardDeck &&
      explicitEmptyDeckSummary === null &&
      noContentDeckFixture?.entry.cardDeckSource === "none" &&
      !noContentDeckFixture.entry.previewText &&
      noContentDeckSummary === null,
    noHorizontalOverflow:
      document.documentElement.scrollWidth <= window.innerWidth &&
      document.body.scrollWidth <= window.innerWidth,
    deckLineCount: {
      averageLength:
        deckMeasurements.length > 0
          ? Number(
              (
                deckMeasurements.reduce((sum, { length }) => sum + length, 0) /
                deckMeasurements.length
              ).toFixed(1),
            )
          : 0,
      maximumRenderedLines,
      measurements: deckMeasurements,
      selectedDecks,
      openLetter: longDeckMeasurement,
    },
    titleRelevanceSelection:
      cardDeckPresentationEntries.find(({ name }) => name === "card-deck-D24")?.entry
        .cardDeckCandidates[0]?.text ===
        cardDeckFixtures.find(({ id }) => id === "D24")?.expectedDeck &&
      cardDeckPresentationEntries.find(({ name }) => name === "card-deck-D25")?.entry
        .cardDeckCandidates[0]?.text ===
        cardDeckFixtures.find(({ id }) => id === "D25")?.expectedDeck,
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
      <h2 className="phase2b1-preview-heading">Card deck content and rendered fit</h2>
      <section className="phase2b1-preview-grid phase2b1-deck-grid">
        {cardDeckPresentationEntries.map(({ entry, name, state }) => (
          <div
            key={entry.id}
            className="phase2b1-preview-card"
            data-card-deck-fit=""
            data-example={name}
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

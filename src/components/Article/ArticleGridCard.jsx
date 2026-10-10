import { IconClockCircle, IconStarFill } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import classNames from "classnames"
import { memo, useLayoutEffect, useRef, useState } from "react"

import FeedIcon from "@/components/ui/FeedIcon"
import { articleGridCardSettingsState } from "@/store/settingsState"
import { generateReadingTime, generateRelativeTime } from "@/utils/date"

import "./ArticleGridCard.css"

const MIN_COVER_ASPECT_RATIO = 3 / 2
const MAX_COVER_ASPECT_RATIO = 2
const MAX_CARD_DECK_LINES = 2
const DECK_MEASUREMENT_CACHE_LIMIT = 1000
const deckMeasurementCache = new Map()
const EMPTY_CARD_DECK_CANDIDATES = []

const getNaturalLineCount = (text, referenceElement) => {
  const width = Math.round(referenceElement.getBoundingClientRect().width)
  if (width <= 0) {
    return null
  }

  const computed = getComputedStyle(referenceElement)
  const typography = [
    computed.fontFamily,
    computed.fontSize,
    computed.fontWeight,
    computed.fontStyle,
    computed.fontVariant,
    computed.lineHeight,
    computed.letterSpacing,
    computed.wordSpacing,
    computed.textTransform,
    computed.whiteSpace,
    computed.overflowWrap,
    computed.wordBreak,
    computed.hyphens,
    computed.textIndent,
  ].join("|")
  const cacheKey = `${text}\u0000${width}\u0000${typography}`
  const cachedLineCount = deckMeasurementCache.get(cacheKey)
  if (cachedLineCount !== undefined) {
    return cachedLineCount
  }

  const measurement = document.createElement("p")
  measurement.className = "grid-card-summary"
  measurement.textContent = text
  measurement.style.position = "fixed"
  measurement.style.left = "-100000px"
  measurement.style.top = "0"
  measurement.style.width = `${width}px`
  measurement.style.maxWidth = "none"
  measurement.style.height = "auto"
  measurement.style.maxHeight = "none"
  measurement.style.display = "block"
  measurement.style.overflow = "visible"
  measurement.style.visibility = "hidden"
  measurement.style.pointerEvents = "none"
  measurement.style.margin = "0"
  measurement.style.padding = "0"
  measurement.style.border = "0"
  measurement.style.boxSizing = "border-box"
  measurement.style.setProperty("-webkit-line-clamp", "unset")
  measurement.style.setProperty("line-clamp", "none")
  measurement.style.setProperty("-webkit-box-orient", "initial")

  for (const property of [
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "fontVariant",
    "lineHeight",
    "letterSpacing",
    "wordSpacing",
    "textTransform",
    "whiteSpace",
    "overflowWrap",
    "wordBreak",
    "hyphens",
    "textIndent",
  ]) {
    measurement.style[property] = computed[property]
  }

  document.body.append(measurement)
  const { height } = measurement.getBoundingClientRect()
  measurement.remove()

  const lineHeight = Number.parseFloat(computed.lineHeight)
  const lineCount =
    Number.isFinite(lineHeight) && lineHeight > 0
      ? Math.max(1, Math.ceil(height / lineHeight - 0.01))
      : null

  if (lineCount !== null) {
    deckMeasurementCache.set(cacheKey, lineCount)
    if (deckMeasurementCache.size > DECK_MEASUREMENT_CACHE_LIMIT) {
      deckMeasurementCache.delete(deckMeasurementCache.keys().next().value)
    }
  }

  return lineCount
}

const getAspectRatio = (width, height) => {
  const numericWidth = Number(width)
  const numericHeight = Number(height)
  if (
    !Number.isFinite(numericWidth) ||
    numericWidth <= 0 ||
    !Number.isFinite(numericHeight) ||
    numericHeight <= 0
  ) {
    return null
  }

  return numericWidth / numericHeight
}

const shouldCropCover = (aspectRatio) =>
  aspectRatio !== null &&
  aspectRatio >= MIN_COVER_ASPECT_RATIO &&
  aspectRatio <= MAX_COVER_ASPECT_RATIO

const getCoverCandidates = (entry) =>
  entry.coverCandidates?.length
    ? entry.coverCandidates
    : entry.coverSource
      ? [{ height: entry.coverHeight, src: entry.coverSource, width: entry.coverWidth }]
      : []

const ArticleGridCard = ({ entry }) => {
  const { showCardSummary, showDetailedRelativeTime, showEstimatedReadingTime, showFeedIcon } =
    useStore(articleGridCardSettingsState)
  const [coverState, setCoverState] = useState(() => ({
    entryId: entry.id,
    failedSources: [],
    loaded: null,
  }))
  const [selectedDeck, setSelectedDeck] = useState(null)
  const gridCardCopyRef = useRef(null)
  const deckMeasurementProbeRef = useRef(null)
  const candidates = getCoverCandidates(entry)
  const activeCoverState =
    coverState.entryId === entry.id
      ? coverState
      : { entryId: entry.id, failedSources: [], loaded: null }
  const currentCover =
    candidates.find(({ src }) => !activeCoverState.failedSources.includes(src)) ?? null
  const loadedCover =
    activeCoverState.loaded?.src === currentCover?.src ? activeCoverState.loaded : null
  const aspectRatio = getAspectRatio(
    loadedCover?.width ?? currentCover?.width,
    loadedCover?.height ?? currentCover?.height,
  )
  const isReady = aspectRatio !== null || loadedCover !== null
  const shouldCrop = shouldCropCover(aspectRatio)
  const hasCover = currentCover !== null
  const cardDeckCandidates = Array.isArray(entry.cardDeckCandidates)
    ? entry.cardDeckCandidates
    : EMPTY_CARD_DECK_CANDIDATES
  const hasCardDeckCandidates = cardDeckCandidates.length > 0 || Boolean(entry.cardDeckFallback)

  useLayoutEffect(() => {
    const copyElement = gridCardCopyRef.current
    const measurementProbe = deckMeasurementProbeRef.current
    if (!showCardSummary || !copyElement || !measurementProbe || !hasCardDeckCandidates) {
      setSelectedDeck(null)
      return
    }

    let disposed = false
    const measureAndSelectDeck = () => {
      measurementProbe.style.width = `${copyElement.clientWidth}px`
      const candidates = [...cardDeckCandidates, entry.cardDeckFallback].filter(Boolean)
      const fittedDeck = candidates
        .map((candidate) => ({
          ...candidate,
          naturalLineCount: getNaturalLineCount(candidate.text, measurementProbe),
        }))
        .find(
          (candidate) =>
            candidate.naturalLineCount !== null &&
            candidate.naturalLineCount <= MAX_CARD_DECK_LINES,
        )

      if (!disposed) {
        setSelectedDeck((current) =>
          current?.text === fittedDeck?.text &&
          current?.source === fittedDeck?.source &&
          current?.naturalLineCount === fittedDeck?.naturalLineCount
            ? current
            : (fittedDeck ?? null),
        )
      }
    }

    const resizeObserver = new ResizeObserver(measureAndSelectDeck)
    resizeObserver.observe(copyElement)
    measureAndSelectDeck()

    const { fonts } = document
    const measureAfterFontLoad = () => measureAndSelectDeck()
    fonts?.addEventListener?.("loadingdone", measureAfterFontLoad)
    void fonts?.ready?.then(measureAfterFontLoad)

    return () => {
      disposed = true
      resizeObserver.disconnect()
      fonts?.removeEventListener?.("loadingdone", measureAfterFontLoad)
    }
  }, [cardDeckCandidates, entry.cardDeckFallback, hasCardDeckCandidates, showCardSummary])

  const handleCoverLoad = ({ currentTarget }) => {
    const { naturalHeight, naturalWidth } = currentTarget

    setCoverState((previous) => ({
      entryId: entry.id,
      failedSources: previous.entryId === entry.id ? previous.failedSources : [],
      loaded: { height: naturalHeight, src: currentCover.src, width: naturalWidth },
    }))
  }

  const handleCoverError = () => {
    setCoverState((previous) => ({
      entryId: entry.id,
      failedSources:
        previous.entryId === entry.id
          ? [...new Set([...previous.failedSources, currentCover.src])]
          : [currentCover.src],
      loaded: null,
    }))
  }

  return (
    <div className={classNames("grid-card-content", { "grid-card-content-no-cover": !hasCover })}>
      {hasCover && (
        <div className="grid-card-media">
          <img
            alt=""
            decoding="async"
            height={currentCover.height || undefined}
            loading="lazy"
            src={currentCover.src}
            width={currentCover.width || undefined}
            className={classNames("grid-card-cover", {
              "grid-card-cover-ready": isReady,
              "grid-card-cover-cropped": shouldCrop,
            })}
            onError={handleCoverError}
            onLoad={handleCoverLoad}
          />
        </div>
      )}

      <div ref={gridCardCopyRef} className="grid-card-copy">
        <div className="grid-card-meta">
          <div className="grid-card-source">
            {showFeedIcon && <FeedIcon className="grid-card-feed-icon" feed={entry.feed} />}
            <span>{entry.feed.title}</span>
          </div>
          <time className="grid-card-time" dateTime={entry.published_at}>
            {generateRelativeTime(entry.published_at, showDetailedRelativeTime)}
          </time>
        </div>

        <h3 className="article-entry-title grid-card-title">{entry.title}</h3>

        {showCardSummary && hasCardDeckCandidates && (
          <p
            ref={deckMeasurementProbeRef}
            aria-hidden="true"
            className="grid-card-summary grid-card-summary-measure-probe"
            style={{
              border: 0,
              display: "block",
              left: "-100000px",
              margin: 0,
              overflow: "visible",
              padding: 0,
              pointerEvents: "none",
              position: "fixed",
              top: 0,
              visibility: "hidden",
              width: "100%",
            }}
          >
            {cardDeckCandidates[0]?.text ?? entry.cardDeckFallback?.text}
          </p>
        )}
        {showCardSummary && selectedDeck && (
          <p
            className="grid-card-summary"
            data-card-deck-source={selectedDeck.source}
            data-card-deck-text={selectedDeck.text}
            data-natural-lines={selectedDeck.naturalLineCount}
          >
            {selectedDeck.text}
          </p>
        )}

        <div className="grid-card-footer">
          {showEstimatedReadingTime && (
            <span className="grid-card-reading-time">
              <IconClockCircle aria-hidden="true" />
              <span>{generateReadingTime(entry.reading_time)}</span>
            </span>
          )}
          <IconStarFill
            aria-hidden="true"
            className="grid-card-star"
            style={{ opacity: entry.starred ? 1 : 0 }}
          />
        </div>
      </div>
    </div>
  )
}

export default memo(ArticleGridCard)

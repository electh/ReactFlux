const MIN_VISIBLE_RATIO = 0.5
const TALL_IMAGE_TOP_GAP_PX = 16

const waitForAnimationFrame = () =>
  new Promise((resolve) => {
    requestAnimationFrame(resolve)
  })

const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum)

const getDirectSummary = (details) =>
  [...details.children].find((child) => child.tagName === "SUMMARY") ?? null

const getVisibleAnchorRect = (target, scrollElement) => {
  const targetRect = target.getBoundingClientRect()
  if (targetRect.width > 0 && targetRect.height > 0) {
    return targetRect
  }

  let currentElement = target.parentElement
  while (currentElement && currentElement !== scrollElement) {
    if (currentElement.tagName === "DETAILS" && !currentElement.open) {
      const summaryRect = getDirectSummary(currentElement)?.getBoundingClientRect()
      if (summaryRect?.width > 0 && summaryRect.height > 0) {
        return summaryRect
      }
    }
    currentElement = currentElement.parentElement
  }

  return null
}

const getContentCenter = (target, scrollElement) => {
  const targetRect = getVisibleAnchorRect(target, scrollElement)
  if (!targetRect) {
    return null
  }

  const scrollRect = scrollElement.getBoundingClientRect()
  return scrollElement.scrollTop + targetRect.top - scrollRect.top + targetRect.height / 2
}

const isMatchingTarget = (target, galleryIndex, scrollElement) =>
  target?.isConnected &&
  scrollElement.contains(target) &&
  target.dataset.articleImageIndex === String(galleryIndex)

const findImageTarget = ({
  galleryIndex,
  openingInstanceId,
  openingTarget,
  openingViewportCenter,
  scrollElement,
}) => {
  const targets = [
    ...scrollElement.querySelectorAll(
      `img[data-article-image-index="${CSS.escape(String(galleryIndex))}"]`,
    ),
  ]

  if (isMatchingTarget(openingTarget, galleryIndex, scrollElement)) {
    return openingTarget
  }

  if (openingInstanceId) {
    const matchingInstance = targets.find(
      (target) => target.dataset.articleImageInstance === openingInstanceId,
    )
    if (matchingInstance) {
      return matchingInstance
    }
  }

  const fallbackViewportCenter = scrollElement.scrollTop + scrollElement.clientHeight / 2
  const referenceCenter = Number.isFinite(openingViewportCenter)
    ? openingViewportCenter
    : fallbackViewportCenter

  let closestTarget
  let shortestDistance = Infinity
  for (const target of targets) {
    const contentCenter = getContentCenter(target, scrollElement)
    if (contentCenter === null) {
      continue
    }

    const distance = Math.abs(contentCenter - referenceCenter)
    if (distance < shortestDistance) {
      closestTarget = target
      shortestDistance = distance
    }
  }
  return closestTarget
}

const openAncestorDetails = (target, scrollElement) => {
  const closedDetails = []
  let currentElement = target.parentElement

  while (currentElement && currentElement !== scrollElement) {
    if (currentElement.tagName === "DETAILS" && !currentElement.open) {
      closedDetails.push(currentElement)
    }
    currentElement = currentElement.parentElement
  }

  for (const details of closedDetails.toReversed()) {
    details.open = true
  }

  return closedDetails.length > 0
}

const setScrollTop = (scrollElement, scrollTop) => {
  const maximumScrollTop = Math.max(0, scrollElement.scrollHeight - scrollElement.clientHeight)
  const nextScrollTop = Number.isFinite(scrollTop) ? scrollTop : scrollElement.scrollTop
  scrollElement.scrollTop = clamp(nextScrollTop, 0, maximumScrollTop)
}

const canReceiveFocus = (element) =>
  typeof HTMLElement !== "undefined" &&
  element instanceof HTMLElement &&
  element.isConnected &&
  !element.hasAttribute("disabled") &&
  element.getAttribute("aria-disabled") !== "true" &&
  element.getClientRects().length > 0

const restoreArticleFocus = (target, scrollElement) => {
  const galleryIndex = target?.dataset.articleImageIndex
  const instanceId = target?.dataset.articleImageInstance
  const focusTarget =
    galleryIndex !== undefined && instanceId
      ? scrollElement.querySelector(
          `[data-article-image-focus-index="${CSS.escape(galleryIndex)}"]` +
            `[data-article-image-instance="${CSS.escape(instanceId)}"]`,
        )
      : null

  const nextFocusTarget = canReceiveFocus(focusTarget) ? focusTarget : scrollElement
  nextFocusTarget?.focus?.({ preventScroll: true })
}

const restoreOpeningContext = (scrollElement, openingScrollTop) => {
  setScrollTop(scrollElement, openingScrollTop)
  restoreArticleFocus(null, scrollElement)
}

const getVisibleRatio = (targetRect, viewportRect) => {
  const visibleHeight = Math.max(
    0,
    Math.min(targetRect.bottom, viewportRect.bottom) - Math.max(targetRect.top, viewportRect.top),
  )
  return targetRect.height > 0 ? visibleHeight / targetRect.height : 0
}

const returnToArticleImage = async ({
  galleryIndex,
  hasViewedDifferentSlide,
  isCurrent,
  openingIndex,
  openingInstanceId,
  openingScrollTop,
  openingTarget,
  openingViewportCenter,
  scrollElement,
}) => {
  if (!isCurrent()) {
    return "cancelled"
  }

  const isOpeningSlide = galleryIndex === openingIndex
  const findTarget = () =>
    findImageTarget({
      galleryIndex,
      openingInstanceId: isOpeningSlide ? openingInstanceId : null,
      openingTarget: isOpeningSlide ? openingTarget : null,
      openingViewportCenter,
      scrollElement,
    })

  let target = findTarget()
  if (!target) {
    await waitForAnimationFrame()
    if (!isCurrent()) {
      return "cancelled"
    }
    target = findTarget()
  }

  if (!target) {
    restoreOpeningContext(scrollElement, openingScrollTop)
    return "missing"
  }

  if (openAncestorDetails(target, scrollElement)) {
    await waitForAnimationFrame()
  }

  if (!isCurrent()) {
    return "cancelled"
  }

  setScrollTop(scrollElement, openingScrollTop)

  const targetRect = target.getBoundingClientRect()
  const viewportRect = scrollElement.getBoundingClientRect()
  const viewportHeight = scrollElement.clientHeight || viewportRect.height

  if (
    !target.isConnected ||
    targetRect.width <= 0 ||
    targetRect.height <= 0 ||
    viewportHeight <= 0
  ) {
    restoreOpeningContext(scrollElement, openingScrollTop)
    return "missing"
  }

  const isTallImage = targetRect.height > viewportHeight
  const isOriginalTallImage =
    isTallImage &&
    !hasViewedDifferentSlide &&
    Boolean(openingInstanceId) &&
    target.dataset.articleImageInstance === openingInstanceId

  if (!isOriginalTallImage) {
    const targetOffset = targetRect.top - viewportRect.top

    if (isTallImage) {
      setScrollTop(scrollElement, scrollElement.scrollTop + targetOffset - TALL_IMAGE_TOP_GAP_PX)
    } else if (getVisibleRatio(targetRect, viewportRect) < MIN_VISIBLE_RATIO) {
      const centeredOffset = targetOffset - (viewportHeight - targetRect.height) / 2
      setScrollTop(scrollElement, scrollElement.scrollTop + centeredOffset)
    }
  }

  restoreArticleFocus(target, scrollElement)
  return "positioned"
}

export default returnToArticleImage

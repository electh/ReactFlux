/**
 * Freeze / unfreeze media loading inside article cards.
 *
 * When a user navigates past a card (J/K keys, clicking the next entry),
 * these helpers cancel incomplete image downloads and iframe loading to:
 *   - Save bandwidth on content the user has moved past
 *   - Prevent layout shifts from images loading in cards above the viewport
 *
 * Media frozen this way resumes loading when the card is re-selected
 * via unfreezeMediaLoading().
 */

// Transparent 1x1 GIF — no-op src placeholder for frozen images
const FROZEN_PLACEHOLDER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"

/**
 * Cancel incomplete image and iframe loading inside a container.
 * Already-loaded images (img.complete) and data-URI sources are left untouched.
 * Original URLs are stored in data-frozen-src for later restoration.
 */
export const freezeMediaLoading = (container) => {
  if (!container) {
    return
  }

  for (const img of container.querySelectorAll("img:not([data-frozen-src])")) {
    const src = img.getAttribute("src")
    if (!src || img.complete || src.startsWith("data:")) {
      continue
    }

    img.dataset.frozenSrc = src
    img.src = FROZEN_PLACEHOLDER
  }

  for (const iframe of container.querySelectorAll("iframe:not([data-frozen-src])")) {
    const src = iframe.getAttribute("src")
    if (!src) {
      continue
    }

    iframe.dataset.frozenSrc = src
    iframe.removeAttribute("src")
  }
}

/**
 * Restore frozen media — re-sets src from data-frozen-src on all elements
 * that were previously frozen by freezeMediaLoading().
 */
export const unfreezeMediaLoading = (container) => {
  if (!container) {
    return
  }

  for (const el of container.querySelectorAll("[data-frozen-src]")) {
    el.src = el.dataset.frozenSrc
    delete el.dataset.frozenSrc
  }
}

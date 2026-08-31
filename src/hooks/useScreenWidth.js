import { useStore } from "@nanostores/react"
import { atom, onMount } from "nanostores"

const COMPACT_THRESHOLD = 359
const MEDIUM_THRESHOLD = 768
const LARGE_THRESHOLD = 992

const getMediaQueryMatch = (query) => globalThis.matchMedia?.(query).matches ?? false

const createMediaQueryState = (query) => {
  const state = atom(getMediaQueryMatch(query))

  onMount(state, () => {
    const mediaQuery = globalThis.matchMedia?.(query)
    if (!mediaQuery) {
      return
    }

    const updateMatch = ({ matches }) => state.set(matches)
    state.set(mediaQuery.matches)
    mediaQuery.addEventListener("change", updateMatch)

    return () => mediaQuery.removeEventListener("change", updateMatch)
  })

  return state
}

const isBelowCompactState = createMediaQueryState(`(max-width: ${COMPACT_THRESHOLD}px)`)
const isBelowMediumState = createMediaQueryState(`(max-width: ${MEDIUM_THRESHOLD}px)`)
const isBelowLargeState = createMediaQueryState(`(max-width: ${LARGE_THRESHOLD}px)`)
export const hasCoarsePointerState = createMediaQueryState("(pointer: coarse)")
export const prefersReducedMotionState = createMediaQueryState("(prefers-reduced-motion: reduce)")

const useScreenWidth = () => {
  const isBelowCompact = useStore(isBelowCompactState)
  const isBelowMedium = useStore(isBelowMediumState)
  const isBelowLarge = useStore(isBelowLargeState)

  return { isBelowCompact, isBelowMedium, isBelowLarge }
}

export default useScreenWidth

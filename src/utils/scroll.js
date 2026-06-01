import { settingsState } from "@/store/settingsState"

export {
  quickScrollTo,
  STREAM_SCROLL_ALIGNMENT_TOLERANCE,
  STREAM_SCROLL_END_TIMEOUT_MS,
  STREAM_SCROLL_STABLE_WINDOW_MS,
  waitForElement,
  waitForScrollEnd,
} from "./scroll-timing"

// Reads settingsState directly (not a hook) so it works in imperative RAF/event
// callbacks. The app toggle is authoritative; reduced-motion only seeds the
// first-run default (see settingsState) and is NOT consulted here.
export const getAnimationScrollBehavior = () =>
  settingsState.get().animationsEnabled ? "smooth" : "auto"

// First-run default seed only. Guarded so non-browser contexts (Node/tests)
// never crash.
export const prefersReducedMotion = () =>
  globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false

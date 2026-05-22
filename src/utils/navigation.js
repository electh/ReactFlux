/**
 * Finds the next or previous item that matches a predicate.
 *
 * The current item is skipped. When wrapping is enabled, the search continues from the opposite
 * boundary and still stops before checking the current item again.
 *
 * @template T
 * @param {T[]} items - Items to search.
 * @param {number} currentIndex - Current item index. Returns undefined when outside array bounds.
 * @param {"next" | "prev"} direction - Search direction.
 * @param {object} [options] - Search options.
 * @param {(item: T) => boolean} [options.predicate] - Predicate used to filter matching items.
 * @param {boolean} [options.wrap=false] - Whether to wrap around at the list boundaries.
 * @returns {T | undefined} The adjacent matching item, or undefined if none is found.
 */
const findAdjacentItem = (
  items,
  currentIndex,
  direction,
  { predicate = () => true, wrap = false } = {},
) => {
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    currentIndex < 0 ||
    currentIndex >= items.length
  ) {
    return
  }

  const step = direction === "prev" ? -1 : 1
  let index = currentIndex + step

  while (index >= 0 && index < items.length) {
    const item = items[index]
    if (predicate(item)) {
      return item
    }
    index += step
  }

  if (!wrap) {
    return
  }

  index = direction === "prev" ? items.length - 1 : 0

  while (index !== currentIndex) {
    const item = items[index]
    if (predicate(item)) {
      return item
    }
    index += step

    if (index < 0) {
      index = items.length - 1
    } else if (index >= items.length) {
      index = 0
    }
  }

  return
}

export default findAdjacentItem

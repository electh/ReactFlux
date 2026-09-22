import { useStore } from "@nanostores/react"
import { attributesToProps, domToReact } from "html-react-parser"
import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import { polyglotState } from "@/hooks/useLanguage"

const TEXT_ALTERNATIVE_ATTRIBUTES = ["aria-label", "aria-labelledby", "alt", "title"]

const getHtmlAttributes = (node) =>
  Object.fromEntries(
    Object.entries(node?.attribs ?? {}).map(([name, value]) => [name.toLowerCase(), value]),
  )

const isAriaHidden = (attributes) => {
  const ariaHidden = attributes["aria-hidden"]
  return typeof ariaHidden === "string" && ariaHidden.trim().toLowerCase() === "true"
}

const isHiddenFromAccessibilityTree = (node) => {
  for (let currentNode = node; currentNode; currentNode = currentNode.parent) {
    const attributes = getHtmlAttributes(currentNode)
    if (Object.hasOwn(attributes, "hidden") || isAriaHidden(attributes)) {
      return true
    }
  }
  return false
}

const hasAccessibleTextAlternative = (node) => {
  if (!node) {
    return false
  }
  if (node.type === "text") {
    return Boolean(node.data?.trim())
  }

  const attributes = getHtmlAttributes(node)
  if (Object.hasOwn(attributes, "hidden") || isAriaHidden(attributes)) {
    return false
  }

  if (
    TEXT_ALTERNATIVE_ATTRIBUTES.some(
      (name) => typeof attributes[name] === "string" && attributes[name].trim(),
    )
  ) {
    return true
  }

  return node.children?.some((child) => hasAccessibleTextAlternative(child)) ?? false
}

const isDisplayNone = (style) =>
  typeof style?.display === "string" && style.display.trim().toLowerCase() === "none"

const isVisibilityHidden = (visibility) => visibility === "hidden" || visibility === "collapse"

const isHorizontallyScrollable = (element) => element.scrollWidth - element.clientWidth > 1

const handleHorizontalArrowKeyDown = (event) => {
  const { altKey, ctrlKey, currentTarget, key, metaKey, shiftKey } = event
  const hasModifierKey = altKey || ctrlKey || metaKey || shiftKey
  const isHorizontalArrowKey = key === "ArrowLeft" || key === "ArrowRight"

  if (!hasModifierKey && isHorizontalArrowKey && isHorizontallyScrollable(currentTarget)) {
    event.stopPropagation()
  }
}

const ArticleTable = ({ node, options }) => {
  const { polyglot } = useStore(polyglotState)
  const tableAttributes = getHtmlAttributes(node)
  const tableIsInitiallyInert = Object.hasOwn(tableAttributes, "inert")
  const tableProps = {
    ...attributesToProps(tableAttributes, "table"),
    inert: tableIsInitiallyInert || undefined,
  }
  const scrollContainerRef = useRef(null)
  const generatedCaptionId = `${useId()}-caption`
  const isTableHidden = Object.hasOwn(tableAttributes, "hidden")
  const isTableAriaHidden = isAriaHidden(tableAttributes)
  const captionNode = node.children.find((child) => child.name === "caption")
  const captionAttributes = getHtmlAttributes(captionNode)
  const existingCaptionId =
    typeof captionAttributes.id === "string" ? captionAttributes.id.trim() : ""
  const captionId =
    existingCaptionId && !/\s/.test(existingCaptionId) ? existingCaptionId : generatedCaptionId
  const captionProvidesLabel = hasAccessibleTextAlternative(captionNode)
  const initialDirection =
    tableProps.dir === "ltr" || tableProps.dir === "rtl"
      ? tableProps.dir
      : tableProps.style?.direction
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false)
  const [isTableDisplayNone, setIsTableDisplayNone] = useState(() =>
    isDisplayNone(tableProps.style),
  )
  const [isTableInert, setIsTableInert] = useState(tableIsInitiallyInert)
  const [isTableVisibilityHidden, setIsTableVisibilityHidden] = useState(() =>
    isVisibilityHidden(tableProps.style?.visibility),
  )
  const [tableDirection, setTableDirection] = useState(initialDirection)

  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current
    const tableElement = scrollContainer?.firstElementChild
    if (!scrollContainer || !tableElement) {
      return
    }

    const updateTableState = () => {
      // Measure without the synchronized value so inherited direction changes remain observable.
      const synchronizedDirection = scrollContainer.style.direction
      scrollContainer.style.removeProperty("direction")
      const containerDirection = globalThis.getComputedStyle(scrollContainer).direction
      const computedStyle = globalThis.getComputedStyle(tableElement)
      const computedDirection = computedStyle.direction
      const tableIsDisplayNone = computedStyle.display === "none"
      const tableIsInert = tableElement.hasAttribute("inert")
      const tableIsVisibilityHidden = isVisibilityHidden(computedStyle.visibility)
      scrollContainer.style.direction = synchronizedDirection

      setIsTableDisplayNone(tableIsDisplayNone)
      setIsTableInert(tableIsInert)
      setIsTableVisibilityHidden(tableIsVisibilityHidden)
      setTableDirection(computedDirection === containerDirection ? undefined : computedDirection)
      setHasHorizontalOverflow(
        !tableIsDisplayNone &&
          !tableIsInert &&
          !tableIsVisibilityHidden &&
          isHorizontallyScrollable(scrollContainer),
      )
    }
    updateTableState()

    const resizeObserver =
      typeof globalThis.ResizeObserver === "function"
        ? new globalThis.ResizeObserver(updateTableState)
        : null
    resizeObserver?.observe(scrollContainer)
    resizeObserver?.observe(tableElement)

    const mutationObserver =
      typeof globalThis.MutationObserver === "function"
        ? new globalThis.MutationObserver(updateTableState)
        : null
    mutationObserver?.observe(tableElement, {
      attributeFilter: ["class", "dir", "hidden", "inert", "style"],
      attributes: true,
    })
    for (
      let ancestor = scrollContainer.parentElement;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      mutationObserver?.observe(ancestor, {
        attributeFilter: ["arco-theme", "class", "dir", "hidden", "inert", "style"],
        attributes: true,
      })
    }

    scrollContainer.addEventListener("load", updateTableState, true)
    if (!resizeObserver) {
      globalThis.addEventListener("resize", updateTableState)
    }

    return () => {
      mutationObserver?.disconnect()
      resizeObserver?.disconnect()
      scrollContainer.removeEventListener("load", updateTableState, true)
      if (!resizeObserver) {
        globalThis.removeEventListener("resize", updateTableState)
      }
    }
  }, [node])

  const isScrollableRegion =
    hasHorizontalOverflow &&
    !isTableDisplayNone &&
    !isTableInert &&
    !isTableVisibilityHidden &&
    !isHiddenFromAccessibilityTree(node)
  const scrollContainerStyle = tableDirection ? { direction: tableDirection } : undefined
  const scrollableTableLabel =
    isScrollableRegion && !captionProvidesLabel ? polyglot.t("actions.scrollable_table") : undefined
  const scrollableRegionRole = captionProvidesLabel ? "region" : "group"
  const parsedTableChildren = Children.toArray(domToReact(node.children, options))
  const captionChildIndex = captionNode
    ? parsedTableChildren.findIndex((child) => isValidElement(child) && child.type === "caption")
    : -1
  const tableChildren = parsedTableChildren.map((child, index) =>
    index === captionChildIndex ? cloneElement(child, { id: captionId }) : child,
  )

  return (
    <div
      ref={scrollContainerRef}
      aria-hidden={isTableAriaHidden || undefined}
      aria-label={scrollableTableLabel}
      aria-labelledby={isScrollableRegion && captionProvidesLabel ? captionId : undefined}
      className="article-table-scroll"
      data-table-display-none={isTableDisplayNone && !isTableHidden ? "" : undefined}
      data-table-visibility-hidden={isTableVisibilityHidden ? "" : undefined}
      dir={tableProps.dir}
      hidden={isTableHidden}
      inert={isTableInert || undefined}
      role={isScrollableRegion ? scrollableRegionRole : undefined}
      style={scrollContainerStyle}
      tabIndex={isScrollableRegion ? 0 : undefined}
      onKeyDown={handleHorizontalArrowKeyDown}
    >
      <table {...tableProps}>{tableChildren}</table>
    </div>
  )
}

export default ArticleTable

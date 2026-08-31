import { useStore } from "@nanostores/react"
import { lazy, Suspense, useEffect, useMemo, useState } from "react"
import { useInView } from "react-intersection-observer"

import { polyglotState } from "@/hooks/useLanguage"

import "./DeferredCodeBlock.css"

const CodeBlock = lazy(() => import("./CodeBlock"))

const MAX_AUTOMATIC_HIGHLIGHT_CHARACTERS = 50_000
const MAX_AUTOMATIC_HIGHLIGHT_LINES = 1000

const scheduleWhenIdle = (callback) => {
  if (typeof globalThis.requestIdleCallback === "function") {
    const idleCallbackId = globalThis.requestIdleCallback(callback, { timeout: 500 })
    return () => globalThis.cancelIdleCallback(idleCallbackId)
  }

  const timeoutId = setTimeout(callback, 50)
  return () => clearTimeout(timeoutId)
}

const PlainCodeBlock = ({ code, enableLabel, isWaiting, onEnable }) => (
  <div className="deferred-code-block-placeholder">
    {onEnable && (
      <button className="enable-code-highlighting" type="button" onClick={onEnable}>
        {enableLabel}
      </button>
    )}
    <pre aria-busy={isWaiting || undefined} className="code-block-loading">
      <code>{code}</code>
    </pre>
  </div>
)

const DeferredCodeBlock = ({ children }) => {
  const code = children.trim()
  const { polyglot } = useStore(polyglotState)
  const { ref, inView } = useInView({ rootMargin: "400px 0px", triggerOnce: true })
  const [largeBlockHighlightEnabled, setLargeBlockHighlightEnabled] = useState(false)
  const [ready, setReady] = useState(false)
  const isLargeBlock = useMemo(
    () =>
      code.length > MAX_AUTOMATIC_HIGHLIGHT_CHARACTERS ||
      code.split("\n", MAX_AUTOMATIC_HIGHLIGHT_LINES + 1).length > MAX_AUTOMATIC_HIGHLIGHT_LINES,
    [code],
  )
  const shouldHighlight = inView && (!isLargeBlock || largeBlockHighlightEnabled)

  useEffect(() => {
    if (!shouldHighlight || ready) {
      return
    }

    return scheduleWhenIdle(() => setReady(true))
  }, [ready, shouldHighlight])

  const fallback = (
    <PlainCodeBlock
      code={code}
      enableLabel={polyglot.t("actions.enable_syntax_highlighting")}
      isWaiting={shouldHighlight}
      onEnable={
        isLargeBlock && !largeBlockHighlightEnabled
          ? () => setLargeBlockHighlightEnabled(true)
          : undefined
      }
    />
  )

  return (
    <div ref={ref} className="deferred-code-block">
      {ready ? (
        <Suspense fallback={fallback}>
          <CodeBlock>{code}</CodeBlock>
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  )
}

export default DeferredCodeBlock

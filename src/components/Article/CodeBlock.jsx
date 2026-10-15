import { Button, Message, Select } from "@arco-design/web-react"
import { IconCode, IconCopy, IconOrderedList } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { lazy, Suspense, useCallback, useEffect, useId, useMemo, useState } from "react"

import CustomTooltip from "@/components/ui/CustomTooltip"
import { polyglotState } from "@/hooks/useLanguage"
import getCodeLineCount from "@/utils/code-block"
import {
  LANGUAGE_DISPLAY_NAMES,
  normalizeCodeLanguage,
  SUPPORTED_LANGUAGES,
} from "@/utils/code-languages"
import scheduleWhenIdle from "@/utils/idle-callback"
import "./CodeBlock.css"

const HighlightedCode = lazy(() => import("./HighlightedCode"))
const languageCache = new Map()
const MAX_CACHED_LANGUAGES = 100

const cacheLanguage = (code, language) => {
  if (languageCache.size >= MAX_CACHED_LANGUAGES) {
    languageCache.delete(languageCache.keys().next().value)
  }
  languageCache.set(code, language)
}

const PlainCodeBlock = ({ code, showLineNumbers, isWaiting }) => {
  const lineNumbers = useMemo(
    () =>
      showLineNumbers
        ? Array.from({ length: getCodeLineCount(code) }, (_, index) => index + 1).join("\n")
        : null,
    [code, showLineNumbers],
  )

  return (
    <pre aria-busy={isWaiting || undefined} className="hljs code-block-plain">
      {showLineNumbers && (
        <span aria-hidden="true" className="code-block-line-numbers">
          {lineNumbers}
        </span>
      )}
      <code>{code}</code>
    </pre>
  )
}

const CodeBlock = ({ children: code, languageHint, inView = true }) => {
  const { polyglot } = useStore(polyglotState)
  const canAutoDetect = /\S/.test(code)
  const sourceLanguage = normalizeCodeLanguage(languageHint)
  const [selectedLanguage, setSelectedLanguage] = useState(
    () => sourceLanguage ?? (canAutoDetect ? "auto" : "plaintext"),
  )
  const [detectedLanguage, setDetectedLanguage] = useState(() => languageCache.get(code) ?? null)
  const [highlightingEnabled, setHighlightingEnabled] = useState(sourceLanguage !== "plaintext")
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [isHighlightReady, setIsHighlightReady] = useState(false)
  const noticeId = useId()
  const language =
    selectedLanguage === "auto" ? (detectedLanguage ?? "plaintext") : selectedLanguage
  const isUnknownLanguage = selectedLanguage === "auto" && detectedLanguage === "plaintext"
  const canHighlight = selectedLanguage !== "plaintext" && !isUnknownLanguage
  const highlightActive = highlightingEnabled && canHighlight
  const shouldHighlight = inView && highlightActive && language !== "plaintext"
  const isWaiting =
    inView &&
    highlightActive &&
    ((selectedLanguage === "auto" && !detectedLanguage) || !isHighlightReady)

  useEffect(() => {
    if (
      !inView ||
      !highlightActive ||
      selectedLanguage !== "auto" ||
      !canAutoDetect ||
      detectedLanguage
    ) {
      return
    }

    let cancelled = false
    let cancelDetection
    const detectLanguage = async () => {
      try {
        const { default: detectCodeLanguage } = await import("@/utils/code-language-detection")
        if (cancelled) {
          return
        }

        cancelDetection = scheduleWhenIdle(() => {
          if (cancelled) {
            return
          }
          try {
            const detected = normalizeCodeLanguage(detectCodeLanguage(code)) ?? "plaintext"
            cacheLanguage(code, detected)
            setDetectedLanguage(detected)
          } catch (error) {
            console.error("Failed to detect code language:", error)
            setDetectedLanguage("plaintext")
          }
        })
      } catch (error) {
        console.error("Failed to load code language detection:", error)
        if (!cancelled) {
          setDetectedLanguage("plaintext")
        }
      }
    }

    const cancelLoad = scheduleWhenIdle(() => {
      void detectLanguage()
    })
    return () => {
      cancelled = true
      cancelLoad()
      cancelDetection?.()
    }
  }, [canAutoDetect, code, detectedLanguage, highlightActive, inView, selectedLanguage])

  useEffect(() => {
    if (!shouldHighlight || isHighlightReady) {
      return
    }
    return scheduleWhenIdle(() => setIsHighlightReady(true))
  }, [isHighlightReady, shouldHighlight])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard
      .writeText(code)
      .then(() => Message.success(polyglot.t("actions.copied")))
      .catch((error) => {
        console.error(error)
        Message.error(polyglot.t("actions.copy_failed"))
      })
  }, [code, polyglot])

  const notice = isUnknownLanguage ? polyglot.t("actions.code_language_unknown") : null
  const highlightingLabel = polyglot.t(
    highlightActive ? "actions.disable_syntax_highlighting" : "actions.enable_syntax_highlighting",
  )

  const plainCode = (
    <PlainCodeBlock code={code} isWaiting={isWaiting} showLineNumbers={showLineNumbers} />
  )

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <LanguageSelector
          canAutoDetect={canAutoDetect}
          detectedLanguage={detectedLanguage}
          label={polyglot.t("actions.code_language")}
          language={selectedLanguage}
          polyglot={polyglot}
          setLanguage={setSelectedLanguage}
        />
        <div className="code-block-actions">
          <CustomTooltip mini content={highlightingLabel}>
            <Button
              aria-describedby={notice ? noticeId : undefined}
              aria-label={highlightingLabel}
              aria-pressed={highlightActive}
              className="code-highlighting-toggle"
              disabled={!canHighlight}
              htmlType="button"
              icon={<IconCode aria-hidden="true" />}
              onClick={() => setHighlightingEnabled((enabled) => !enabled)}
            />
          </CustomTooltip>
          <CustomTooltip mini content={polyglot.t("actions.code_line_numbers")}>
            <Button
              aria-label={polyglot.t("actions.code_line_numbers")}
              aria-pressed={showLineNumbers}
              className="line-numbers-toggle"
              htmlType="button"
              icon={<IconOrderedList aria-hidden="true" />}
              onClick={() => setShowLineNumbers((shown) => !shown)}
            />
          </CustomTooltip>
          <CustomTooltip mini content={polyglot.t("actions.copy_to_clipboard_tooltip")}>
            <Button
              aria-label={polyglot.t("actions.copy_to_clipboard_tooltip")}
              className="copy-button"
              htmlType="button"
              icon={<IconCopy aria-hidden="true" />}
              onClick={copyToClipboard}
            />
          </CustomTooltip>
        </div>
      </div>
      {notice && (
        <p className="code-block-notice" id={noticeId}>
          {notice}
        </p>
      )}
      {shouldHighlight && isHighlightReady ? (
        <Suspense
          fallback={<PlainCodeBlock isWaiting code={code} showLineNumbers={showLineNumbers} />}
        >
          <HighlightedCode language={language} showLineNumbers={showLineNumbers}>
            {code}
          </HighlightedCode>
        </Suspense>
      ) : (
        plainCode
      )}
    </div>
  )
}

const LanguageSelector = ({
  canAutoDetect,
  detectedLanguage,
  label,
  language,
  polyglot,
  setLanguage,
}) => (
  <Select
    showSearch
    aria-label={label}
    className="language-selector"
    value={language === "auto" ? (detectedLanguage ?? "auto") : language}
    triggerProps={{
      autoAlignPopupWidth: false,
      autoAlignPopupMinWidth: true,
      boundaryDistance: { bottom: 8, left: 8, right: 8, top: 8 },
      className: "code-language-select-popup",
      position: "bl",
    }}
    onChange={setLanguage}
  >
    <Select.Option disabled={!canAutoDetect} value="auto">
      {polyglot.t("actions.code_language_auto")}
    </Select.Option>
    {SUPPORTED_LANGUAGES.map((lang) => (
      <Select.Option key={lang} value={lang}>
        {LANGUAGE_DISPLAY_NAMES[lang]}
      </Select.Option>
    ))}
  </Select>
)

export default CodeBlock

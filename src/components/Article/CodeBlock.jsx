import { Button, Message, Select } from "@arco-design/web-react"
import { IconCopy } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useCallback, useEffect, useMemo, useState } from "react"

import CustomTooltip from "@/components/ui/CustomTooltip"
import { polyglotState } from "@/hooks/useLanguage"
import {
  detectCodeLanguage,
  LANGUAGE_DISPLAY_NAMES,
  registerLanguages,
  SUPPORTED_LANGUAGES,
  SyntaxHighlighter,
} from "@/utils/highlighter"
import scheduleWhenIdle from "@/utils/idle-callback"
import "./CodeBlock.css"

registerLanguages()

const languageCache = new Map()
const MAX_CACHED_LANGUAGES = 100
const MAX_LANGUAGE_DETECTION_CHARACTERS = 50_000
const MAX_NUMBERED_LINES = 500

const cacheLanguage = (code, language) => {
  if (languageCache.size >= MAX_CACHED_LANGUAGES) {
    languageCache.delete(languageCache.keys().next().value)
  }
  languageCache.set(code, language)
}

const CodeBlock = ({ children }) => {
  const { polyglot } = useStore(polyglotState)
  const code = children.trim()
  const [language, setLanguage] = useState(() => languageCache.get(code) ?? "plaintext")

  const copyToClipboard = useCallback(() => {
    navigator.clipboard
      .writeText(code)
      .then(() => Message.success(polyglot.t("actions.copied")))
      .catch((error) => {
        console.error(error)
        Message.error(polyglot.t("actions.copy_failed"))
      })
  }, [code, polyglot])

  const showLineNumbers = useMemo(
    () => code.split("\n", MAX_NUMBERED_LINES + 1).length <= MAX_NUMBERED_LINES,
    [code],
  )

  useEffect(() => {
    const detectLanguage = () => {
      if (code.length > MAX_LANGUAGE_DETECTION_CHARACTERS) {
        return
      }

      const cachedLanguage = languageCache.get(code)
      if (cachedLanguage) {
        setLanguage(cachedLanguage)
        return
      }

      const detectedLanguage = detectCodeLanguage(code)
      if (SUPPORTED_LANGUAGES.includes(detectedLanguage)) {
        cacheLanguage(code, detectedLanguage)
        setLanguage(detectedLanguage)
      } else {
        console.info("detectedLanguage not supported:", detectedLanguage)
      }
    }

    return scheduleWhenIdle(detectLanguage)
  }, [code])

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <LanguageSelector
          label={polyglot.t("actions.code_language")}
          language={language}
          setLanguage={setLanguage}
        />
        <CopyButton onClick={copyToClipboard} />
      </div>
      <SyntaxHighlighter
        language={language}
        showLineNumbers={showLineNumbers}
        useInlineStyles={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

const LanguageSelector = ({ label, language, setLanguage }) => (
  <Select
    showSearch
    aria-label={label}
    className="language-selector"
    value={language}
    triggerProps={{
      autoAlignPopupWidth: false,
      autoAlignPopupMinWidth: true,
      boundaryDistance: { bottom: 8, left: 8, right: 8, top: 8 },
      className: "code-language-select-popup",
      position: "bl",
    }}
    onChange={setLanguage}
  >
    {SUPPORTED_LANGUAGES.map((lang) => (
      <Select.Option key={lang} value={lang}>
        {LANGUAGE_DISPLAY_NAMES[lang] || lang}
      </Select.Option>
    ))}
  </Select>
)

const CopyButton = ({ onClick }) => {
  const { polyglot } = useStore(polyglotState)

  const copyLabel = polyglot.t("actions.copy_to_clipboard_tooltip")

  return (
    <CustomTooltip mini content={copyLabel}>
      <Button
        aria-label={copyLabel}
        className="copy-button"
        icon={<IconCopy aria-hidden="true" />}
        onClick={onClick}
      />
    </CustomTooltip>
  )
}

export default CodeBlock

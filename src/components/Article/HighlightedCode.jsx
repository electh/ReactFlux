import getCodeLineCount from "@/utils/code-block"
import { registerLanguages, SyntaxHighlighter } from "@/utils/highlighter"

registerLanguages()

const HighlightedCode = ({ children: code, language, showLineNumbers, wrapLongLines }) => {
  const lineClassName = showLineNumbers
    ? "code-block-line code-block-line-numbered"
    : "code-block-line"
  const visibleLineCount = getCodeLineCount(code)

  // A terminal newline must not create another visible inline line number.
  return (
    <SyntaxHighlighter
      language={language}
      showLineNumbers={showLineNumbers}
      useInlineStyles={false}
      wrapLongLines={wrapLongLines}
      lineNumberStyle={(lineNumber) => {
        if (lineNumber > visibleLineCount) {
          return { display: "none" }
        }
        return wrapLongLines ? { minWidth: "var(--code-line-number-width)" } : {}
      }}
      lineProps={
        wrapLongLines
          ? {
              className: lineClassName,
              // Keep syntax tokens in inline flow instead of separate flex items.
              style: { display: "block" },
            }
          : undefined
      }
    >
      {code}
    </SyntaxHighlighter>
  )
}

export default HighlightedCode

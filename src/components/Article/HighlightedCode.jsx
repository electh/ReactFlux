import getCodeLineCount from "@/utils/code-block"
import { registerLanguages, SyntaxHighlighter } from "@/utils/highlighter"

registerLanguages()

const HighlightedCode = ({ children: code, language, showLineNumbers }) => {
  const visibleLineCount = getCodeLineCount(code)

  // A terminal newline must not create another visible inline line number.
  return (
    <SyntaxHighlighter
      language={language}
      lineNumberStyle={(lineNumber) => (lineNumber > visibleLineCount ? { display: "none" } : {})}
      showLineNumbers={showLineNumbers}
      useInlineStyles={false}
    >
      {code}
    </SyntaxHighlighter>
  )
}

export default HighlightedCode

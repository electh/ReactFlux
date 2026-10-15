import { useInView } from "react-intersection-observer"

import CodeBlock from "./CodeBlock"

import "./DeferredCodeBlock.css"

const DeferredCodeBlock = ({ children: code, languageHint }) => {
  const { ref, inView } = useInView({ rootMargin: "400px 0px", triggerOnce: true })

  return (
    <div ref={ref} className="deferred-code-block">
      <CodeBlock key={`${languageHint ?? ""}:${code}`} inView={inView} languageHint={languageHint}>
        {code}
      </CodeBlock>
    </div>
  )
}

export default DeferredCodeBlock

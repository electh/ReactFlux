import { Light as SyntaxHighlighter } from "react-syntax-highlighter"
import bash from "react-syntax-highlighter/dist/esm/languages/hljs/bash"
import c from "react-syntax-highlighter/dist/esm/languages/hljs/c"
import cpp from "react-syntax-highlighter/dist/esm/languages/hljs/cpp"
import csharp from "react-syntax-highlighter/dist/esm/languages/hljs/csharp"
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css"
import diff from "react-syntax-highlighter/dist/esm/languages/hljs/diff"
import dockerfile from "react-syntax-highlighter/dist/esm/languages/hljs/dockerfile"
import go from "react-syntax-highlighter/dist/esm/languages/hljs/go"
import ini from "react-syntax-highlighter/dist/esm/languages/hljs/ini"
import java from "react-syntax-highlighter/dist/esm/languages/hljs/java"
import javascript from "react-syntax-highlighter/dist/esm/languages/hljs/javascript"
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json"
import kotlin from "react-syntax-highlighter/dist/esm/languages/hljs/kotlin"
import lua from "react-syntax-highlighter/dist/esm/languages/hljs/lua"
import markdown from "react-syntax-highlighter/dist/esm/languages/hljs/markdown"
import php from "react-syntax-highlighter/dist/esm/languages/hljs/php"
import phpTemplate from "react-syntax-highlighter/dist/esm/languages/hljs/php-template"
import plaintext from "react-syntax-highlighter/dist/esm/languages/hljs/plaintext"
import powershell from "react-syntax-highlighter/dist/esm/languages/hljs/powershell"
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python"
import ruby from "react-syntax-highlighter/dist/esm/languages/hljs/ruby"
import rust from "react-syntax-highlighter/dist/esm/languages/hljs/rust"
import shell from "react-syntax-highlighter/dist/esm/languages/hljs/shell"
import sql from "react-syntax-highlighter/dist/esm/languages/hljs/sql"
import swift from "react-syntax-highlighter/dist/esm/languages/hljs/swift"
import typescript from "react-syntax-highlighter/dist/esm/languages/hljs/typescript"
import xml from "react-syntax-highlighter/dist/esm/languages/hljs/xml"
import yaml from "react-syntax-highlighter/dist/esm/languages/hljs/yaml"

const languages = {
  bash,
  c,
  cpp,
  csharp,
  css,
  diff,
  dockerfile,
  go,
  html: xml,
  ini,
  java,
  javascript,
  json,
  kotlin,
  lua,
  markdown,
  php,
  "php-template": phpTemplate,
  plaintext,
  powershell,
  python,
  ruby,
  rust,
  shell,
  sql,
  swift,
  typescript,
  xml,
  yaml,
}

export const registerLanguages = () => {
  for (const [name, language] of Object.entries(languages)) {
    SyntaxHighlighter.registerLanguage(name, language)
  }
}

export { Light as SyntaxHighlighter } from "react-syntax-highlighter"

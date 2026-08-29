import hljs from "highlight.js/lib/core"
import bash from "highlight.js/lib/languages/bash"
import c from "highlight.js/lib/languages/c"
import cpp from "highlight.js/lib/languages/cpp"
import csharp from "highlight.js/lib/languages/csharp"
import css from "highlight.js/lib/languages/css"
import diff from "highlight.js/lib/languages/diff"
import dockerfile from "highlight.js/lib/languages/dockerfile"
import go from "highlight.js/lib/languages/go"
import ini from "highlight.js/lib/languages/ini"
import java from "highlight.js/lib/languages/java"
import javascript from "highlight.js/lib/languages/javascript"
import json from "highlight.js/lib/languages/json"
import kotlin from "highlight.js/lib/languages/kotlin"
import lua from "highlight.js/lib/languages/lua"
import markdown from "highlight.js/lib/languages/markdown"
import php from "highlight.js/lib/languages/php"
import phpTemplate from "highlight.js/lib/languages/php-template"
import plaintext from "highlight.js/lib/languages/plaintext"
import powershell from "highlight.js/lib/languages/powershell"
import python from "highlight.js/lib/languages/python"
import ruby from "highlight.js/lib/languages/ruby"
import rust from "highlight.js/lib/languages/rust"
import shell from "highlight.js/lib/languages/shell"
import sql from "highlight.js/lib/languages/sql"
import swift from "highlight.js/lib/languages/swift"
import typescript from "highlight.js/lib/languages/typescript"
import xml from "highlight.js/lib/languages/xml"
import yaml from "highlight.js/lib/languages/yaml"

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

let languagesRegistered = false

const registerDetectionLanguages = () => {
  if (languagesRegistered) {
    return
  }

  for (const [name, language] of Object.entries(languages)) {
    hljs.registerLanguage(name, language)
  }
  languagesRegistered = true
}

const detectCodeLanguage = (code) => {
  registerDetectionLanguages()
  return hljs.highlightAuto(code, Object.keys(languages)).language
}

export default detectCodeLanguage

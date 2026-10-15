export const LANGUAGE_DISPLAY_NAMES = {
  bash: "Bash",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  css: "CSS",
  diff: "Diff",
  dockerfile: "Dockerfile",
  go: "Go",
  html: "HTML",
  ini: "INI",
  java: "Java",
  javascript: "JavaScript",
  json: "JSON",
  kotlin: "Kotlin",
  lua: "Lua",
  markdown: "Markdown",
  php: "PHP",
  "php-template": "PHP Template",
  plaintext: "Plaintext",
  powershell: "PowerShell",
  python: "Python",
  ruby: "Ruby",
  rust: "Rust",
  shell: "Shell",
  sql: "SQL",
  swift: "Swift",
  typescript: "TypeScript",
  xml: "XML",
  yaml: "YAML",
}

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_DISPLAY_NAMES)

const LANGUAGE_ALIASES = {
  "c++": "cpp",
  "c#": "csharp",
  console: "shell",
  cs: "csharp",
  docker: "dockerfile",
  golang: "go",
  htm: "html",
  js: "javascript",
  jsx: "javascript",
  kt: "kotlin",
  md: "markdown",
  "no-highlight": "plaintext",
  nohighlight: "plaintext",
  patch: "diff",
  plain: "plaintext",
  ps1: "powershell",
  py: "python",
  python3: "python",
  rb: "ruby",
  rs: "rust",
  sh: "bash",
  shellsession: "shell",
  text: "plaintext",
  ts: "typescript",
  tsx: "typescript",
  txt: "plaintext",
  yml: "yaml",
  zsh: "bash",
}

export const normalizeCodeLanguage = (language) => {
  if (typeof language !== "string") {
    return null
  }

  const value = language.trim().toLowerCase()
  const normalized = Object.hasOwn(LANGUAGE_ALIASES, value) ? LANGUAGE_ALIASES[value] : value
  return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : null
}

const getAttributeLanguage = (attributes = {}) => {
  for (const attribute of ["data-language", "data-lang"]) {
    const language = normalizeCodeLanguage(attributes[attribute])
    if (language) {
      return language
    }
  }

  for (const className of (attributes.class ?? "").split(/\s+/)) {
    if (/^no-?highlight$/i.test(className)) {
      return "plaintext"
    }

    const match = /^(?:language-|lang-)(.+)$/i.exec(className)
    const language = normalizeCodeLanguage(match?.[1])
    if (language) {
      return language
    }
  }

  return null
}

export const getCodeLanguage = (preElement) => {
  const codeElement = preElement.children?.find((child) => child.name === "code")
  return getAttributeLanguage(codeElement?.attribs) ?? getAttributeLanguage(preElement.attribs)
}

import { Button, Message, Select } from "@arco-design/web-react";
import { IconCopy } from "@arco-design/web-react/icon";
import { useStore } from "@nanostores/react";
import { Highlight, Prism, themes } from "prism-react-renderer";
import { useCallback, useState } from "react";
import { polyglotState } from "../../hooks/useLanguage";

// https://prismjs.com/#supported-languages
const LANGUAGE_DISPLAY_NAMES = {
  bash: "Bash",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  css: "CSS",
  dockerfile: "Dockerfile",
  go: "Go",
  html: "HTML",
  java: "Java",
  javascript: "JavaScript",
  json: "JSON",
  kotlin: "Kotlin",
  markdown: "Markdown",
  php: "PHP",
  powershell: "PowerShell",
  python: "Python",
  ruby: "Ruby",
  rust: "Rust",
  sql: "SQL",
  swift: "Swift",
  typescript: "TypeScript",
  xml: "XML",
  yaml: "YAML",
};

const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_DISPLAY_NAMES);
const DEFAULT_LANGUAGE = "markdown";

(typeof global !== "undefined" ? global : window).Prism = Prism;
for (const lang of Object.keys(LANGUAGE_DISPLAY_NAMES)) {
  import(`prismjs/components/prism-${lang}`).catch((error) => {
    console.warn(`Failed to load language: ${lang}`, error);
  });
}

const THEMES = {
  Dracula: themes.dracula,
  DuotoneDark: themes.duotoneDark,
  DuotoneLight: themes.duotoneLight,
  GitHub: themes.github,
  MaterialDark: themes.gruvboxMaterialDark,
  MaterialLight: themes.gruvboxMaterialLight,
  JettwaveDark: themes.jettwaveDark,
  JettwaveLight: themes.jettwaveLight,
  NightOwl: themes.nightOwl,
  NightOwlLight: themes.nightOwlLight,
  OceanicNext: themes.oceanicNext,
  Okaidia: themes.okaidia,
  OneDark: themes.oneDark,
  OneLight: themes.oneLight,
  Palenight: themes.palenight,
  ShadesOfPurple: themes.shadesOfPurple,
  Synthwave84: themes.synthwave84,
  Ultramin: themes.ultramin,
  VsDark: themes.vsDark,
  VsLight: themes.vsLight,
};

const DEFAULT_THEME = "OneDark";

const CodeBlock = ({ children, className }) => {
  const { polyglot } = useStore(polyglotState);

  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [language, setLanguage] = useState(
    () =>
      SUPPORTED_LANGUAGES.find(
        (lang) =>
          className &&
          (className.includes(`language-${lang}`) ||
            className.includes(`lang-${lang}`) ||
            className.includes(lang)),
      ) || DEFAULT_LANGUAGE,
  );

  const copyToClipboard = useCallback(() => {
    navigator.clipboard
      .writeText(children.trim())
      .then(() => Message.success(polyglot.t("actions.copied")));
  }, [children, polyglot]);

  return (
    <div style={{ position: "relative" }}>
      <Select
        onChange={setLanguage}
        value={language}
        showSearch
        style={{
          position: "absolute",
          top: 10,
          right: 196,
          zIndex: 1,
          width: 120,
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <Select.Option key={lang} value={lang}>
            {LANGUAGE_DISPLAY_NAMES[lang] || lang}
          </Select.Option>
        ))}
      </Select>
      <Select
        onChange={setTheme}
        value={theme}
        showSearch
        style={{
          position: "absolute",
          top: 10,
          right: 52,
          zIndex: 1,
          width: 134,
        }}
      >
        {Object.keys(THEMES).map((themeName) => (
          <Select.Option key={themeName} value={themeName}>
            {themeName}
          </Select.Option>
        ))}
      </Select>
      <Button
        icon={<IconCopy />}
        onClick={copyToClipboard}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1,
        }}
      />
      <Highlight
        code={children.trim()}
        language={language}
        prism={Prism}
        theme={THEMES[theme]}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={className} style={{ ...style, paddingTop: "50px" }}>
            {tokens.map((line, i) => (
              <div
                key={`line-${i}-${line[0]?.content.slice(0, 5)}`}
                {...getLineProps({ line, key: i })}
              >
                {line.map((token, key) => (
                  <span
                    key={`token-${i}-${key}-${token.content.slice(0, 5)}`}
                    {...getTokenProps({ token, key })}
                  />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
};

export default CodeBlock;

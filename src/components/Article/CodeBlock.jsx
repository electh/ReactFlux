import { Button, Message, Select } from "@arco-design/web-react";
import { IconCopy } from "@arco-design/web-react/icon";
import { useStore } from "@nanostores/react";
import { Highlight, Prism, themes } from "prism-react-renderer";
import { useCallback, useState } from "react";
import { polyglotState } from "../../hooks/useLanguage";
import { settingsState, updateSettings } from "../../store/settingsState";
import CustomTooltip from "../ui/CustomTooltip";
import "./CodeBlock.css";

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

const detectLanguage = (className) => {
  return SUPPORTED_LANGUAGES.find(
    (lang) =>
      className &&
      (className.includes(`language-${lang}`) ||
        className.includes(`lang-${lang}`) ||
        className.includes(lang)),
  );
};

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

const CodeBlock = ({ children, className }) => {
  const { highlightTheme } = useStore(settingsState);
  const { polyglot } = useStore(polyglotState);

  const [language, setLanguage] = useState(
    () => detectLanguage(className) || DEFAULT_LANGUAGE,
  );

  const copyToClipboard = useCallback(() => {
    navigator.clipboard
      .writeText(children.trim())
      .then(() => Message.success(polyglot.t("actions.copied")));
  }, [children, polyglot]);

  const code = children.trim();
  const lineCount = code.split("\n").length;
  const lineNumberWidth = calculateLineNumberWidth(lineCount);
  const paddingLeft = `${lineNumberWidth + 1.5}em`;

  return (
    <div className="code-block-container">
      <LanguageSelector language={language} setLanguage={setLanguage} />
      <ThemeSelector />
      <CopyButton onClick={copyToClipboard} />
      <CodeHighlight
        code={code}
        language={language}
        theme={THEMES[highlightTheme]}
        lineNumberWidth={lineNumberWidth}
        paddingLeft={paddingLeft}
      />
    </div>
  );
};

const calculateLineNumberWidth = (lineCount) => {
  if (lineCount < 10) {
    return 1;
  }
  if (lineCount < 100) {
    return 2;
  }
  if (lineCount < 1000) {
    return 3;
  }
  return Math.floor(Math.log10(lineCount)) + 1;
};

const LanguageSelector = ({ language, setLanguage }) => (
  <Select
    onChange={setLanguage}
    value={language}
    showSearch
    className="language-selector"
  >
    {SUPPORTED_LANGUAGES.map((lang) => (
      <Select.Option key={lang} value={lang}>
        {LANGUAGE_DISPLAY_NAMES[lang] || lang}
      </Select.Option>
    ))}
  </Select>
);

const ThemeSelector = () => {
  const { highlightTheme } = useStore(settingsState);

  return (
    <Select
      onChange={(value) => updateSettings({ highlightTheme: value })}
      value={highlightTheme}
      showSearch
      className="theme-selector"
    >
      {Object.keys(THEMES).map((themeName) => (
        <Select.Option key={themeName} value={themeName}>
          {themeName}
        </Select.Option>
      ))}
    </Select>
  );
};

const CopyButton = ({ onClick }) => {
  const { polyglot } = useStore(polyglotState);

  return (
    <CustomTooltip
      content={polyglot.t("actions.copy_to_clipboard_tooltip")}
      mini
    >
      <Button icon={<IconCopy />} onClick={onClick} className="copy-button" />
    </CustomTooltip>
  );
};

const LineNumber = ({ number, width }) => (
  <span
    style={{
      position: "absolute",
      left: `-${width + 1.5}em`,
      width: `${width + 0.5}em`,
      textAlign: "right",
      color: "rgba(255,255,255,0.4)",
      userSelect: "none",
      paddingRight: "0.5em",
    }}
  >
    {number}
  </span>
);

const CodeHighlight = ({
  code,
  language,
  theme,
  lineNumberWidth,
  paddingLeft,
}) => (
  <Highlight code={code} language={language} prism={Prism} theme={theme}>
    {({ className, style, tokens, getLineProps, getTokenProps }) => (
      <pre
        className={className}
        style={{
          ...style,
          paddingTop: "50px",
          paddingLeft,
          position: "relative",
        }}
      >
        {tokens.map((line, i) => (
          <div
            key={`line-${i}-${line[0]?.content.slice(0, 5)}`}
            {...getLineProps({ line, key: i })}
            style={{ position: "relative" }}
          >
            <LineNumber number={i + 1} width={lineNumberWidth} />
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
);

export default CodeBlock;

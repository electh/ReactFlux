import { Select } from "@arco-design/web-react";
import { Highlight, themes } from "prism-react-renderer";
import { useState } from "react";

// https://github.com/FormidableLabs/prism-react-renderer/blob/master/packages/generate-prism-languages/index.ts
const SUPPORTED_LANGUAGES = [
  "cpp",
  "go",
  "graphql",
  "js-extras",
  "json",
  "jsx",
  "kotlin",
  "markdown",
  "markup",
  "objectivec",
  "python",
  "reason",
  "rust",
  "swift",
  "tsx",
  "yaml",
];

const DEFAULT_LANGUAGE = "markdown";

const CodeBlock = ({ children, className }) => {
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

  return (
    <div style={{ position: "relative" }}>
      <Select
        onChange={setLanguage}
        value={language}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1,
          width: 120,
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <Select.Option key={lang} value={lang}>
            {lang}
          </Select.Option>
        ))}
      </Select>
      <Highlight
        theme={themes.vsDark}
        code={children.trim()}
        language={language}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={className} style={{ ...style }}>
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

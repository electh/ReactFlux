import { Button, Message, Select } from "@arco-design/web-react";
import { IconCopy } from "@arco-design/web-react/icon";
import { useStore } from "@nanostores/react";
import hljs from "highlight.js";
import { useCallback, useEffect, useState } from "react";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { polyglotState } from "../../hooks/useLanguage";
import { SyntaxHighlighter } from "../../utils/highlighter";
import {
  LANGUAGE_DISPLAY_NAMES,
  SUPPORTED_LANGUAGES,
} from "../../utils/highlighter";
import { useContentContext } from "../Content/ContentContext";
import CustomTooltip from "../ui/CustomTooltip";
import "./CodeBlock.css";

const CodeBlock = ({ children }) => {
  const { polyglot } = useStore(polyglotState);

  const [language, setLanguage] = useState("plaintext");

  const { isSwipingCodeBlock, setIsSwipingCodeBlock } = useContentContext();

  const copyToClipboard = useCallback(() => {
    navigator.clipboard
      .writeText(children.trim())
      .then(() => Message.success(polyglot.t("actions.copied")));
  }, [children, polyglot]);

  const code = children.trim();

  const handleSwipeStart = useCallback(() => {
    if (!isSwipingCodeBlock) {
      setIsSwipingCodeBlock(true);
    }
  }, [isSwipingCodeBlock, setIsSwipingCodeBlock]);

  const handleSwipeEnd = useCallback(() => {
    if (isSwipingCodeBlock) {
      setIsSwipingCodeBlock(false);
    }
  }, [isSwipingCodeBlock, setIsSwipingCodeBlock]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setTimeout(() => {
      const detectedLanguage = hljs.highlightAuto(children).language;
      if (SUPPORTED_LANGUAGES.includes(detectedLanguage)) {
        setLanguage(detectedLanguage);
      } else {
        console.info("detectedLanguage not supported: ", detectedLanguage);
      }
    }, 200);
  }, []);

  return (
    <div
      className="code-block-container"
      onTouchStart={handleSwipeStart}
      onTouchEnd={handleSwipeEnd}
    >
      <LanguageSelector language={language} setLanguage={setLanguage} />
      <CopyButton onClick={copyToClipboard} />
      <SyntaxHighlighter
        language={language}
        showLineNumbers={true}
        style={atomOneDark}
        wrapLines={true}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

const LanguageSelector = ({ language, setLanguage }) => (
  <Select
    className="language-selector"
    onChange={setLanguage}
    showSearch
    value={language}
    triggerProps={{
      autoAlignPopupWidth: false,
      autoAlignPopupMinWidth: true,
      position: "bl",
    }}
  >
    {SUPPORTED_LANGUAGES.map((lang) => (
      <Select.Option key={lang} value={lang}>
        {LANGUAGE_DISPLAY_NAMES[lang] || lang}
      </Select.Option>
    ))}
  </Select>
);

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

export default CodeBlock;

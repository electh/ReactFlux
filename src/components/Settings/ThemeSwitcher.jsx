import { Select } from "@arco-design/web-react";
import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { polyglotState } from "../../hooks/useLanguage";

const ThemeSwitcher = () => {
  const { polyglot } = useStore(polyglotState);

  const [theme, setTheme] = useState("default");

  useEffect(() => {
    document.body.className = theme;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `/src/styles/${theme}-theme.css`;
    if (theme !== "default") {
      document.head.appendChild(link);
    }

    return () => {
      if (theme !== "default") {
        document.head.removeChild(link);
      }
    };
  }, [theme]);

  const handleThemeChange = (value) => {
    setTheme(value);
  };

  return (
    <Select onChange={handleThemeChange} style={{ width: 150 }} value={theme}>
      <Select.Option value="default">
        {polyglot.t("appearance.default_theme")}
      </Select.Option>
      <Select.Option value="stone">Stone</Select.Option>
    </Select>
  );
};

export default ThemeSwitcher;

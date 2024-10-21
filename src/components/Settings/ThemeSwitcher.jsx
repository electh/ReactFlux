import { Select } from "@arco-design/web-react";
import { useStore } from "@nanostores/react";
import { polyglotState } from "../../hooks/useLanguage";
import { settingsState, updateSettings } from "../../store/settingsState";

const ThemeSwitcher = () => {
  const { polyglot } = useStore(polyglotState);
  const { theme } = useStore(settingsState);

  const handleThemeChange = (value) => {
    updateSettings({ theme: value });
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

import { Select } from "@arco-design/web-react";
import { useStore } from "@nanostores/react";
import { settingsState, updateSettings } from "../../store/settingsState";

const ThemeSwitcher = () => {
  const { theme } = useStore(settingsState);

  const handleThemeChange = (value) => {
    updateSettings({ theme: value });
  };

  return (
    <Select onChange={handleThemeChange} style={{ width: 150 }} value={theme}>
      <Select.Option value="blue">Blue</Select.Option>
      <Select.Option value="stone">Stone</Select.Option>
    </Select>
  );
};

export default ThemeSwitcher;

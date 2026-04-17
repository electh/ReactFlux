import { Divider, Select, Switch, Tooltip } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import SettingItem from "./SettingItem"

import { LayoutColumnIcon, LayoutCombinedIcon } from "@/components/icons/LayoutModeIcons"
import { polyglotState } from "@/hooks/useLanguage"
import { settingsState, updateSettings } from "@/store/settingsState"
import { applyColor, colors, getDisplayColorValue } from "@/utils/colors"

import "./Appearance.css"

const handleConfigChange = (settingsChanges) => {
  updateSettings(settingsChanges)
  if (settingsChanges.themeColor) {
    applyColor(settingsChanges.themeColor)
  }
}

const Appearance = () => {
  const { animationsEnabled, compactSidebarGroups, fontFamily, layoutMode, themeColor } =
    useStore(settingsState)
  const { polyglot } = useStore(polyglotState)

  const fontFamilyOptions = [
    { label: polyglot.t("appearance.font_family_system"), value: "system-ui" },
    { label: "Inter", value: "'Inter', sans-serif" },
    { label: "Lato", value: "'Lato', sans-serif" },
    { label: "Sans-serif", value: "sans-serif" },
    { label: "Serif", value: "serif" },
    { label: "Fira Sans", value: "'Fira Sans', sans-serif" },
    { label: "Open Sans", value: "'Open Sans', sans-serif" },
    { label: "Source Sans Pro", value: "'Source Sans Pro', sans-serif" },
    { label: "Source Serif Pro", value: "'Source Serif Pro', serif" },
    {
      label: polyglot.t("appearance.font_family_noto_sans"),
      value: "'Noto Sans SC', sans-serif",
    },
    {
      label: polyglot.t("appearance.font_family_noto_serif"),
      value: "'Noto Serif SC', serif",
    },
    {
      label: polyglot.t("appearance.font_family_lxgw_wenkai"),
      value: "'LXGW WenKai Screen', sans-serif",
    },
  ]

  const layoutOptions = [
    {
      icon: <LayoutColumnIcon />,
      label: polyglot.t("appearance.layout_mode_classic"),
      value: "classic",
    },
    {
      icon: <LayoutCombinedIcon />,
      label: polyglot.t("appearance.layout_mode_stream"),
      value: "stream",
    },
  ]

  return (
    <>
      <SettingItem
        description={polyglot.t("appearance.theme_color_description")}
        title={polyglot.t("appearance.theme_color_label")}
      >
        <div style={{ display: "flex" }}>
          {Object.keys(colors).map((colorName) => {
            const hex = colors[colorName]?.light || getDisplayColorValue(colorName)
            const tooltip = `${colorName} — ${hex}`
            return (
              <Tooltip key={colorName} content={tooltip} position="tl">
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={polyglot.t("appearance.theme_color_aria_label", {
                    color: colorName,
                  })}
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    margin: "2px",
                    backgroundColor: getDisplayColorValue(colorName),
                    cursor: "pointer",
                    border: "3px solid var(--color-bg-3)",
                    outline:
                      colorName === themeColor
                        ? `1px solid ${getDisplayColorValue(colorName)}`
                        : "none",
                  }}
                  onClick={() => handleConfigChange({ themeColor: colorName })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      handleConfigChange({ themeColor: colorName })
                    }
                  }}
                />
              </Tooltip>
            )
          })}
        </div>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.font_family_description")}
        title={polyglot.t("appearance.font_family_label")}
      >
        <Select
          className="input-select"
          value={fontFamily}
          onChange={(value) => handleConfigChange({ fontFamily: value })}
        >
          {fontFamilyOptions.map(({ label, value }) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.layout_mode_description")}
        title={polyglot.t("appearance.layout_mode_label")}
      >
        <Select
          className="input-select"
          value={layoutMode}
          onChange={(value) => handleConfigChange({ layoutMode: value })}
        >
          {layoutOptions.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              <span className="layout-mode-option">
                {option.icon}
                <span>{option.label}</span>
              </span>
            </Select.Option>
          ))}
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.lightbox_animation_description")}
        title={polyglot.t("appearance.lightbox_animation_label")}
      >
        <Switch
          checked={animationsEnabled}
          onChange={(checked) =>
            handleConfigChange({
              animationsEnabled: checked,
            })
          }
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.compact_sidebar_groups_description")}
        title={polyglot.t("settings.compact_sidebar_groups_label")}
      >
        <Switch
          checked={compactSidebarGroups}
          onChange={(value) => handleConfigChange({ compactSidebarGroups: value })}
        />
      </SettingItem>
    </>
  )
}

export default Appearance

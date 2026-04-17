import { generate, getRgbStr } from "@arco-design/color"

import { getSettings } from "@/store/settingsState"

export const colors = {
  Red: { light: "#DC2626", dark: "#DC2626" },
  Orange: { light: "#F97316", dark: "#EA580C" },
  Yellow: { light: "#FACC15", dark: "#FACC15" },
  Green: { light: "#2E6F40", dark: "#1B3D2C" },
  Blue: { light: "#2563EB", dark: "#3B82F6" },
  "YInMn Blue": { light: "#306AC0", dark: "#2B5AA8" },
  Violet: { light: "#722ED1", dark: "#8E51DA" },
  OLED: { dark: "#000000", darkOnly: true, swatch: "#000000" },
  Gray: { light: "#4B5563", lightOnly: true, swatch: "#9CA3AF" },
}

export const isDarkOnlyColor = (colorName) => Boolean(colors[colorName]?.darkOnly)
export const isLightOnlyColor = (colorName) => Boolean(colors[colorName]?.lightOnly)
export const isModeRestrictedColor = (colorName, isDark) => {
  if (isDarkOnlyColor(colorName) && !isDark) {
    return true
  }
  if (isLightOnlyColor(colorName) && isDark) {
    return true
  }
  return false
}

const modeColorPairs = {
  OLED: "Gray",
  Gray: "OLED",
}

export const getModeFallbackColor = (colorName, defaultColor = "Blue") =>
  modeColorPairs[colorName] ?? defaultColor

const isDarkMode = () => {
  const isSystemDark = globalThis.matchMedia("(prefers-color-scheme: dark)").matches
  const themeMode = getSettings("themeMode")
  return themeMode === "system" ? isSystemDark : themeMode === "dark"
}

const getColorFromPalette = (palette, colorName, defaultColor = "Blue") => {
  const color = palette[colorName] || palette[defaultColor]
  const dark = isDarkMode()
  if ((color?.darkOnly && !dark) || (color?.lightOnly && dark)) {
    return palette[defaultColor][dark ? "dark" : "light"]
  }
  return dark ? color.dark : color.light
}

const getColorValue = (colorName) => getColorFromPalette(colors, colorName)

export const getDisplayColorValue = (colorName) => {
  const color = colors[colorName]
  if (color?.swatch) {
    return color.swatch
  }
  return getColorFromPalette(colors, colorName)
}

const getPrimaryGenerationColor = (colorName) => {
  if (colorName === "OLED" && isDarkMode()) {
    return "#6B7280"
  }
  if (colorName === "Gray" && !isDarkMode()) {
    return "#6B7280"
  }
  return getColorValue(colorName)
}

export const applyColor = (colorName) => {
  const colorPalette = generate(getPrimaryGenerationColor(colorName), { list: true }).map((color) =>
    getRgbStr(color),
  )
  for (const [index, color] of colorPalette.entries()) {
    document.body.style.setProperty(`--primary-${index + 1}`, color)
  }
  document.body.setAttribute("color-name", colorName)
}

import { generate, getRgbStr } from "@arco-design/color"

import { getSettings } from "@/store/settingsState"

export const colors = {
  Red: { light: "#DC2626", dark: "#DC2626" },
  Orange: { light: "#F97316", dark: "#EA580C" },
  Yellow: { light: "#FACC15", dark: "#FACC15" },
  Green: { light: "#16A34A", dark: "#22C55E" },
  Blue: { light: "#2563EB", dark: "#3B82F6" },
  Violet: { light: "#722ED1", dark: "#8E51DA" },
}

const isDarkMode = () => {
  const isSystemDark = globalThis.matchMedia("(prefers-color-scheme: dark)").matches
  const themeMode = getSettings("themeMode")
  return themeMode === "system" ? isSystemDark : themeMode === "dark"
}

const getColorFromPalette = (palette, colorName, defaultColor = "Blue") => {
  const color = palette[colorName] || palette[defaultColor]
  return isDarkMode() ? color.dark : color.light
}

const getColorValue = (colorName) => getColorFromPalette(colors, colorName)

export const getDisplayColorValue = (colorName) => getColorFromPalette(colors, colorName)

export const applyColor = (colorName) => {
  const colorPalette = generate(getColorValue(colorName), { list: true }).map((color) =>
    getRgbStr(color),
  )
  for (const [index, color] of colorPalette.entries()) {
    document.body.style.setProperty(`--primary-${index + 1}`, color)
  }
  document.body.setAttribute("color-name", colorName)
}

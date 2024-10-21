import { generate, getRgbStr } from "@arco-design/color";
import { getSettings } from "../store/settingsState";

export const colors = {
  Zine: { light: "#18181B", dark: "#FAFAFA" },
  Slate: { light: "#0F172A", dark: "#F8FAFC" },
  Stone: { light: "#1C1917", dark: "#FAFAF9" },
  Gray: { light: "#111827", dark: "#F9FAFB" },
  Neutral: { light: "#171717", dark: "#FAFAFA" },
  Red: { light: "#DC2626", dark: "#DC2626" },
  Orange: { light: "#F97316", dark: "#EA580C" },
  Yellow: { light: "#FACC15", dark: "#FACC15" },
  Green: { light: "#16A34A", dark: "#22C55E" },
  Blue: { light: "#2563EB", dark: "#3B82F6" },
  Violet: { light: "#7C3AED", dark: "#6D28D9" },
};

export const displayColors = {
  Zine: { light: "#18181B", dark: "#52525B" },
  Slate: { light: "#64748B", dark: "#475569" },
  Stone: { light: "#78716C", dark: "#57534E" },
  Gray: { light: "#6B7280", dark: "#4B5563" },
  Neutral: { light: "#737373", dark: "#525252" },
  Red: { light: "#DC2626", dark: "#DC2626" },
  Orange: { light: "#F97316", dark: "#EA580C" },
  Yellow: { light: "#FACC15", dark: "#FACC15" },
  Green: { light: "#16A34A", dark: "#22C55E" },
  Blue: { light: "#2563EB", dark: "#3B82F6" },
  Violet: { light: "#7C3AED", dark: "#6D28D9" },
};

const isDarkMode = () => {
  const isSystemDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  const themeMode = getSettings("themeMode");
  return themeMode === "system" ? isSystemDark : themeMode === "dark";
};

const getColorFromPalette = (palette, colorName, defaultColor = "Blue") => {
  const color = palette[colorName] || palette[defaultColor];
  return isDarkMode() ? color.dark : color.light;
};

const getColorValue = (colorName) => getColorFromPalette(colors, colorName);

export const getDisplayColorValue = (colorName) =>
  getColorFromPalette(displayColors, colorName);

export const applyColor = (colorName) => {
  const colorPalette = generate(getColorValue(colorName), { list: true }).map(
    getRgbStr,
  );
  colorPalette.forEach((color, index) => {
    document.body.style.setProperty(`--primary-${index + 1}`, color);
  });
};

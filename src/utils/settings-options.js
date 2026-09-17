export const MIN_ARTICLE_FONT_SIZE = 1
export const MAX_ARTICLE_FONT_SIZE = 1.5
export const MIN_ARTICLE_WIDTH = 50
export const MAX_ARTICLE_WIDTH = 100

export const ARTICLE_LIST_LAYOUT_OPTIONS = Object.freeze([
  { value: "column", labelKey: "appearance.article_list_layout_column" },
  { value: "list", labelKey: "appearance.article_list_layout_list" },
])

export const ARTICLE_LIST_LAYOUTS = Object.freeze(
  ARTICLE_LIST_LAYOUT_OPTIONS.map(({ value }) => value),
)

const FONT_FAMILY_DEFINITIONS = Object.freeze([
  { value: "system-ui", labelKey: "appearance.font_family_system" },
  { value: "sans-serif", label: "Sans-serif" },
  { value: "serif", label: "Serif" },
  { value: "'Fira Sans', sans-serif", label: "Fira Sans" },
  { value: "'Open Sans', sans-serif", label: "Open Sans" },
  { value: "'Source Sans Pro', sans-serif", label: "Source Sans Pro" },
  { value: "'Source Serif Pro', serif", label: "Source Serif Pro" },
  {
    value: "'Noto Sans', 'Noto Sans SC', sans-serif",
    labelKey: "appearance.font_family_noto_sans",
  },
  {
    value: "'Noto Serif', 'Noto Serif SC', serif",
    labelKey: "appearance.font_family_noto_serif",
  },
  {
    value: "'LXGW WenKai Screen', sans-serif",
    labelKey: "appearance.font_family_lxgw_wenkai",
  },
])

export const FONT_FAMILIES = Object.freeze(FONT_FAMILY_DEFINITIONS.map(({ value }) => value))

export const THEME_MODE_OPTIONS = Object.freeze([
  { value: "system", labelKey: "appearance.theme_mode_system" },
  { value: "light", labelKey: "appearance.theme_mode_light" },
  { value: "dark", labelKey: "appearance.theme_mode_dark" },
])

export const THEME_MODES = Object.freeze(THEME_MODE_OPTIONS.map(({ value }) => value))

export const TITLE_ALIGNMENT_OPTIONS = Object.freeze([
  { value: "left", labelKey: "appearance.title_alignment_left" },
  { value: "center", labelKey: "appearance.title_alignment_center" },
])

export const TITLE_ALIGNMENTS = Object.freeze(TITLE_ALIGNMENT_OPTIONS.map(({ value }) => value))

export const SWIPE_SENSITIVITIES = Object.freeze([0.5, 0.75, 1, 1.25, 1.5])

export const createFontFamilyOptions = (polyglot) =>
  FONT_FAMILY_DEFINITIONS.map(({ label, labelKey, value }) => ({
    label: labelKey ? polyglot.t(labelKey) : label,
    value,
  }))

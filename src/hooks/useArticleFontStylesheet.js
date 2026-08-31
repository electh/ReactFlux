import { useStore } from "@nanostores/react"
import { useEffect } from "react"

import { articleFontFamilyState } from "@/store/settingsState"

const LXGW_FONT_FAMILY = "'LXGW WenKai Screen', sans-serif"
const LXGW_STYLESHEET_ID = "lxgw-wenkai-stylesheet"
const LXGW_STYLESHEET_URL =
  "https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-web/lxgwwenkaiscreen/result.css"

const useArticleFontStylesheet = () => {
  const fontFamily = useStore(articleFontFamilyState)

  useEffect(() => {
    if (fontFamily !== LXGW_FONT_FAMILY || document.querySelector(`#${LXGW_STYLESHEET_ID}`)) {
      return
    }

    const stylesheet = document.createElement("link")
    stylesheet.id = LXGW_STYLESHEET_ID
    stylesheet.rel = "stylesheet"
    stylesheet.href = LXGW_STYLESHEET_URL
    document.head.append(stylesheet)
  }, [fontFamily])
}

export default useArticleFontStylesheet

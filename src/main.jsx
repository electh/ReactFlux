import { ConfigProvider } from "@arco-design/web-react"
import "@arco-design/web-react/dist/css/arco.css"
import enUS from "@arco-design/web-react/es/locale/en-US"
import esES from "@arco-design/web-react/es/locale/es-ES"
import frFR from "@arco-design/web-react/es/locale/fr-FR"
import zhCN from "@arco-design/web-react/es/locale/zh-CN"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router-dom"

import "simplebar-react/dist/simplebar.min.css"

import updateSW from "./pwa"
import "./index.css"
import router from "./routes"
import { registerLanguages } from "./utils/highlighter"
import "./theme.css"
import { getPreferredLanguage } from "./utils/locales"

const localMap = {
  "es-ES": esES,
  "fr-FR": frFR,
  "zh-CN": zhCN,
}

const getLocale = () => localMap[getPreferredLanguage()] || enUS

updateSW()
registerLanguages()

ReactDOM.createRoot(document.getElementById("root")).render(
  <ConfigProvider locale={getLocale()}>
    <RouterProvider router={router} />
  </ConfigProvider>,
)

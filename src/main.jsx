import "@arco-design/web-react/dist/css/arco.css"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router/dom"
import { registerSW } from "virtual:pwa-register"

import "simplebar-react/dist/simplebar.min.css"

import "./index.css"
import router from "./routes"
import { registerLanguages } from "./utils/highlighter"
import "./theme.css"

registerSW({ immediate: true })
registerLanguages()

ReactDOM.createRoot(document.querySelector("#root")).render(<RouterProvider router={router} />)

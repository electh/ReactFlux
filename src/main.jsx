import "@arco-design/web-react/es/_util/react-19-adapter"
import "@arco-design/web-react/dist/css/arco.css"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router/dom"
import { registerSW } from "virtual:pwa-register"

import "simplebar-react/dist/simplebar.min.css"

import "./index.css"
import router from "./routes"
import "./theme.css"

registerSW({ immediate: true })

ReactDOM.createRoot(document.querySelector("#root")).render(<RouterProvider router={router} />)

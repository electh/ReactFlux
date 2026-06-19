import "@arco-design/web-react/dist/css/arco.css"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router/dom"
import { registerSW } from "virtual:pwa-register"

import "simplebar-react/dist/simplebar.min.css"

import "./index.css"
import router from "./routes"
import { registerLanguages } from "./utils/highlighter"
import "./theme.css"

if ("serviceWorker" in navigator) {
  if (import.meta.env.DEV) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    } catch (error) {
      console.error("Failed to unregister service workers in development:", error)
    }
  } else {
    // Do NOT auto-reload: a new SW deployed while a tab sat idle would otherwise
    // hijack the next F5 and reload the page a second time, mid feed-load. Surface
    // a prompt instead and let the user choose when to apply the update.
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        globalThis.dispatchEvent(
          new CustomEvent("reloadedflux:sw-need-refresh", {
            detail: { updateSW },
          }),
        )
      },
    })
  }
}

registerLanguages()

ReactDOM.createRoot(document.querySelector("#root")).render(<RouterProvider router={router} />)

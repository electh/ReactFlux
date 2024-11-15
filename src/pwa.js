import { registerSW } from "virtual:pwa-register"

const intervalMS = 60 * 60 * 1000

let _hasPWAUpdate = false

export const hasPWAUpdate = () => _hasPWAUpdate

const updateSW = registerSW({
  onNeedRefresh() {
    _hasPWAUpdate = true
  },
  onRegisteredSW(swUrl, r) {
    r &&
      setInterval(async () => {
        if (r.installing || !navigator) {
          return
        }

        if ("connection" in navigator && !navigator.onLine) {
          return
        }

        const resp = await fetch(swUrl, {
          cache: "no-store",
          headers: {
            cache: "no-store",
            "cache-control": "no-cache",
          },
        })

        if (resp?.status === 200) {
          await r.update()
        }
      }, intervalMS)
  },
})

export default updateSW

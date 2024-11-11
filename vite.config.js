import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
// import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
    // visualizer({
    //   gzipSize: true,
    // }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
  },
  build: {
    outDir: "build",
    rollupOptions: {
      output: {
        manualChunks: {
          "arco-vendor": ["@arco-design/web-react"],
          "highlight-vendor": ["highlight.js"],
          "react-vendor": ["react", "react-dom"],
        },
      },
    },
  },
})

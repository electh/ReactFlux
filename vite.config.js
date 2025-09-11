import path from "node:path"
import { fileURLToPath } from "node:url"

import viteReact from "@vitejs/plugin-react"
// import {visualizer} from "rollup-plugin-visualizer"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const { dirname, resolve } = path
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ReactCompilerConfig = { target: "18" }

export default defineConfig({
  plugins: [
    viteReact({
      babel: {
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      workbox: {
        skipWaiting: true,
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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          arco: ["@arco-design/web-react"],
          highlight: ["highlight.js"],
          react: ["react", "react-dom", "react-router"],
        },
      },
    },
  },
})

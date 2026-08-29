import path from "node:path"
import { fileURLToPath } from "node:url"

import babel from "@rolldown/plugin-babel"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const { dirname, resolve } = path
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
      },
      workbox: {
        skipWaiting: true,
      },
    }),
    mode === "analyze" &&
      visualizer({
        brotliSize: true,
        filename: "stats.html",
        gzipSize: true,
      }),
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
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react",
              test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
            },
            {
              entriesAware: true,
              maxSize: 800 * 1024,
              name: "arco",
              tags: ["$initial"],
              test: /[\\/]node_modules[\\/]@arco-design[\\/]web-react[\\/]/,
            },
          ],
        },
      },
    },
  },
}))

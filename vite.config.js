import path from "node:path"
import { fileURLToPath } from "node:url"

import babel from "@rolldown/plugin-babel"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
// import {visualizer} from "rollup-plugin-visualizer"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const { dirname, resolve } = path
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
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
        codeSplitting: {
          groups: [
            {
              name: "arco",
              test: /[\\/]node_modules[\\/](@arco-design\/web-react)[\\/]/,
            },
            {
              name: "highlight",
              test: /[\\/]node_modules[\\/](highlight\.js)[\\/]/,
            },
            {
              name: "react",
              test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
            },
          ],
        },
      },
    },
  },
})

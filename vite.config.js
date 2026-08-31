import path from "node:path"
import { fileURLToPath } from "node:url"

import babel from "@rolldown/plugin-babel"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig, loadEnv } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const { dirname, resolve } = path
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const BASE_PATH_PATTERN = /^\/(?:[A-Za-z0-9._~-]+\/)*$/

const getBasePath = (value) => {
  const basePath = value?.trim() || "/"
  const segments = basePath.split("/").filter(Boolean)

  if (
    !BASE_PATH_PATTERN.test(basePath) ||
    segments.some((segment) => segment === "." || segment === "..")
  ) {
    throw new Error(
      'VITE_BASE_PATH must be "/" or an absolute path that starts and ends with "/" (for example, "/reactflux/"). Path segments may contain only letters, numbers, ".", "_", "~", and "-".',
    )
  }

  return basePath
}

export default defineConfig(({ mode }) => ({
  base: getBasePath(loadEnv(mode, __dirname).VITE_BASE_PATH),
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
      manifest: {
        name: "ReactFlux",
        short_name: "ReactFlux",
        description: "A Simple but Powerful RSS Reader for Miniflux",
        icons: [
          {
            src: "favicon.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon",
          },
          {
            src: "logo192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "logo512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        theme_color: "#1F2327",
        background_color: "#ffffff",
        display: "fullscreen",
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: [
          "**/*.html",
          "styles/*.css",
          "assets/index-*.{js,css}",
          "assets/react-*.js",
          "assets/rolldown-runtime-*.js",
          "assets/warning-*.js",
          "assets/workbox-window*.js",
        ],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.*\.(?:css|js)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "runtime-build-assets",
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 30,
                maxEntries: 80,
              },
            },
          },
          {
            urlPattern: /\/fonts\/.*\.woff2$/,
            handler: "CacheFirst",
            options: {
              cacheName: "runtime-fonts",
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365,
                maxEntries: 40,
              },
            },
          },
        ],
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
          ],
        },
      },
    },
  },
}))

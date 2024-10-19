import react from "@vitejs/plugin-react";
// import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ registerType: "autoUpdate" }),
    // visualizer({
    //   gzipSize: true,
    // }),
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  build: {
    outDir: "build",
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "arco-vendor": ["@arco-design/web-react"],
        },
      },
    },
  },
});

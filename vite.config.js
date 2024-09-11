import react from "@vitejs/plugin-react";
// import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ registerType: "autoUpdate" }),
    // visualizer(),
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  build: {
    outDir: "build",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});

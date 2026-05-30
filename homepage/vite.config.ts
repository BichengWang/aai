import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("/node_modules/docx-preview/") ||
            id.includes("/node_modules/jszip/") ||
            id.includes("/node_modules/tiny-inflate/")
          ) {
            return "docx-vendor";
          }
        },
      },
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { enquiryPlugin } from "./server/viteEnquiryPlugin.mjs";

export default defineConfig({
  base: "/",
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  plugins: [react(), enquiryPlugin()],
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
          if (id.includes("/node_modules/@supabase/")) {
            return "supabase-vendor";
          }
        },
      },
    },
  },
});

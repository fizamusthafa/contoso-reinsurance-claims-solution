import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Power Apps code apps are served from a relative base.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: "dist",
  },
});

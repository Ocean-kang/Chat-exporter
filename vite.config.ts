import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, "src/popup"),
  base: "./",
  build: {
    outDir: resolve(__dirname, "dist/popup"),
    emptyOutDir: true,
  },
});

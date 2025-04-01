/// <reference types="vitest/config" />

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/index.ts",
      name: "Permask",
      formats: ["cjs", "es", "umd"]
    },
    rollupOptions: {
      external: []
    },
    sourcemap: true,
    minify: true
  },
  plugins: [
    dts({
      insertTypesEntry: true
    })
  ]
});

/// <reference types="vitest/config" />

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/index.ts",
      name: "Permask"
    },
    rollupOptions: {
      external: []
    },
    sourcemap: true,
    minify: true
  },
  plugins: [
    dts({
      insertTypesEntry: true // Генерація типів
    })
  ],
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      include: ["src/**/*.ts"],
      reportOnFailure: true
    }
  }
});

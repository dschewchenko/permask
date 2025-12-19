/// <reference types="vitest/config" />

import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

function getIntegrationEntries() {
  const integrationsRoot = resolve("src/integrations");
  const entries: Record<string, string> = {};

  const dirs = readdirSync(integrationsRoot, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort((a, b) => a.localeCompare(b));

  for (const dirName of dirs) {
    const entryPath = join(integrationsRoot, dirName, "index.ts");
    if (existsSync(entryPath)) {
      entries[dirName] = entryPath;
    }
  }

  return entries;
}

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: "./src/index.ts",
        ...getIntegrationEntries()
      },
      formats: ["es"],
      fileName: (_format, entryName) => (entryName === "index" ? "index.js" : `integrations/${entryName}/index.js`)
    },
    rollupOptions: {
      external: [],
      output: {
        chunkFileNames: "chunks/[name]-[hash].js"
      }
    },
    sourcemap: true,
    minify: true
  },
  plugins: [
    dts({
      insertTypesEntry: false
    })
  ]
});

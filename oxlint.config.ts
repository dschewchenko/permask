import nkzw from "@nkzw/oxlint-config";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [nkzw],
  env: { browser: false, builtin: false, es2024: false, node: false },
  ignorePatterns: ["node_modules/**", "dist/**", "coverage/**", "playground/vue/dist/**"],
  overrides: [
    {
      files: ["playground/vue/**/*.vue"],
      env: { vue: true },
      globals: {
        alert: "readonly",
        Blob: "readonly",
        console: "readonly",
        document: "readonly",
        FileReader: "readonly",
        navigator: "readonly",
        URL: "readonly",
        setTimeout: "readonly"
      }
    }
  ],
  plugins: ["typescript", "import", "jsx-a11y", "oxc", "promise", "react", "unicorn", "vitest", "vue"]
});

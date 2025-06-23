// @ts-nocheck
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    extends: compat.extends("eslint:recommended", "prettier"),
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.browser,
        sap: true,
        QUnit: true,
        $: true,
        jQuery: true,
      },
      ecmaVersion: 2017,
      sourceType: "commonjs",
    },
    rules: {
      "no-console": "off",
      "require-atomic-updates": "off",
      "no-var": "error",
      "prefer-const": "error",
    },
  },
  globalIgnores(["eslint*"]),
]);

// @ts-nocheck
/* eslint-disable */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Initializes a Node.js project and installs development dependencies for
 * TypeScript, ESLint, Prettier, Husky, Commitlint, and SAP UI5 typings.
 */
const installDependencies = () => {
  run(
    "npm install --save-dev typescript eslint prettier husky " +
      "@commitlint/{cli,config-conventional} " +
      "@eslint/js @prettier/plugin-xml " +
      "@sapui5/types @sapui5/ts-types @types/jquery @types/qunit " +
      "eslint-config-prettier globals",
  );
};

/**
 * Creates a `tsconfig.json` file with TypeScript compiler options
 * tailored for SAP UI5 development and type-checking support.
 */
const setupTypeScript = () => {
  const tsconfig = {
    compilerOptions: {
      module: "none",
      noEmit: true,
      checkJs: true,
      allowJs: true,
      skipLibCheck: true,
      types: [
        "@sapui5/ts-types",
        "@sapui5/types",
        "@types/jquery",
        "@types/qunit",
      ],
      lib: ["es2015", "es2016", "dom"],
    },
  };
  fs.writeFileSync("tsconfig.json", JSON.stringify(tsconfig, null, 2));
};

/**
 * Sets up ESLint with flat config, includes globals for Node, Jest, and browser,
 * and disables rules not relevant for typical development.
 */
const setupESLint = () => {
  const content = `
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
`;
  fs.writeFileSync("eslint.config.mjs", content.trimStart());
};

/**
 * Creates `.prettierrc` and `.prettierignore` files with default formatting
 * rules and plugin support for XML formatting.
 */
const setupPrettier = () => {
  const config = {
    plugins: ["@prettier/plugin-xml"],
    singleAttributePerLine: false,
    bracketSameLine: true,
    xmlSelfClosingSpace: false,
    xmlWhitespaceSensitivity: "preserve",
  };
  fs.writeFileSync(".prettierrc", JSON.stringify(config, null, 2));
  fs.writeFileSync(".prettierignore", `xs*.json\npackage*.json\n*.md`);
};

/**
 * Installs Husky and creates a `commit-msg` hook that runs Commitlint
 * to enforce commit message conventions.
 */
const setupHusky = () => {
  run("npx husky install");
  run('echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg');
};

/**
 * Creates `commitlint.config.js` with a custom rule requiring a scope
 * for "feat" and "fix" commit types, extending the conventional config.
 */
const setupCommitLint = () => {
  const content = `
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [2, "always", []],
    "scope-required-for-feat-fix": [2, "always"],
  },
  plugins: [
    {
      rules: {
        "scope-required-for-feat-fix": (parsed) => {
          const { type, scope } = parsed;
          if (["feat", "fix"].includes(type) && !scope) {
            return [
              false,
              \`scope is required for commit type "\${type}" (e.g., "\${type}(scope): subject")\`,
            ];
          }
          return [true];
        },
      },
    },
  ],
};
`;
  fs.writeFileSync("commitlint.config.js", content.trimStart());
};

/**
 * Adds useful scripts to `package.json` for linting, formatting,
 * type-checking, and Husky preparation.
 */
const addNpmScripts = () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  pkg.scripts = {
    ...pkg.scripts,
    prepare: "husky",
    lint: "eslint .",
    "lint:fix": "eslint --fix .",
    format: "prettier --check .",
    "format:fix": "prettier --write .",
    "ts-typecheck": "tsc --noEmit",
    "build:mta": "rimraf resources mta_archives && mbt build",
  };
  fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
};

/**
 * Removes files (and folders, optionally) that were created by the setup script if they exist.
 */
const cleanupGeneratedFiles = () => {
  const filesToRemove = [
    "tsconfig.json",
    "eslint.config.mjs",
    ".prettierrc",
    ".prettierignore",
    "commitlint.config.js",
  ];

  const huskyHook = ".husky/commit-msg";

  filesToRemove.forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`🗑️ Removed: ${file}`);
    }
  });

  if (fs.existsSync(huskyHook)) {
    fs.unlinkSync(huskyHook);
    console.log(`🗑️ Removed: ${huskyHook}`);
  }

  const huskyDir = ".husky";
  if (fs.existsSync(huskyDir) && fs.readdirSync(huskyDir).length === 0) {
    fs.rmdirSync(huskyDir);
    console.log(`🗑️ Removed empty folder: ${huskyDir}`);
  }

  const githubDir = ".github";
  if (fs.existsSync(githubDir)) {
    fs.rmSync(githubDir, { recursive: true, force: true });
    console.log(`🗑️ Deleted: ${githubDir}`);
  }
};

/**
 * Create Github Workflow directory and files
 */
const writeGHWorkflows = () => {
  const dir = path.join(".github", "workflows");
  fs.mkdirSync(dir, { recursive: true });

  workflowFiles.forEach(({ name, content }) => {
    const filePath = path.join(dir, name);
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✔ GitHub Actions workflow created at ${filePath}`);
  });
};

function replaceGitignore(repoPath, newContents) {
  fs.writeFileSync(
    ".gitignore",
    `node_modules/
dist/
.scp/
.env
Makefile*.mta
mta_archives
mta-*
resources
archive.zip
.*_mta_build_tmp            
            `,
    "utf8",
  );
}

/**
 * Wraps a function with logging before and after its execution.
 * @param {Function} taskFn - The function to execute with logging.
 */
const withLog = (taskFn) => {
  console.log(`\n▶ Starting: ${taskFn.name}`);
  taskFn();
  console.log(`✔ Done: ${taskFn.name}`);
};

/**
 * Run prettier:fix
 */
const prettierFix = () => {
  run("npm run format:fix");
};

// Ordered list of setup steps
const steps = [
  cleanupGeneratedFiles,
  installDependencies,
  setupTypeScript,
  setupESLint,
  setupPrettier,
  setupHusky,
  setupCommitLint,
  addNpmScripts,
  writeGHWorkflows,
  prettierFix,
  replaceGitignore,
];
const BUILD_CHECK_ACTION = {
  name: "build-check.yml",
  content: `
name: Build Check

on:
  workflow_call: {}

jobs:
  prettier:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Build MTAR
        run: npm run build:mta
  `,
};
const ATTACH_MTAR_ACTION = {
  name: "attach-mtar-to-release.yml",
  content: `
name: Attach MTAR to latest release
on:
  release:
    types: [published]

jobs:
  build-and-upload:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build:mta

      - name: Prepare mtar
        run: |
          ID=$(grep -E '^ID:' mta.yaml | sed 's/^ID:[[:space:]]*//')
          VERSION=$(grep -E '^version:' mta.yaml | sed 's/^version:[[:space:]]*//')
          FILENAME="\${ID}_\${VERSION}.mtar"
          ORIGINAL=$(find mta_archives -name "*.mtar" | head -n 1)

          echo "FILENAME=$FILENAME" >> $GITHUB_ENV

      - name: Upload asset to release
        uses: softprops/action-gh-release@v2
        with:
          files: mta_archives/\${{ env.FILENAME }}
          tag_name: \${{github.event.release.tag_name}}
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}  
  `,
};
const FORMAT_CHECK_ACITON = {
  name: "format-check.yml",
  content: `
name: Format Check

on:
  workflow_call: {}

jobs:
  prettier:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run Prettier
        run: npm run format
  `,
};
const LINT_ACTION = {
  name: "lint.yml",
  content: `
name: Lint

on:
  workflow_call: {}

jobs:
  prettier:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run Eslint
        run: npm run lint
  `,
};
// TODO: Later on add eslint and typecheck actions. Once there, uncomment lines in worfklowFiles
const PR_ACTION = {
  name: "pr.yml",
  content: `
name: PR

on:
  pull_request:
    branches: [development]

jobs:
  typecheck:
    uses: ./.github/workflows/format-check.yml

  build-check:
    uses: ./.github/workflows/build-check.yml
  `,
};

const RELEASE_PLEASE_ACTION = {
  name: `release-please.yml`,
  content: `
name: Release PR

on:
  push:
    branches:
      - main

jobs:
  release-please:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    steps:
      - uses: googleapis/release-please-action@v4
        with:
          release-type: simple
          token: \${{ secrets.RELEASE_PLEASE_TOKEN }}
          target-branch: main
          default-branch: main
`,
};
const TYPECHECK_ACTION = {
  name: "typecheck.yml",
  content: `
name: Lint

on:
  workflow_call: {}

jobs:
  prettier:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run TS typecheck
        run: npm run ts-typecheck
`,
};
// List of GH workflow files
const workflowFiles = [
  BUILD_CHECK_ACTION,
  ATTACH_MTAR_ACTION,
  FORMAT_CHECK_ACITON,
  LINT_ACTION,
  PR_ACTION,
  RELEASE_PLEASE_ACTION,
  TYPECHECK_ACTION,
];

/**
 * Executes a shell command and prints it to the console.
 * @param {string} cmd - The shell command to execute.
 */
const run = (cmd) => {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

// Execute all setup steps with logging
(() => {
  steps.forEach(withLog);
  console.log("\n✅ Setup complete!");
})();

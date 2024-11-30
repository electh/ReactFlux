import globals from "globals"
import js from "@eslint/js"
import importPlugin from "eslint-plugin-import"
import promise from "eslint-plugin-promise"
import react from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"

export default [
  {
    ignores: [
      "build",
      "dev-dist",
      "src/components/ui/*.tsx",
      "src/hooks/use-mobile.tsx",
      "src/lib/utils.ts",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        projectService: true,
      },
    },
    plugins: {
      import: importPlugin,
      promise,
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Base ESLint rules
      ...js.configs.recommended.rules,
      "no-unused-vars": "off",

      // Import rules
      "import/extensions": [
        "error",
        "never",
        {
          css: "always",
          json: "always",
          js: "never",
          jsx: "never",
          ts: "never",
          tsx: "never",
        },
      ],
      "import/no-anonymous-default-export": "error",
      "import/no-cycle": "error",
      "import/no-duplicates": "error",
      "import/no-relative-parent-imports": "error",
      "import/no-self-import": "error",
      "import/no-useless-path-segments": ["error", { noUselessIndex: true }],
      "import/order": [
        "error",
        {
          alphabetize: {
            caseInsensitive: true,
            order: "asc",
          },
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
          "newlines-between": "always",
        },
      ],
      "import/prefer-default-export": "warn",

      // Promise rules
      "promise/always-return": "error",
      "promise/catch-or-return": "error",
      "promise/no-nesting": "error",
      "promise/no-return-wrap": "error",
      "promise/param-names": "error",

      // React rules
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/jsx-no-target-blank": "off",
      "react/jsx-sort-props": [
        "error",
        {
          callbacksLast: true,
          reservedFirst: true,
          shorthandFirst: true,
          multiline: "last",
        },
      ],
      "react/no-unused-state": "warn",
      "react/prop-types": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
    settings: {
      react: { version: "detect" },
    },
  },
  {
    files: ["src/utils/**/*.ts"],
    rules: {
      "import/prefer-default-export": "off",
    },
  },
]

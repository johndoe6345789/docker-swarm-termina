import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // CommonJS config files:
    "jest.config.js",
    "jest.setup.js",
    "show-interactive-direct.js",
    // E2E mock backend (Node.js CommonJS server):
    "e2e/mock-backend.js",
    // Test artifacts:
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "playwright/.cache/**",
  ]),
  // Relaxed rules for test files
  {
    files: ["**/__tests__/**/*", "**/*.test.*", "**/*.spec.*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);

export default eslintConfig;

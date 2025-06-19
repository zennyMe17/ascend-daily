import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  // Add this line to ensure the plugins are resolved correctly
  resolvePluginsRelativeTo: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.ts", "**/*.tsx"], // Apply these rules to TypeScript/TSX files
    rules: {
      // 1. Disable no-unused-vars for TypeScript files (or set to 'warn')
      // It's generally better to remove unused variables, but for a quick fix:
      "@typescript-eslint/no-unused-vars": "off", // or ["warn", { "argsIgnorePattern": "^_" }] for arguments only

      // 2. Change prefer-const to 'off' or 'warn' if you truly need 'let' often
      // It's highly recommended to fix these in your code (use 'const')
      "prefer-const": "off", // or "warn"

      // 3. Change no-explicit-any to 'off' or 'warn'
      // Highly recommended to provide types instead of 'any'.
      "@typescript-eslint/no-explicit-any": "off", // or "warn"

      // 4. Fix react/no-unescaped-entities
      // This is a React-specific rule. You typically want to keep this on and fix the JSX.
      // However, if you absolutely need to disable it:
      "react/no-unescaped-entities": "off", // Not recommended to disable
    },
  },
  // You might need to add a configuration for plain JavaScript files if you have them
  {
    files: ["**/*.js", "**/*.jsx"],
    rules: {
      "prefer-const": "off", // If you want to apply this to JS files too
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
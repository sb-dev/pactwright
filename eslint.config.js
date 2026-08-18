import js from "@eslint/js";
import tseslint from "typescript-eslint";

// Minimal flat config: lint the runtime source and its tests with the
// recommended (non-type-checked) rule sets. Data/spec files are not JS/TS and
// are excluded; build output and test scratch dirs are ignored.
export default tseslint.config(
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      "coverage/",
      "specs/",
      ".pnpm-store/",
      ".tmp-pactwright-test-*/",
      "tests/fixtures/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module" },
  },
);

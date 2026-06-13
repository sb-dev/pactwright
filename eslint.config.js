import js from "@eslint/js";
import tseslint from "typescript-eslint";

// Minimal flat config: lint the TypeScript toolchain and its tests with the
// recommended (non-type-checked) rule sets. Data/spec files are not JS/TS and
// are excluded; generated reports and test scratch dirs are ignored.
export default tseslint.config(
  { ignores: ["node_modules/", "specs/", ".tmp-spec-test-*/", "dist/", "build/", "coverage/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["tools/**/*.ts", "tests/**/*.ts"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module" },
  },
);

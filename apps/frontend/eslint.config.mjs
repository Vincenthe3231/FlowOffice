import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const nextConfig = compat.extends("eslint-config-next/core-web-vitals", "eslint-config-next/typescript");

const eslintConfig = defineConfig([
  ...nextConfig,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "RenoXpert-Client/**",
    "node_modules/**",
  ]),
]);

export default eslintConfig;

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Colours come from design tokens in app/tokens.css, never from literals.
const rawColour = "/#[0-9a-fA-F]{3,8}\\b|-\\[(#|rgb|hsl|oklch|color)/";
// Model ids live in lib/ai/models.ts only.
const modelId = "/^claude-/";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=${rawColour}]`,
          message: "Use a design token from app/tokens.css instead of a raw colour.",
        },
        {
          selector: `TemplateElement[value.raw=${rawColour}]`,
          message: "Use a design token from app/tokens.css instead of a raw colour.",
        },
        {
          selector: `Literal[value=${modelId}]`,
          message: "Model ids are configured in lib/ai/models.ts only.",
        },
      ],
    },
  },
  {
    // Model config, colour maths that works on user-chosen accent hex values,
    // and vibe palettes, which are to portfolios what app/tokens.css is to the app.
    files: ["lib/ai/models.ts", "lib/color/**", "lib/render/vibes/**"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    // Tests feed hex values to validators as data, not styling. Model ids stay banned.
    files: ["**/*.test.{ts,tsx}", "tests/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=${modelId}]`,
          message: "Model ids are configured in lib/ai/models.ts only.",
        },
      ],
    },
  },
  {
    files: ["components/site/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/ui", "@/components/ui/*", "**/components/ui/*"],
              message: "Portfolio components never import from components/ui.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "lib/db/types.ts", "playwright-report/**", "test-results/**"]),
]);

export default eslintConfig;

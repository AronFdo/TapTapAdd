import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**"],
    setupFiles: ["./tests/setup.ts"],
    // Tests never reach real services: AI answers come from recordings.
    env: {
      AI_MODE: "replay",
      ANTHROPIC_API_KEY: "test-key",
      SUPABASE_SERVICE_ROLE_KEY: "test-key",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-key",
      NEXT_PUBLIC_ROOT_DOMAIN: "localhost:3000",
    },
  },
});

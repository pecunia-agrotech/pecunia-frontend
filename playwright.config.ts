import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.PECUNIA_TEST_BASE_URL ?? "http://127.0.0.1:3000",
    viewport: { width: 1536, height: 1050 },
    trace: "retain-on-failure",
  },
  reporter: "list",
});

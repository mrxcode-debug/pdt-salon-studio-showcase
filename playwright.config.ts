import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "mobile-390",
      use: { viewport: { width: 390, height: 844 } }
    },
    {
      name: "desktop-1440",
      use: { viewport: { width: 1440, height: 900 } }
    }
  ],
  webServer: {
    command: "pnpm exec next start -p 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 60_000
  }
});
import { defineConfig } from "@playwright/test";

// Uji gabungan: backend dinyalakan dan dimatikan dari dalam uji (lihat e2e-backend/server.ts).
export default defineConfig({
  testDir: "e2e-backend",
  outputDir: "e2e/results/rekaman-backend",
  timeout: 90_000,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:8090",
    channel: "msedge",
    viewport: { width: 1366, height: 768 },
    video: "retain-on-failure",
  },
});

import { defineConfig } from '@playwright/test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  outputDir: join(tmpdir(), 'vue3-selectkit-e2e'),
  reporter: 'list',
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'http://127.0.0.1:5173/vue3-selectkit/',
    viewport: { width: 1495, height: 1052 },
    colorScheme: 'light',
    trace: 'retain-on-failure',
  },
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://127.0.0.1:5173/vue3-selectkit/',
        reuseExistingServer: !process.env.CI,
      },
})

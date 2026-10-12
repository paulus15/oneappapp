import { defineConfig, devices } from '@playwright/test'

// End-to-end tests run the real Laravel API (isolated database) and a production build of the
// Quasar app, in the locally installed Chrome. See test/e2e/README in docs/PWASTORE_TEST_PLAN.md.
export default defineConfig({
  testDir: 'test/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:9124',
    channel: 'chrome',
    locale: 'fr-FR',
    reducedMotion: 'reduce',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }
  ],
  webServer: [
    {
      command: 'sh test/e2e/backend.sh',
      url: 'http://127.0.0.1:8011/api/categories',
      timeout: 120_000,
      reuseExistingServer: false
    },
    {
      command:
        'VITE_API_URL=http://127.0.0.1:8011/api npx quasar build -m spa >/dev/null && node test/e2e/serve.mjs dist/spa 9124',
      url: 'http://127.0.0.1:9124',
      timeout: 240_000,
      reuseExistingServer: false
    }
  ]
})

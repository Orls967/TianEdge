import { defineConfig, devices } from '@playwright/test';

/**
 * Captures the README screenshot gallery into `docs/screenshots/`.
 *
 *   # Live GitHub Pages
 *   SHOTS_BASE_URL=https://orls967.github.io/TianEdge/ npm run screenshots
 *   # Local production build (npm run build && npm run preview)
 *   SHOTS_BASE_URL=http://127.0.0.1:4173/ npm run screenshots
 */
export default defineConfig({
  testDir: './screenshots',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120000,
  reporter: [['list']],
  use: {
    baseURL: process.env.SHOTS_BASE_URL || 'https://orls967.github.io/TianEdge/',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'],
        },
      },
    },
  ],
});

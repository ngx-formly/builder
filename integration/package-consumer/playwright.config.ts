import { defineConfig } from '@playwright/test';

const consumerRoot = process.env['FORMLY_CONSUMER_ROOT'];
if (!consumerRoot) {
  throw new Error('Run through npm run check:packages:e2e to test the packed libraries.');
}

export default defineConfig({
  testDir: '.',
  testMatch: 'consumer.spec.ts',
  outputDir: '../../tmp/package-consumer-results',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4314',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm start',
    cwd: consumerRoot,
    url: 'http://127.0.0.1:4314',
    reuseExistingServer: false,
    timeout: 180000,
  },
});

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    expect: { timeout: 10_000 },
    fullyParallel: false,
    workers: 1,
    reporter: [['line'], ['html', { open: 'never' }]],
    use: {
        baseURL: 'http://127.0.0.1:3100',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'desktop-chromium',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
        },
        {
            name: 'mobile-chromium',
            use: { ...devices['Pixel 7'] },
        },
    ],
    webServer: {
        command: 'node e2e/server.cjs',
        url: 'http://127.0.0.1:3100/api/health',
        timeout: 30_000,
        reuseExistingServer: false,
    },
});

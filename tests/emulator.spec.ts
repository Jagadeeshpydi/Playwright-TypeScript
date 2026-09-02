import { test, devices } from '@playwright/test';

test('iPad Emulation', async ({ browser }) => {

    const context = await browser.newContext({
        ...devices['iPad Pro 11']
    });

    const page = await context.newPage();

    await page.goto('https://phziot-dce2e.phz.io/login');

    await page.waitForTimeout(100000);
});

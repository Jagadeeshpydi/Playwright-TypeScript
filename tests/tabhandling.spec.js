import { test, expect } from '@playwright/test';

test('new window handling', async ({ browser }) => {

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://phziot-dce2e.phz.io/login');

    const [newTab] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('button', { hasText: 'New Window' }).click(),
    ]);

    console.log(await newTab.title());

    await expect(newTab).toHaveTitle(/Playwright/);
    await expect(newTab).toHaveURL(/playwright.dev/);

    await context.close();
});

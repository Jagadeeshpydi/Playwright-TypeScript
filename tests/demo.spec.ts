import { test, expect } from '@playwright/test';

test('verify demo', async ({ page }) => {
    await page.goto('https://phziot-dce2e.phz.io/login');

    await page.getByPlaceholder('User Name').fill('phz-dc-admin');
    await page.getByPlaceholder('Password').fill('Welcome_123!');

    await page.getByRole('button', { name: 'login' }).click();

    const message = page.locator('.ant-message');

    await expect(message).toContainText('Welcome');
});

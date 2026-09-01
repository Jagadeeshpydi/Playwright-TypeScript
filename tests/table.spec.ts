import { test, expect } from '@playwright/test';

test('verify the table product names', async ({ page }) => {

    await page.goto("https://phziot-dce2e.phz.io/login");

    await page.getByPlaceholder('User Name').fill("dc-superadmin");
    await page.getByPlaceholder('Password').fill("Welcome_123!");

    // Example locator for product names
    const products = page.locator('.product-name');

    const count = await products.count();

    for (let i = 0; i < count; i++) {
        const value = await products.nth(i).innerText();
        console.log(value);
    }
});
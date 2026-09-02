import { test, expect } from '@playwright/test';

test('verify the mouse action', async ({ page }) => {

    await page.goto('https://phziot-dce2e.phz.io/login');

    await page.getByPlaceholder('User Name').fill('phz-dc-admin');
    await page.getByPlaceholder('Password').fill('Welcome_123!');

    await page.getByRole('button', { name: 'login' }).click();

    await page.getByText('Audit Trail', { exact: true }).click();

    // Find the Event column
    const eventColumn = page.getByRole('columnheader', {
        name: /Event info-circle/
    });

    // Hover over Event's info icon
    await eventColumn
        .getByRole('img', { name: 'info-circle' })
        .hover();

    // Verify the tooltip/popover
    await expect(
        page.locator('.header-info-card')
    ).toHaveText(
        'The user that executed the audit event'
    );
});

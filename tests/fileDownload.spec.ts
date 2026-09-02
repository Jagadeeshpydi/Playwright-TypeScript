import { test, expect } from '@playwright/test';

test('verify the file is downloaded', async ({ page }) => {
    await page.goto('https://phziot-dce2e.phz.io/login');

    await page.getByPlaceholder('User Name').fill('phz-dc-admin');
    await page.getByPlaceholder('Password').fill('Welcome_123!');

    await page.getByRole('button', { name: 'login' }).click();

    await page.getByText('Audit Trail').click();

    // await page.locator('span', { hasText: 'Audit Trail' }).click();

    // Wait for the download while clicking Export CSV
   const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export CSV' }).click()
]);

    // Verify the file was downloaded
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);

    // Optional: verify the downloaded file exists
    // const filePath = await download.path();
    // expect(filePath).not.toBeNull();

    // console.log('Downloaded file:', download.suggestedFilename());

    
 const fileName = download.suggestedFilename();

await download.saveAs(`downloads/${fileName}`);

console.log('Downloaded file:', fileName);
console.log('Saved at:', `downloads/${fileName}`);

    await page.close();
});

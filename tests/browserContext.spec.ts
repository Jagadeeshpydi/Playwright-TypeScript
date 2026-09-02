import { test, chromium ,expect} from '@playwright/test';

test('two contexts and two pages', async () => {
  const browser = await chromium.launch();

  // Create two separate browser contexts
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  // Create one page in each context
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  await page1.goto('https://phziot-dce2e.phz.io/login');
  await page2.goto('https://phziot-dce2e.phz.io/login');

  console.log('Page 1:', await page1.title());
  console.log('Page 2:', await page2.title());

  await page1.getByPlaceholder('User Name').fill('phz-dc-admin');
  await page1.getByPlaceholder('Password').fill('Welcome_123!');
  await page1.getByRole('button', { name: 'login' }).click();

  await page2.getByPlaceholder('User Name').fill('dcsuper-admin');
  await page2.getByPlaceholder('Password').fill('Welcome_123!');
  await page2.getByRole('button', { name: 'login' }).click();

  const message = page1.locator('.ant-message');
  
  await expect(message).toContainText('Welcome');

  const message1 = page2.locator('.ant-message');
  
  await expect(message1).toContainText('User does not exist');

  console.log('the admin and the super admin users logged in sucessfully');

context1.setDefaultTimeout(30000);
context2.setDefaultTimeout(30000);
page1.setDefaultTimeout(30000);
page2.setDefaultTimeout(30000);



  await browser.close();
});



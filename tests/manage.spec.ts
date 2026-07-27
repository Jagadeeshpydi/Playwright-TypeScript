
import {test,expect,Locator} from '@playwright/test';
test.only('Create a user' ,async({page})=>{

  await page.goto('https://122.175.46.149:3009/cGh6aW90/login');
  await expect(page).toHaveTitle("Connected Plant");
    console.log(await page.title());

  await page.getByPlaceholder('User Name').fill('phziot-admin');
  await page.getByPlaceholder('Password').fill('Welcome_123!');
  await page.getByRole('button', {name:'login'}).click();
 // await page.getByRole('button', {name:'Select Module'}).click();
 await page
  .locator('.category-card-variant-two')
  .filter({ hasText: 'Connector Plus' })
  .getByRole('button', { name: 'Select Module' })
  .click();
await expect(page.locator('span.header-title')).toHaveText('APC');
await expect(page).toHaveURL('https://122.175.46.149:3009/apc/dashboard');
await page.getByText('Manage').click();
await page.getByRole('button',{ name:'Add User'}).click();
await page.getByLabel("Org Name").isVisible();


// Step 5: First Name 
  await page.getByLabel('First Name').fill('qa');

  // Step 6: Last Name 
  await page.getByLabel('Last Name').fill('op');

  // Step 7: Email Validation
  await page.getByLabel('Email ID').fill('qaop@test.com');

  // Step 8: Username Validation
  await page.getByPlaceholder('Enter User Name').fill('qa-op6');

  // Step 9: Role Validation
 
// Step 9: Role Validation

// Wait until Add User drawer is visible
const role = page.locator('.ant-drawer');
await expect(role).toBeVisible();

// Click the Role dropdown inside the drawer
await role.locator('.ant-select-selector').nth(0).click();

// Select the Tester role
////div[@class='ant-select-item-option-content'and text()='Dc-admin' ]
await page.getByText('Dc-admin', { exact: true }).click();



 // Step 10: Site Validation

const site = page
  .locator('#form_item_site')
  .locator('xpath=ancestor::div[contains(@class,"ant-select")]');

// Open the dropdown
await site.locator('.ant-select-selector').click();

// Select the site
await page.locator("//span[text()='site 4']").click();

//Select the Generate password button
//span[text()='Generate Password']
await page.locator("//span[text()='Generate Password']").click();
await page.getByRole('button', { name: 'copy' })
  // Step 11: Verify Submit Button Disabled
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();

});
/*DOM- It is a api interface provided by the browser only at the run time
These are the recommended built-in locators.

page.getByRole() to locate by explicit and implicit accessibility attributes.
page.getByText() to locate by text content.
page.getByLabel() to locate a form control by associated label's text.
page.getByPlaceholder() to locate an input by placeholder.
page.getByAltText() to locate an element, usually image, by its text alternative.
page.getByTitle() to locate an element by its title attribute.
page.getByTestId() to locate an element based on its data-testid attribute

(other attributes can be configured).*/

import  { test, expect, Locator } from '@playwright/test';


test('verify login page' ,async({page})=>{

    await page.goto('https://122.175.46.149:3009/cGh6aW90/login');
    await expect(page).toHaveTitle("Connected Plant");
    console.log(await page.title());

    //locator is afixture  
    //to specify the type of variable we need to use locator(L is alway caps)

    const logo:Locator =page.getByAltText('Phizzle');
    await expect(logo).toBeVisible();

  //const text:Locator=page.getByText('User Name');
  //await expect(text).toBeVisible();
   //same above commneted line used for below in one line
  await expect(page.getByText('User Name')).toBeVisible(); //here we also sub string eg:User or name
  //await expect(page.getByText('Password')).toBeVisible(); it is not worked becuase there is strict voilation rule beacuse here we having password and forgo password it may gives confusion
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByText('Forgot Password?')).toBeVisible();
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('heading',{name: '© 2026 Phizzle Connected Plant 2.6'})).toBeVisible();
})

/*
/.../ → Regular expression 
\s+ → One or more whitespace characters
\? → Escapes the ? character so it matches a literal question mark
i → Case-insensitive (forgot password?, FORGOT PASSWORD?, etc.) */

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


// Step 5: First Name Validation
  await page.getByLabel('First Name').fill('John');
  await page.getByLabel('First Name').clear();
  await expect(page.getByText('First Name is required')).toBeVisible();

  // Step 6: Last Name Validation
  await page.getByLabel('Last Name').fill('Smith');
  await page.getByLabel('Last Name').clear();
  await expect(page.getByText('Last Name is required')).toBeVisible();

  // Step 7: Email Validation
  await page.getByLabel('Email ID').fill('john@test.com');
  await page.getByLabel('Email ID').clear();
  await expect(page.getByText('Email ID is required')).toBeVisible();

  // Step 8: Username Validation
  await page.getByPlaceholder('Enter User Name').fill('johnsmith');
  await page.getByPlaceholder('Enter User Name').clear();
  await expect(page.getByText('User Name is required')).toBeVisible();

  // Step 9: Role Validation
 
// Step 9: Role Validation

// Wait until Add User drawer is visible
const role = page.locator('.ant-drawer');
await expect(role).toBeVisible();

// Click the Role dropdown inside the drawer
await role.locator('.ant-select-selector').nth(0).click();

// Select the Tester role
await page.getByText('Tester', { exact: true }).click();

// Hover over the selected Role to display the clear (X) icon
await role.locator('.ant-select').nth(0).hover();

// Click the clear (X) icon
await role.locator('.ant-select-clear').click();

// Verify Role validation message
await expect(page.getByText('Please select the Role!')).toBeVisible();

 // Step 10: Site Validation

const site = page
  .locator('#form_item_site')
  .locator('xpath=ancestor::div[contains(@class,"ant-select")]');

// Open the dropdown
await site.locator('.ant-select-selector').click();

// Select the site
await page.locator("//span[text()='site 4']").click();
// Hover over the dropdown (only if your application requires it)
await site.locator('.ant-select-selector').hover();
// Click the clear (X) icon
await site.locator('.ant-select-clear').click();

// Verify validation message
await expect(page.getByText('Please select the Site!')).toBeVisible();


  // Step 11: Verify Submit Button Disabled
  await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();

});
//if the tag name and role is same we can call it as implicitly define roles
// getByTestId():
// Locates elements using a test ID (e.g., data-testid).
// Configure custom attribute in playwright.config.ts (testIdAttribute).
// Stable locator—UI/text/style changes won't affect it.
// Fails only if the test ID is changed or removed.


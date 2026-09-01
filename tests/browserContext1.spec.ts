import { test, expect } from '@playwright/test';

test('login in with valid creds', async ({ page }) => {

    await page.goto('https://phziot-dce2e.phz.io/login');

    console.log(await page.title());


    console.log('performed on the page');
});


test('Create two pages in one context', async ({ context }) => {

    // context = BrowserContext
    // page1 and page2 = Pages

    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Page 1
    await page1.goto('https://phziot-dce2e.phz.io/login');



    console.log('performed on page 1');


    // Page 2
    await page2.goto('https://phziot-dce2e.phz.io/login');

    console.log('performed on page 2');
});

test('Create two browser and two context and one page',async({ browser })=>{

    const context1=await browser.newContext();
    const context2=await browser.newContext();


    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto('https://phziot-dce2e.phz.io/login');
    await page2.goto('https://phziot-dce2e.phz.io/login');

    console.log('new browser is created and two context is created , one page is created in the each context')


})
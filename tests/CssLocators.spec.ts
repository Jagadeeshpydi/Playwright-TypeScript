import {test,expect} from '@playwright/test';

test("verify login", async({page})=>{

    await page.goto('https://124.123.26.241:3003/merck/login');

    await expect(page).toHaveTitle('');
    await page.getByPlaceholder('#qf_9f3d037b-3cb1-0eb0-74d3-21dab177431f').fill('phz-op6');
    await page.getByPlaceholder('').fill('Cohesion_123!');

});



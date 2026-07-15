import {test,expect} from "@playwright/test"

/*syntax
test(title of the test,arrow function)
test(title,()=>{
//step1
//step2
//step3
}); */

//(page),browser fixture -it is acciable throught the page
            test("verify the page title", async ({ page }) => {
                await page.goto("https://122.175.46.149:3009/A=19uS/login");

                const title = await page.title();

                console.log("Page Title:", title);
            await expect(page).toHaveTitle("Connected Plant");
            }) 


          /*  test("Verify Page Title", async ({ page }) => {
    await page.goto("https://122.175.46.149:3009/A=19uS/login");

    await expect(page).toHaveTitle("Connected Plant"); */
//});
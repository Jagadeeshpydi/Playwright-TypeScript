import { test, expect } from '@playwright/test';

test('Verify file upload', async ({ page }) => {

    await page.goto('https://automationtesting.co.uk/fileupload.html');

    const fileInput = page.locator('#fileToUpload');

    await fileInput.setInputFiles(
        'C:/Users/jagadeesh/Downloads/Storage_Techniques.png'
    );

    await expect(fileInput).toHaveValue(/Storage_Techniques\.png/);

});

//uploaded file 

/*test.only('Verify multiple file upload', async ({ page }) => {
    await page.goto(
        'https://testautomationpractice.blogspot.com/p/playwrightpractice.html'
    );

    // Locate the file input
    const fileInput = page.locator('#multipleFilesInput');

    // Upload multiple files
    await fileInput.setInputFiles([
        'C:/Users/jagadeesh/Downloads/Storage_Techniques.png',
        'C:/Users/jagadeesh/Downloads/samplefile.pdf'
    ]);

    // Locate Upload Multiple Files button
    const uploadButton = page.getByRole('button', {
        name: 'Upload Multiple Files'
    });

    // Click upload button
   await uploadButton.click();

const uploadSuccess = page.locator('#multipleFilesStatus');

const uploadText = await uploadSuccess.innerText();

console.log('Upload Status:');
console.log(uploadText);

}); */

//uploaded file updated version

test('Verify multiple file upload', async ({ page }) => {

await page.goto(
'https://testautomationpractice.blogspot.com/p/playwrightpractice.html'
);
// Upload files
await page.locator('#multipleFilesInput').setInputFiles([
'C:/Users/jagadeesh/Downloads/Storage_Techniques.png',
'C:/Users/jagadeesh/Downloads/samplefile.pdf'
]);

// Click upload
await page.getByRole('button', { name: 'Upload Multiple Files' }).click();
// Print upload status
console.log(await page.locator('#multipleFilesStatus').innerText());
});

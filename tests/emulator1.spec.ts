import { test } from '@playwright/test';

test('iPad Emulation', async ({ browser }) => {

    const context = await browser.newContext({

        // Dark theme
        colorScheme: 'dark',

        // Browser permissions
        permissions: [
            'notifications',
            'geolocation',
            'microphone'
        ],

        // Language
        locale: 'en-IN',

        // Time zone
        timezoneId: 'Asia/Kolkata',

        // Viewport
        viewport: {
            width: 1280,
            height: 720
        }
    });

    const page = await context.newPage();

    await page.goto('https://phziot-dce2e.phz.io/login');

    await context.close();
});

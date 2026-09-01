/*import { test, expect } from '../../hooks/auth.fixture.js';
import { LoginPage } from '../../pages/loginpage.js';
import { HomePage } from '../../pages/homepage.js';
import { Header } from '../../pages/components/header.js';
import { WebTable } from '../../pages/components/table.js';
import { MenuBar } from '../../pages/components/menu.js';
import { formatToTimezone, verifyNotification } from '../../pages/components/utilities.js';
import Language from '../../fixtures/labels/titles.json';
import languageData from '../../fixtures/labels/languages.json';
import roleData from '../../fixtures/labels/roles.json';
import { db } from '../../fixtures/sql/queries.js';

test.describe('Login Page', () => {

    let orgConfig, envConfig, clientPath;
    const users = {};
    let context, page;

    test.beforeAll(async ({ browser }, testInfo) => {
        users[roleData.Admin] = testInfo.project.metadata.roles.Administrator;
        users[roleData.Operator] = testInfo.project.metadata.roles.Operator;
        users[roleData.Auditor] = testInfo.project.metadata.roles.Auditor;

        envConfig = testInfo.project.metadata.config;
        orgConfig = testInfo.project.metadata.config.org;
        clientPath = `/${process.env.CLIENT_URL_KEY}`;

        context = await browser.newContext();
        page = await context.newPage();
    });

    test.afterAll(async () => {
        await page.close();
        await context.close();
    });

    test.describe('DNS URL Validations', () => {
        test.beforeAll(() => {
            if (envConfig.dns === 'off') test.skip(true, 'DNS URL is not configured for the current environment');
        });

        test('DA_Login_001 : Verify Login Page Access Using a Valid Client-Specific DNS URL', async () => {
            const response = await new LoginPage(page).navigateToLogin({ url: orgConfig.dns });
            if (response) expect(response.status()).toBe(200);
            await expect(page).toHaveURL(`${orgConfig.dns}/login`);
        });

        test('DA_Login_003 : Verify Client Branding Loads Correctly Using Client-Specific DNS URL', async () => {
            await new LoginPage(page).navigateToLogin({ url: orgConfig.dns });
            await expect(page).toHaveURL(`${orgConfig.dns}/login`);
            await expect(page.locator('.logo img')).toBeVisible();
            await expect(page.locator('.logo img')).toHaveScreenshot(`${orgConfig.orgName}.png`, { maxDiffPixelRatio: 0.1 });
        });
    });

    test.describe('Static URL', () => {

        test.beforeAll(async () => {
            await new LoginPage(page).navigateToLogin({ url: clientPath });
            await expect(page.locator('.loginName')).toHaveText('Connected Plant');
            await expect(page).toHaveTitle('Connected Plant');
            await expect(page.locator('.footer-details')).toHaveText(orgConfig.copyright);
            await expect(page.locator('.logo img')).toBeVisible();
            await expect(page.locator('.logo img')).toHaveScreenshot(`${orgConfig.orgName}.png`, { maxDiffPixelRatio: 0.1 });
        });

        const userRoles = [
            { roleName: roleData.Admin, id: 'DA_Login_011' },
            { roleName: roleData.Operator, id: 'DA_Login_012' },
            { roleName: roleData.Auditor, id: 'DA_Login_013' }
        ];

        userRoles.forEach(role => {
            test(`DA_Login_006,DA_Login_007,DA_Audit_098,${role.id},DA_Login_035 : Verify English Language Selection on Login and Home Pages - ${role.roleName}`, async () => {
                const currentUser = users[role.roleName].username;
                const currentPass = users[role.roleName].password;

                await new LoginPage(page).handleLanguage({ defaultValue: languageData.English, options: languageData, select: languageData.English });
                await new LoginPage(page).verifyInterfaceTexts({ usernamePlaceholder: 'User Name', passwordPlaceholder: 'Password', forgotUserText: 'Forgot Password?', buttonText: 'Login' });

                await Promise.all([
                    page.waitForResponse((res) => res.url().includes('/token') && res.status() === 200),
                    new LoginPage(page).performLogin({ username: currentUser, password: currentPass }),
                ]);

                await verifyNotification(page, 'Welcome');
                await new HomePage(page).handleDeviceCards({ deviceTypes: Language.English.DeviceType, buttonText: Language.English.Select, select: Language.English.DeviceType.APC });

                await test.step(`DA_Audit_098 : Validate User Authentication Events on the Audit Page (${role.roleName})`, async () => {
                    await expect.poll(async () => {
                        const event = await db.auditEvent({ user: currentUser });
                        return event?.event_type;
                    }, { timeout: 10000 }).toBe('Logged In');

                    const loginEvent = await db.auditEvent({ user: currentUser });
                    const userSite = await db.userByName({ name: currentUser });
                    const timeStamp = formatToTimezone(loginEvent.operation_timestamp, userSite.site_timezone);

                    await page.locator('.menu-ul').getByRole('link', { name: Language.English.Menu.Administrator.Audit }).click();
                    await new WebTable(page).handleSelectByDropdown({ label: Language.English['Select By'], select: Language.English.AuditPage.SelectBy['User Name'] });
                    await new WebTable(page).fillInputValue({ label: Language.English.AuditPage.SelectBy['User Name'], value: currentUser });
                    await page.getByRole('button', { name: Language.English.Search, exact: true }).click();
                    await new WebTable(page).waitForSpinner();

                    const rowIndex = await new WebTable(page).findRowIndex({ [Language.English.AuditPage.Label['User Name']]: currentUser });
                    await new WebTable(page).interactWithCell({ label: Language.English.AuditPage.Label['Event'], value: 'Logged In', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.English.AuditPage.Label['Instrument Name'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.English.AuditPage.Label['User Name'], value: currentUser, row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.English.AuditPage.Label['Sample ID'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.English.AuditPage.Label['Continuous Sample ID'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.English.AuditPage.Label['Source'], value: 'IN-HOUSE', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.English.AuditPage.Label['Timestamp'], value: timeStamp, row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.English.AuditPage.Label['Event Details'], value: '', row: rowIndex });
                });

                await test.step(`${role.id} : Validate the Menu Bar Display`, async () => {
                    await new MenuBar(page).verifyMenuItems({ pages: Language.English.Menu[role.roleName] });
                    await new MenuBar(page).verifyUserInfo({ role: role.roleName, user: currentUser });
                    await new MenuBar(page).verifyFooter({ version: orgConfig.version, copyright: orgConfig.copyright });
                });

                await test.step(`DA_Login_035 : Verify Logout Functionality`, async () => {
                    await new Header(page).logout();
                    await page.waitForURL(/.*login/, { timeout: 10000 });
                    await expect.poll(async () => {
                        const logoutEvent = await db.auditEvent({ user: currentUser.toLowerCase() });
                        return logoutEvent?.event_type;
                    }, { timeout: 10000 }).toBe('Logged Out');
                });
            });
        });

        userRoles.forEach(role => {
            test(`DA_Login_008,DA_Audit_098,${role.id},DA_Login_035 : Verify Japanese Language Selection on Login and Home Pages - ${role.roleName}`, async () => {
                const currentUser = users[role.roleName].username;
                const currentPass = users[role.roleName].password;

                await new LoginPage(page).handleLanguage({ defaultValue: languageData.English, options: languageData, select: languageData.Japanese });
                await new LoginPage(page).verifyInterfaceTexts({ usernamePlaceholder: 'ユーザー名', passwordPlaceholder: 'パスワード', forgotUserText: 'パスワードをお忘れですか', buttonText: 'ログイン' });

                await Promise.all([
                    page.waitForResponse((res) => res.url().includes('/token') && res.status() === 200),
                    new LoginPage(page).performLogin({ username: currentUser, password: currentPass }),
                ]);

                await verifyNotification(page, 'ようこそ');
                await new HomePage(page).handleDeviceCards({ deviceTypes: Language.Japanese.DeviceType, buttonText: Language.Japanese.Select, select: Language.Japanese.DeviceType.APC });

                await test.step(`DA_Audit_098 : Validate User Authentication Events on the Audit Page (${role.roleName})`, async () => {
                    await expect.poll(async () => {
                        const event = await db.auditEvent({ user: currentUser });
                        return event?.event_type;
                    }, { timeout: 10000 }).toBe('Logged In');

                    const loginEvent = await db.auditEvent({ user: currentUser.toLowerCase() });
                    const userSite = await db.userByName({ name: currentUser });
                    const timeStamp = formatToTimezone(loginEvent.operation_timestamp, userSite.site_timezone);

                    await page.locator('.menu-ul').getByRole('link', { name: Language.Japanese.Menu.Administrator.Audit }).click();
                    await new WebTable(page).handleSelectByDropdown({ label: Language.Japanese['Select By'], select: Language.Japanese.AuditPage.SelectBy['User Name'] });
                    await new WebTable(page).fillInputValue({ label: Language.Japanese.AuditPage.SelectBy['User Name'], value: currentUser });
                    await page.getByRole('button', { name: Language.Japanese.Search, exact: true }).click();
                    await new WebTable(page).waitForSpinner();

                    const rowIndex = await new WebTable(page).findRowIndex({ [Language.Japanese.AuditPage.Label['User Name']]: currentUser });
                    await new WebTable(page).interactWithCell({ label: Language.Japanese.AuditPage.Label['Event'], value: 'ログイン中', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Japanese.AuditPage.Label['Instrument Name'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Japanese.AuditPage.Label['User Name'], value: currentUser, row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Japanese.AuditPage.Label['Sample ID'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Japanese.AuditPage.Label['Continuous Sample ID'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Japanese.AuditPage.Label['Source'], value: 'IN-HOUSE', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Japanese.AuditPage.Label['Timestamp'], value: timeStamp, row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Japanese.AuditPage.Label['Event Details'], value: '', row: rowIndex });
                });

                await test.step(`${role.id} : Validate the Menu Bar Display`, async () => {
                    await new MenuBar(page).verifyMenuItems({ pages: Language.Japanese.Menu[role.roleName] });
                    await new MenuBar(page).verifyUserInfo({ role: role.roleName, user: currentUser });
                    await new MenuBar(page).verifyFooter({ version: orgConfig.version, copyright: orgConfig.copyright });
                });

                await test.step(`DA_Login_035 : Verify Logout Functionality`, async () => {
                    await new Header(page).logout('ログアウト');
                    await page.waitForURL(/.*login/, { timeout: 10000 });
                    await expect.poll(async () => {
                        const logoutEvent = await db.auditEvent({ user: currentUser.toLowerCase() });
                        return logoutEvent?.event_type;
                    }, { timeout: 10000 }).toBe('Logged Out');
                });
            });
        });

        userRoles.forEach(role => {
            test(`DA_Login_009,DA_Audit_098,${role.id},DA_Login_035 : Verify Chinese Language Selection on Login and Home Pages - ${role.roleName}`, async () => {
                const currentUser = users[role.roleName].username;
                const currentPass = users[role.roleName].password;

                await new LoginPage(page).handleLanguage({ defaultValue: languageData.English, options: languageData, select: languageData['Chinese(simplified)'] });
                await new LoginPage(page).verifyInterfaceTexts({ usernamePlaceholder: '使用者名稱', passwordPlaceholder: '密碼', forgotUserText: '忘記密碼？', buttonText: '登 錄' });

                await Promise.all([
                    page.waitForResponse((res) => res.url().includes('/token') && res.status() === 200),
                    new LoginPage(page).performLogin({ username: currentUser, password: currentPass }),
                ]);

                await verifyNotification(page, '欢迎');
                await new HomePage(page).handleDeviceCards({ deviceTypes: Language.Chinese.DeviceType, buttonText: Language.Chinese.Select, select: Language.Chinese.DeviceType.APC });

                await test.step(`DA_Audit_098 : Validate User Authentication Events on the Audit Page (${role.roleName})`, async () => {
                    await expect.poll(async () => {
                        const event = await db.auditEvent({ user: currentUser });
                        return event?.event_type;
                    }, { timeout: 10000 }).toBe('Logged In');

                    const loginEvent = await db.auditEvent({ user: currentUser });
                    const userSite = await db.userByName({ name: currentUser });
                    const timeStamp = formatToTimezone(loginEvent.operation_timestamp, userSite.site_timezone);

                    await page.locator('.menu-ul').getByRole('link', { name: Language.Chinese.Menu.Administrator.Audit }).click();
                    await new WebTable(page).handleSelectByDropdown({ label: Language.Chinese['Select By'], select: Language.Chinese.AuditPage.SelectBy['User Name'] });
                    await new WebTable(page).fillInputValue({ label: Language.Chinese.AuditPage.SelectBy['User Name'], value: currentUser });
                    await page.getByRole('button', { name: Language.Chinese.Search, exact: true }).click();
                    await new WebTable(page).waitForSpinner();

                    const rowIndex = await new WebTable(page).findRowIndex({ [Language.Chinese.AuditPage.Label['User Name']]: currentUser });
                    await new WebTable(page).interactWithCell({ label: Language.Chinese.AuditPage.Label['Event'], value: '已登錄', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Chinese.AuditPage.Label['Instrument Name'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Chinese.AuditPage.Label['User Name'], value: currentUser, row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Chinese.AuditPage.Label['Sample ID'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Chinese.AuditPage.Label['Continuous Sample ID'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Chinese.AuditPage.Label['Source'], value: 'IN-HOUSE', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Chinese.AuditPage.Label['Timestamp'], value: timeStamp, row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Chinese.AuditPage.Label['Event Details'], value: '', row: rowIndex });
                });

                await test.step(`${role.id} : Validate the Menu Bar Display`, async () => {
                    await new MenuBar(page).verifyMenuItems({ pages: Language.Chinese.Menu[role.roleName] });
                    await new MenuBar(page).verifyUserInfo({ role: role.roleName, user: currentUser });
                    await new MenuBar(page).verifyFooter({ version: orgConfig.version, copyright: orgConfig.copyright });
                });

                await test.step(`DA_Login_035 : Verify Logout Functionality`, async () => {
                    await new Header(page).logout('註銷');
                    await page.waitForURL(/.*login/, { timeout: 10000 });
                    await expect.poll(async () => {
                        const logoutEvent = await db.auditEvent({ user: currentUser.toLowerCase() });
                        return logoutEvent?.event_type;
                    }, { timeout: 10000 }).toBe('Logged Out');
                });
            });
        });

        userRoles.forEach(role => {
            test(`DA_Login_010,DA_Audit_098,${role.id},DA_Login_035 : Verify Korean Language Selection on Login and Home Pages - ${role.roleName}`, async () => {
                const currentUser = users[role.roleName].username;
                const currentPass = users[role.roleName].password;

                await new LoginPage(page).handleLanguage({ defaultValue: languageData.English, options: languageData, select: languageData.Korean });
                await new LoginPage(page).verifyInterfaceTexts({ usernamePlaceholder: '사용자 이름', passwordPlaceholder: '비밀번호', forgotUserText: '비밀번호를 잊으셨나요?', buttonText: '로그인' });

                await Promise.all([
                    page.waitForResponse((res) => res.url().includes('/token') && res.status() === 200),
                    new LoginPage(page).performLogin({ username: currentUser, password: currentPass }),
                ]);

                await verifyNotification(page, '환영합니다');
                await new HomePage(page).handleDeviceCards({ deviceTypes: Language.Korean.DeviceType, buttonText: Language.Korean.Select, select: Language.Korean.DeviceType.APC });

                await test.step(`DA_Audit_098 : Validate User Authentication Events on the Audit Page (${role.roleName})`, async () => {
                    await expect.poll(async () => {
                        const event = await db.auditEvent({ user: currentUser });
                        return event?.event_type;
                    }, { timeout: 10000 }).toBe('Logged In');

                    const loginEvent = await db.auditEvent({ user: currentUser });
                    const userSite = await db.userByName({ name: currentUser });
                    const timeStamp = formatToTimezone(loginEvent.operation_timestamp, userSite.site_timezone);

                    await page.locator('.menu-ul').getByRole('link', { name: Language.Korean.Menu.Administrator.Audit }).click();
                    await new WebTable(page).handleSelectByDropdown({ label: Language.Korean['Select By'], select: Language.Korean.AuditPage.SelectBy['User Name'] });
                    await new WebTable(page).fillInputValue({ label: Language.Korean.AuditPage.SelectBy['User Name'], value: currentUser });
                    await page.getByRole('button', { name: Language.Korean.Search, exact: true }).click();
                    await new WebTable(page).waitForSpinner();

                    const rowIndex = await new WebTable(page).findRowIndex({ [Language.Korean.AuditPage.Label['User Name']]: currentUser });
                    await new WebTable(page).interactWithCell({ label: Language.Korean.AuditPage.Label['Event'], value: '로그인됨', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Korean.AuditPage.Label['Instrument Name'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Korean.AuditPage.Label['User Name'], value: currentUser, row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Korean.AuditPage.Label['Sample ID'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Korean.AuditPage.Label['Continuous Sample ID'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Korean.AuditPage.Label['Source'], value: 'IN-HOUSE', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Korean.AuditPage.Label['Timestamp'], value: timeStamp, row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Korean.AuditPage.Label['Event Details'], value: '', row: rowIndex });
                });

                await test.step(`${role.id} : Validate the Menu Bar Display`, async () => {
                    await new MenuBar(page).verifyMenuItems({ pages: Language.Korean.Menu[role.roleName] });
                    await new MenuBar(page).verifyUserInfo({ role: role.roleName, user: currentUser });
                    await new MenuBar(page).verifyFooter({ version: orgConfig.version, copyright: orgConfig.copyright });
                });

                await test.step(`DA_Login_035 : Verify Logout Functionality`, async () => {
                    await new Header(page).logout('로그아웃');
                    await page.waitForURL(/.*login/, { timeout: 10000 });
                    await expect.poll(async () => {
                        const logoutEvent = await db.auditEvent({ user: currentUser.toLowerCase() });
                        return logoutEvent?.event_type;
                    }, { timeout: 10000 }).toBe('Logged Out');
                });
            });
        });

        test('DA_Login_013 : Verify HTTP Access Restriction for Login Page', async ({ browserName }) => {
            test.skip(browserName === 'webkit', 'WebKit auto-upgrades to HTTPS, bypassing the HTTP 400 check');
            const baseUrl = process.env.FRONTEND_URL;
            const httpUrl = baseUrl.replace(/^https:/, 'http:');

            await page.goto(`${httpUrl}${clientPath}`, { waitUntil: 'load', timeout: 30000 });
            const response = await page.goto(httpUrl, { waitUntil: 'domcontentloaded' });

            expect(response.status()).toBe(400);
            await expect(page.locator('body')).toContainText([
                '400 Bad Request',
                'The plain HTTP request was sent to HTTPS port',
                'nginx/1.26.3'
            ]);
        });

        test('DA_Login_014 : Verify HTTPS Response Code for Login Page URL', async () => {
            const baseUrl = `${process.env.FRONTEND_URL}${clientPath}`;
            await page.goto(clientPath, { waitUntil: 'load', timeout: 30000 });
            const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
            expect(response.status()).toBe(200);
        });

        test('DA_Login_016, DA_Login_032 : Verify Handling of Invalid Login Page URL', async () => {
            await page.goto(clientPath.replace(/login/, ''), { waitUntil: 'load', timeout: 30000 });
            await expect(page.locator('.ant-result-title')).toHaveText('Sorry, the page you visited does not exist.');
            await expect(page.locator('.ant-result-subtitle')).toHaveText('Please provide valid client key (or) valid path');
            await page.goto(clientPath, { waitUntil: 'load', timeout: 30000 });
        });

        test('DA_Login_017 : Validate Case-Insensitive Username Login', async () => {
            const originalUser = users[roleData.Admin].username;
            const mixedCaseUser = originalUser.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('');

            await Promise.all([
                page.waitForResponse((res) => res.url().includes('/token') && res.status() === 200),
                new LoginPage(page).performLogin({ username: mixedCaseUser, password: users[roleData.Admin].password }),
            ]);

            await verifyNotification(page, 'Welcome');

            await expect.poll(async () => {
                const event = await db.auditEvent({ user: originalUser.toLowerCase() });
                return event?.event_type;
            }, { timeout: 10000 }).toBe('Logged In');

            await test.step(`DA_Login_035 : Verify Logout Functionality`, async () => {
                await new Header(page).logout('Logout');
                await page.waitForURL(/.*login/, { timeout: 10000 });
                await expect.poll(async () => {
                    const logoutEvent = await db.auditEvent({ user: originalUser.toLowerCase() });
                    return logoutEvent?.event_type;
                }, { timeout: 10000 }).toBe('Logged Out');
            });
        });

        test.describe('Negative Login Scenarios', () => {
            test('DA_Login_018 : Verify Handling of Empty Username and Password Fields', async () => {
                await new LoginPage(page).performLogin({ username: '', password: '' });
                await verifyNotification(page, 'Username and Password are required');
            });

            test('DA_Login_019 : Verify Handling of Empty Username Field', async () => {
                await new LoginPage(page).performLogin({ username: '', password: 'Welcome_123!' });
                await expect(page.locator('form > div:nth-child(1) > div > div > div > div > p')).toHaveText('Please input your username!');
            });

            test('DA_Login_020 : Validate Handling of Empty Password Field', async () => {
                await new LoginPage(page).performLogin({ username: users[roleData.Admin].username, password: '' });
                await expect(page.locator('form > div:nth-child(2) > div > div > div > div > p')).toHaveText('Please input your password!');
            });

            test('DA_Login_021 : Verify Handling When Username and Password Fields Are Cleared During Login', async () => {
                await new LoginPage(page).clearCreds({ username: users[roleData.Admin].username, password: users[roleData.Admin].password });
                await expect(page.locator('form > div:nth-child(1) > div > div > div > div > p')).toHaveText('Please input your username!');
                await expect(page.locator('form > div:nth-child(2) > div > div > div > div > p')).toHaveText('Please input your password!');
            });

            test('DA_Login_022 : Verify Login with Invalid Credentials', async () => {
                await new LoginPage(page).performLogin({ username: 'InvalidUser', password: 'InvalidPassword' });
                await verifyNotification(page, 'User does not exist.');
            });

            test('DA_Login_023 : Verify Login with Invalid Username and Valid Password', async () => {
                await new LoginPage(page).performLogin({ username: 'InvalidUser', password: users[roleData.Admin].password });
                await verifyNotification(page, 'User does not exist.');
                await expect(page.locator('.forgot p')).toHaveText('Forgot Username?');
            });

            test('DA_Login_024 : Verify Login with Valid Username and Invalid Password', async () => {
                await new LoginPage(page).performLogin({ username: users[roleData.Admin].username, password: 'WrongPassword' });
                await verifyNotification(page, 'Invalid Credentials, Please provide valid credentials');
                await expect(page.locator('.forgot p')).toHaveText('Forgot Password?');
            });

            test('DA_Login_025 : Verify Forgot Password Link After Login with Valid Username and Invalid Password', async () => {
                await new LoginPage(page).performLogin({ username: users[roleData.Admin].username, password: 'WrongPassword' });
                await verifyNotification(page, 'Invalid Credentials, Please provide valid credentials');
                const link = page.locator('.forgot p');
                await expect(link).toHaveText('Forgot Password?');
                await link.click();
                await verifyNotification(page, 'For Username & Password Resets contact your site administrator');
            });

            test('DA_Login_026 : Verify Forgot Username Link After Login with Invalid Username and Valid Password', async () => {
                await new LoginPage(page).performLogin({ username: 'InvalidUser', password: users[roleData.Admin].password });
                await verifyNotification(page, 'User does not exist.');
                const link = page.locator('.forgot p');
                await expect(link).toHaveText('Forgot Username?');
                await link.click();
                await verifyNotification(page, 'For Username & Password Resets contact your site administrator');
            });
        });

        test.describe.serial('Password Reset', () => {

            let tempPassword;

            test.beforeAll(async () => {
                await new LoginPage(page).performLogin({ username: orgConfig.defaultAdmin.userName, password: orgConfig.defaultAdmin.password });
                await verifyNotification(page, 'Welcome');

                await new HomePage(page).handleDeviceCards({ deviceTypes: Language.English.DeviceType, buttonText: Language.English.Select, select: Language.English.DeviceType.APC });
                await page.locator('.menu-ul').getByRole('link', { name: Language.English.Menu.Administrator.Manage }).click();

                await new WebTable(page).handleSelectByDropdown({ label: Language.English['Select By'], select: Language.English.ManagePage.SelectBy.Users['User Name'] });
                await new WebTable(page).fillInputValue({ label: Language.English.ManagePage.SelectBy.Users['User Name'], value: users[roleData.Admin].username });
                await page.getByRole('button', { name: Language.English.Search, exact: true }).click();
                await new WebTable(page).waitForSpinner();

                const rowIndex = await new WebTable(page).findRowIndex({ [Language.English.ManagePage.Label.Users['User Name']]: users[roleData.Admin].username });
                await new WebTable(page).interactWithCell({ label: Language.English.ManagePage.Label.Users['Edit'], hover: "Edit User", buttonState: "enabled", buttonClick: true, row: rowIndex });

                await page.locator('.ant-modal-content button:visible', { hasText: "Generate New Password" }).click();
                const passwordContainer = page.locator('[role="document"] div.ant-typography');
                await passwordContainer.getByRole('button').click();

                tempPassword = (await passwordContainer.textContent()).trim();

                await page.getByRole('button', { name: 'Submit', exact: true }).click();
                await verifyNotification(page, `${users[roleData.Admin].username.toLowerCase()} Updated Successfully!`);

                await new Header(page).logout();
                await page.waitForURL(/.*login/, { timeout: 10000 });
            });

            test('DA_Login_028 : Verify Reset Password Form Validation', async () => {
                await new LoginPage(page).performLogin({ username: users[roleData.Admin].username, password: tempPassword });

                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(1)  p')).toHaveText('Old Password is required');

                await new LoginPage(page).oldPasswordInput.fill(tempPassword);
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(2)  p')).toHaveText('New Password is required');

                await new LoginPage(page).newPasswordInput.fill(users[roleData.Admin].password);
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(3)  p')).toHaveText('Confirm New Password is required');

                await new LoginPage(page).confirmPasswordInput.fill(users[roleData.Admin].password + 'e');
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(3)  p')).toHaveText('Passwords do not match');
            });

            test('DA_Login_029 : Validate New Password Field with All Required Criteria on the Reset Password page', async () => {
                await new LoginPage(page).oldPasswordInput.fill(tempPassword);

                await new LoginPage(page).newPasswordInput.fill('aB1!');
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(2)  p')).toHaveText('Password must be at least 8 characters long');

                await new LoginPage(page).newPasswordInput.fill('aB1!'.repeat(6));
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(2)  p')).toHaveText('Password must not exceed 20 characters');

                await new LoginPage(page).newPasswordInput.fill('ABC12345');
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(2)  p')).toHaveText('Password must contain at least one lowercase, one uppercase, one digit, and any special character');

                await new LoginPage(page).newPasswordInput.fill('abc12345');
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(2)  p')).toHaveText('Password must contain at least one lowercase, one uppercase, one digit, and any special character');

                await new LoginPage(page).newPasswordInput.fill('aBc!@#');
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(2)  p')).toHaveText('Password must be at least 8 characters long');

                await new LoginPage(page).newPasswordInput.fill('aB12345');
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(2)  p')).toHaveText('Password must be at least 8 characters long');
            });

            test('DA_Login_027 : Reset Password Functionality', async () => {
                await new LoginPage(page).resetForm({
                    oldPassword: tempPassword,
                    newPassword: users[roleData.Admin].password,
                    confirmPassword: users[roleData.Admin].password
                });
                await verifyNotification(page, `Password Has Been Reset Successfully`);
            });

        });

        test('DA_Login_030 : Password Masking', async () => {
            await new LoginPage(page).passwordMasking({ username: users[roleData.Admin].username, password: users[roleData.Admin].password });
        });

        test('DA_Login_031 : Verify Login Page Load Time', async ({ request }) => {
            const MAX_TIME_MS = 2000;
            const startTime = Date.now();
            const response = await request.get(`${clientPath}/login`);
            const loadTime = Date.now() - startTime;
            expect(response.status()).toBe(200);
            expect(loadTime, `Server responded in ${loadTime}ms (Limit: ${MAX_TIME_MS}ms)`).toBeLessThan(MAX_TIME_MS);
        });
    });
});import { test, expect } from '../../hooks/auth.fixture.js';
import { LoginPage } from '../../pages/loginpage.js';
import { HomePage } from '../../pages/homepage.js';
import { Header } from '../../pages/components/header.js';
import { WebTable } from '../../pages/components/table.js';
import { MenuBar } from '../../pages/components/menu.js';
import { formatToTimezone, verifyNotification } from '../../pages/components/utilities.js';
import Language from '../../fixtures/labels/titles.json';
import languageData from '../../fixtures/labels/languages.json';
import roleData from '../../fixtures/labels/roles.json';
import { db } from '../../fixtures/sql/queries.js';

test.describe('Login Page', () => {

    let orgConfig, envConfig, clientPath;
    const users = {};
    let context, page;

    test.beforeAll(async ({ browser }, testInfo) => {
        users[roleData.Admin] = testInfo.project.metadata.roles.Administrator;
        users[roleData.Operator] = testInfo.project.metadata.roles.Operator;
        users[roleData.Auditor] = testInfo.project.metadata.roles.Auditor;

        envConfig = testInfo.project.metadata.config;
        orgConfig = testInfo.project.metadata.config.org;
        clientPath = `/${process.env.CLIENT_URL_KEY}`;

        context = await browser.newContext();
        page = await context.newPage();
    });

    test.afterAll(async () => {
        await page.close();
        await context.close();
    });

    test.describe('DNS URL Validations', () => {
        test.beforeAll(() => {
            if (envConfig.dns === 'off') test.skip(true, 'DNS URL is not configured for the current environment');
        });

        test('DA_Login_001 : Verify Login Page Access Using a Valid Client-Specific DNS URL', async () => {
            const response = await new LoginPage(page).navigateToLogin({ url: orgConfig.dns });
            if (response) expect(response.status()).toBe(200);
            await expect(page).toHaveURL(`${orgConfig.dns}/login`);
        });

        test('DA_Login_003 : Verify Client Branding Loads Correctly Using Client-Specific DNS URL', async () => {
            await new LoginPage(page).navigateToLogin({ url: orgConfig.dns });
            await expect(page).toHaveURL(`${orgConfig.dns}/login`);
            await expect(page.locator('.logo img')).toBeVisible();
            await expect(page.locator('.logo img')).toHaveScreenshot(`${orgConfig.orgName}.png`, { maxDiffPixelRatio: 0.1 });
        });
    });

    test.describe('Static URL', () => {

        test.beforeAll(async () => {
            await new LoginPage(page).navigateToLogin({ url: clientPath });
            await expect(page.locator('.loginName')).toHaveText('Connected Plant');
            await expect(page).toHaveTitle('Connected Plant');
            await expect(page.locator('.footer-details')).toHaveText(orgConfig.copyright);
            await expect(page.locator('.logo img')).toBeVisible();
            await expect(page.locator('.logo img')).toHaveScreenshot(`${orgConfig.orgName}.png`, { maxDiffPixelRatio: 0.1 });
        });

        const userRoles = [
            { roleName: roleData.Admin, id: 'DA_Login_011' },
            { roleName: roleData.Operator, id: 'DA_Login_012' },
            { roleName: roleData.Auditor, id: 'DA_Login_013' }
        ];

        userRoles.forEach(role => {
            test(`DA_Login_006,DA_Login_007,DA_Audit_098,${role.id},DA_Login_035 : Verify English Language Selection on Login and Home Pages - ${role.roleName}`, async () => {
                const currentUser = users[role.roleName].username;
                const currentPass = users[role.roleName].password;

                await new LoginPage(page).handleLanguage({ defaultValue: languageData.English, options: languageData, select: languageData.English });
                await new LoginPage(page).verifyInterfaceTexts({ usernamePlaceholder: 'User Name', passwordPlaceholder: 'Password', forgotUserText: 'Forgot Password?', buttonText: 'Login' });

                await Promise.all([
                    page.waitForResponse((res) => res.url().includes('/token') && res.status() === 200),
                    new LoginPage(page).performLogin({ username: currentUser, password: currentPass }),
                ]);

                await verifyNotification(page, 'Welcome');
                await new HomePage(page).handleDeviceCards({ deviceTypes: Language.English.DeviceType, buttonText: Language.English.Select, select: Language.English.DeviceType.APC });

                await test.step(`DA_Audit_098 : Validate User Authentication Events on the Audit Page (${role.roleName})`, async () => {
                    await expect.poll(async () => {
                        const event = await db.auditEvent({ user: currentUser });
                        return event?.event_type;
                    }, { timeout: 10000 }).toBe('Logged In');

                    const loginEvent = await db.auditEvent({ user: currentUser });
                    const userSite = await db.userByName({ name: currentUser });
                    const timeStamp = formatToTimezone(loginEvent.operation_timestamp, userSite.site_timezone);

                    await page.locator('.menu-ul').getByRole('link', { name: Language.English.Menu.Administrator.Audit }).click();
                    await new WebTable(page).handleSelectByDropdown({ label: Language.English['Select By'], select: Language.English.AuditPage.SelectBy['User Name'] });
                    await new WebTable(page).fillInputValue({ label: Language.English.AuditPage.SelectBy['User Name'], value: currentUser });
                    await page.getByRole('button', { name: Language.English.Search, exact: true }).click();
                    await new WebTable(page).waitForSpinner();

                    const rowIndex = await new WebTable(page).findRowIndex({ [Language.English.AuditPage.Label['User Name']]: currentUser });
                    await new WebTable(page).interactWithCell({ label: Language.English.AuditPage.Label['Event'], value: 'Logged In', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.English.AuditPage.Label['Instrument Name'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.English.AuditPage.Label['User Name'], value: currentUser, row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.English.AuditPage.Label['Sample ID'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.English.AuditPage.Label['Continuous Sample ID'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.English.AuditPage.Label['Source'], value: 'IN-HOUSE', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.English.AuditPage.Label['Timestamp'], value: timeStamp, row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.English.AuditPage.Label['Event Details'], value: '', row: rowIndex });
                });

                await test.step(`${role.id} : Validate the Menu Bar Display`, async () => {
                    await new MenuBar(page).verifyMenuItems({ pages: Language.English.Menu[role.roleName] });
                    await new MenuBar(page).verifyUserInfo({ role: role.roleName, user: currentUser });
                    await new MenuBar(page).verifyFooter({ version: orgConfig.version, copyright: orgConfig.copyright });
                });

                await test.step(`DA_Login_035 : Verify Logout Functionality`, async () => {
                    await new Header(page).logout();
                    await page.waitForURL(/.*login/, { timeout: 10000 });
                    await expect.poll(async () => {
                        const logoutEvent = await db.auditEvent({ user: currentUser.toLowerCase() });
                        return logoutEvent?.event_type;
                    }, { timeout: 10000 }).toBe('Logged Out');
                });
            });
        });

        userRoles.forEach(role => {
            test(`DA_Login_008,DA_Audit_098,${role.id},DA_Login_035 : Verify Japanese Language Selection on Login and Home Pages - ${role.roleName}`, async () => {
                const currentUser = users[role.roleName].username;
                const currentPass = users[role.roleName].password;

                await new LoginPage(page).handleLanguage({ defaultValue: languageData.English, options: languageData, select: languageData.Japanese });
                await new LoginPage(page).verifyInterfaceTexts({ usernamePlaceholder: 'ユーザー名', passwordPlaceholder: 'パスワード', forgotUserText: 'パスワードをお忘れですか', buttonText: 'ログイン' });

                await Promise.all([
                    page.waitForResponse((res) => res.url().includes('/token') && res.status() === 200),
                    new LoginPage(page).performLogin({ username: currentUser, password: currentPass }),
                ]);

                await verifyNotification(page, 'ようこそ');
                await new HomePage(page).handleDeviceCards({ deviceTypes: Language.Japanese.DeviceType, buttonText: Language.Japanese.Select, select: Language.Japanese.DeviceType.APC });

                await test.step(`DA_Audit_098 : Validate User Authentication Events on the Audit Page (${role.roleName})`, async () => {
                    await expect.poll(async () => {
                        const event = await db.auditEvent({ user: currentUser });
                        return event?.event_type;
                    }, { timeout: 10000 }).toBe('Logged In');

                    const loginEvent = await db.auditEvent({ user: currentUser.toLowerCase() });
                    const userSite = await db.userByName({ name: currentUser });
                    const timeStamp = formatToTimezone(loginEvent.operation_timestamp, userSite.site_timezone);

                    await page.locator('.menu-ul').getByRole('link', { name: Language.Japanese.Menu.Administrator.Audit }).click();
                    await new WebTable(page).handleSelectByDropdown({ label: Language.Japanese['Select By'], select: Language.Japanese.AuditPage.SelectBy['User Name'] });
                    await new WebTable(page).fillInputValue({ label: Language.Japanese.AuditPage.SelectBy['User Name'], value: currentUser });
                    await page.getByRole('button', { name: Language.Japanese.Search, exact: true }).click();
                    await new WebTable(page).waitForSpinner();

                    const rowIndex = await new WebTable(page).findRowIndex({ [Language.Japanese.AuditPage.Label['User Name']]: currentUser });
                    await new WebTable(page).interactWithCell({ label: Language.Japanese.AuditPage.Label['Event'], value: 'ログイン中', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Japanese.AuditPage.Label['Instrument Name'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Japanese.AuditPage.Label['User Name'], value: currentUser, row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Japanese.AuditPage.Label['Sample ID'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Japanese.AuditPage.Label['Continuous Sample ID'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Japanese.AuditPage.Label['Source'], value: 'IN-HOUSE', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Japanese.AuditPage.Label['Timestamp'], value: timeStamp, row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Japanese.AuditPage.Label['Event Details'], value: '', row: rowIndex });
                });

                await test.step(`${role.id} : Validate the Menu Bar Display`, async () => {
                    await new MenuBar(page).verifyMenuItems({ pages: Language.Japanese.Menu[role.roleName] });
                    await new MenuBar(page).verifyUserInfo({ role: role.roleName, user: currentUser });
                    await new MenuBar(page).verifyFooter({ version: orgConfig.version, copyright: orgConfig.copyright });
                });

                await test.step(`DA_Login_035 : Verify Logout Functionality`, async () => {
                    await new Header(page).logout('ログアウト');
                    await page.waitForURL(/.*login/, { timeout: 10000 });
                    await expect.poll(async () => {
                        const logoutEvent = await db.auditEvent({ user: currentUser.toLowerCase() });
                        return logoutEvent?.event_type;
                    }, { timeout: 10000 }).toBe('Logged Out');
                });
            });
        });

        userRoles.forEach(role => {
            test(`DA_Login_009,DA_Audit_098,${role.id},DA_Login_035 : Verify Chinese Language Selection on Login and Home Pages - ${role.roleName}`, async () => {
                const currentUser = users[role.roleName].username;
                const currentPass = users[role.roleName].password;

                await new LoginPage(page).handleLanguage({ defaultValue: languageData.English, options: languageData, select: languageData['Chinese(simplified)'] });
                await new LoginPage(page).verifyInterfaceTexts({ usernamePlaceholder: '使用者名稱', passwordPlaceholder: '密碼', forgotUserText: '忘記密碼？', buttonText: '登 錄' });

                await Promise.all([
                    page.waitForResponse((res) => res.url().includes('/token') && res.status() === 200),
                    new LoginPage(page).performLogin({ username: currentUser, password: currentPass }),
                ]);

                await verifyNotification(page, '欢迎');
                await new HomePage(page).handleDeviceCards({ deviceTypes: Language.Chinese.DeviceType, buttonText: Language.Chinese.Select, select: Language.Chinese.DeviceType.APC });

                await test.step(`DA_Audit_098 : Validate User Authentication Events on the Audit Page (${role.roleName})`, async () => {
                    await expect.poll(async () => {
                        const event = await db.auditEvent({ user: currentUser });
                        return event?.event_type;
                    }, { timeout: 10000 }).toBe('Logged In');

                    const loginEvent = await db.auditEvent({ user: currentUser });
                    const userSite = await db.userByName({ name: currentUser });
                    const timeStamp = formatToTimezone(loginEvent.operation_timestamp, userSite.site_timezone);

                    await page.locator('.menu-ul').getByRole('link', { name: Language.Chinese.Menu.Administrator.Audit }).click();
                    await new WebTable(page).handleSelectByDropdown({ label: Language.Chinese['Select By'], select: Language.Chinese.AuditPage.SelectBy['User Name'] });
                    await new WebTable(page).fillInputValue({ label: Language.Chinese.AuditPage.SelectBy['User Name'], value: currentUser });
                    await page.getByRole('button', { name: Language.Chinese.Search, exact: true }).click();
                    await new WebTable(page).waitForSpinner();

                    const rowIndex = await new WebTable(page).findRowIndex({ [Language.Chinese.AuditPage.Label['User Name']]: currentUser });
                    await new WebTable(page).interactWithCell({ label: Language.Chinese.AuditPage.Label['Event'], value: '已登錄', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Chinese.AuditPage.Label['Instrument Name'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Chinese.AuditPage.Label['User Name'], value: currentUser, row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Chinese.AuditPage.Label['Sample ID'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Chinese.AuditPage.Label['Continuous Sample ID'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Chinese.AuditPage.Label['Source'], value: 'IN-HOUSE', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Chinese.AuditPage.Label['Timestamp'], value: timeStamp, row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Chinese.AuditPage.Label['Event Details'], value: '', row: rowIndex });
                });

                await test.step(`${role.id} : Validate the Menu Bar Display`, async () => {
                    await new MenuBar(page).verifyMenuItems({ pages: Language.Chinese.Menu[role.roleName] });
                    await new MenuBar(page).verifyUserInfo({ role: role.roleName, user: currentUser });
                    await new MenuBar(page).verifyFooter({ version: orgConfig.version, copyright: orgConfig.copyright });
                });

                await test.step(`DA_Login_035 : Verify Logout Functionality`, async () => {
                    await new Header(page).logout('註銷');
                    await page.waitForURL(/.*login/, { timeout: 10000 });
                    await expect.poll(async () => {
                        const logoutEvent = await db.auditEvent({ user: currentUser.toLowerCase() });
                        return logoutEvent?.event_type;
                    }, { timeout: 10000 }).toBe('Logged Out');
                });
            });
        });

        userRoles.forEach(role => {
            test(`DA_Login_010,DA_Audit_098,${role.id},DA_Login_035 : Verify Korean Language Selection on Login and Home Pages - ${role.roleName}`, async () => {
                const currentUser = users[role.roleName].username;
                const currentPass = users[role.roleName].password;

                await new LoginPage(page).handleLanguage({ defaultValue: languageData.English, options: languageData, select: languageData.Korean });
                await new LoginPage(page).verifyInterfaceTexts({ usernamePlaceholder: '사용자 이름', passwordPlaceholder: '비밀번호', forgotUserText: '비밀번호를 잊으셨나요?', buttonText: '로그인' });

                await Promise.all([
                    page.waitForResponse((res) => res.url().includes('/token') && res.status() === 200),
                    new LoginPage(page).performLogin({ username: currentUser, password: currentPass }),
                ]);

                await verifyNotification(page, '환영합니다');
                await new HomePage(page).handleDeviceCards({ deviceTypes: Language.Korean.DeviceType, buttonText: Language.Korean.Select, select: Language.Korean.DeviceType.APC });

                await test.step(`DA_Audit_098 : Validate User Authentication Events on the Audit Page (${role.roleName})`, async () => {
                    await expect.poll(async () => {
                        const event = await db.auditEvent({ user: currentUser });
                        return event?.event_type;
                    }, { timeout: 10000 }).toBe('Logged In');

                    const loginEvent = await db.auditEvent({ user: currentUser });
                    const userSite = await db.userByName({ name: currentUser });
                    const timeStamp = formatToTimezone(loginEvent.operation_timestamp, userSite.site_timezone);

                    await page.locator('.menu-ul').getByRole('link', { name: Language.Korean.Menu.Administrator.Audit }).click();
                    await new WebTable(page).handleSelectByDropdown({ label: Language.Korean['Select By'], select: Language.Korean.AuditPage.SelectBy['User Name'] });
                    await new WebTable(page).fillInputValue({ label: Language.Korean.AuditPage.SelectBy['User Name'], value: currentUser });
                    await page.getByRole('button', { name: Language.Korean.Search, exact: true }).click();
                    await new WebTable(page).waitForSpinner();

                    const rowIndex = await new WebTable(page).findRowIndex({ [Language.Korean.AuditPage.Label['User Name']]: currentUser });
                    await new WebTable(page).interactWithCell({ label: Language.Korean.AuditPage.Label['Event'], value: '로그인됨', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Korean.AuditPage.Label['Instrument Name'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Korean.AuditPage.Label['User Name'], value: currentUser, row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Korean.AuditPage.Label['Sample ID'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Korean.AuditPage.Label['Continuous Sample ID'], value: '', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Korean.AuditPage.Label['Source'], value: 'IN-HOUSE', row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Korean.AuditPage.Label['Timestamp'], value: timeStamp, row: rowIndex });
                    await new WebTable(page).interactWithCell({ label: Language.Korean.AuditPage.Label['Event Details'], value: '', row: rowIndex });
                });

                await test.step(`${role.id} : Validate the Menu Bar Display`, async () => {
                    await new MenuBar(page).verifyMenuItems({ pages: Language.Korean.Menu[role.roleName] });
                    await new MenuBar(page).verifyUserInfo({ role: role.roleName, user: currentUser });
                    await new MenuBar(page).verifyFooter({ version: orgConfig.version, copyright: orgConfig.copyright });
                });

                await test.step(`DA_Login_035 : Verify Logout Functionality`, async () => {
                    await new Header(page).logout('로그아웃');
                    await page.waitForURL(/.*login/, { timeout: 10000 });
                    await expect.poll(async () => {
                        const logoutEvent = await db.auditEvent({ user: currentUser.toLowerCase() });
                        return logoutEvent?.event_type;
                    }, { timeout: 10000 }).toBe('Logged Out');
                });
            });
        });

        test('DA_Login_013 : Verify HTTP Access Restriction for Login Page', async ({ browserName }) => {
            test.skip(browserName === 'webkit', 'WebKit auto-upgrades to HTTPS, bypassing the HTTP 400 check');
            const baseUrl = process.env.FRONTEND_URL;
            const httpUrl = baseUrl.replace(/^https:/, 'http:');

            await page.goto(`${httpUrl}${clientPath}`, { waitUntil: 'load', timeout: 30000 });
            const response = await page.goto(httpUrl, { waitUntil: 'domcontentloaded' });

            expect(response.status()).toBe(400);
            await expect(page.locator('body')).toContainText([
                '400 Bad Request',
                'The plain HTTP request was sent to HTTPS port',
                'nginx/1.26.3'
            ]);
        });

        test('DA_Login_014 : Verify HTTPS Response Code for Login Page URL', async () => {
            const baseUrl = `${process.env.FRONTEND_URL}${clientPath}`;
            await page.goto(clientPath, { waitUntil: 'load', timeout: 30000 });
            const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
            expect(response.status()).toBe(200);
        });

        test('DA_Login_016, DA_Login_032 : Verify Handling of Invalid Login Page URL', async () => {
            await page.goto(clientPath.replace(/login/, ''), { waitUntil: 'load', timeout: 30000 });
            await expect(page.locator('.ant-result-title')).toHaveText('Sorry, the page you visited does not exist.');
            await expect(page.locator('.ant-result-subtitle')).toHaveText('Please provide valid client key (or) valid path');
            await page.goto(clientPath, { waitUntil: 'load', timeout: 30000 });
        });

        test('DA_Login_017 : Validate Case-Insensitive Username Login', async () => {
            const originalUser = users[roleData.Admin].username;
            const mixedCaseUser = originalUser.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('');

            await Promise.all([
                page.waitForResponse((res) => res.url().includes('/token') && res.status() === 200),
                new LoginPage(page).performLogin({ username: mixedCaseUser, password: users[roleData.Admin].password }),
            ]);

            await verifyNotification(page, 'Welcome');

            await expect.poll(async () => {
                const event = await db.auditEvent({ user: originalUser.toLowerCase() });
                return event?.event_type;
            }, { timeout: 10000 }).toBe('Logged In');

            await test.step(`DA_Login_035 : Verify Logout Functionality`, async () => {
                await new Header(page).logout('Logout');
                await page.waitForURL(/.*login/, { timeout: 10000 });
                await expect.poll(async () => {
                    const logoutEvent = await db.auditEvent({ user: originalUser.toLowerCase() });
                    return logoutEvent?.event_type;
                }, { timeout: 10000 }).toBe('Logged Out');
            });
        });

        test.describe('Negative Login Scenarios', () => {
            test('DA_Login_018 : Verify Handling of Empty Username and Password Fields', async () => {
                await new LoginPage(page).performLogin({ username: '', password: '' });
                await verifyNotification(page, 'Username and Password are required');
            });

            test('DA_Login_019 : Verify Handling of Empty Username Field', async () => {
                await new LoginPage(page).performLogin({ username: '', password: 'Welcome_123!' });
                await expect(page.locator('form > div:nth-child(1) > div > div > div > div > p')).toHaveText('Please input your username!');
            });

            test('DA_Login_020 : Validate Handling of Empty Password Field', async () => {
                await new LoginPage(page).performLogin({ username: users[roleData.Admin].username, password: '' });
                await expect(page.locator('form > div:nth-child(2) > div > div > div > div > p')).toHaveText('Please input your password!');
            });

            test('DA_Login_021 : Verify Handling When Username and Password Fields Are Cleared During Login', async () => {
                await new LoginPage(page).clearCreds({ username: users[roleData.Admin].username, password: users[roleData.Admin].password });
                await expect(page.locator('form > div:nth-child(1) > div > div > div > div > p')).toHaveText('Please input your username!');
                await expect(page.locator('form > div:nth-child(2) > div > div > div > div > p')).toHaveText('Please input your password!');
            });

            test('DA_Login_022 : Verify Login with Invalid Credentials', async () => {
                await new LoginPage(page).performLogin({ username: 'InvalidUser', password: 'InvalidPassword' });
                await verifyNotification(page, 'User does not exist.');
            });

            test('DA_Login_023 : Verify Login with Invalid Username and Valid Password', async () => {
                await new LoginPage(page).performLogin({ username: 'InvalidUser', password: users[roleData.Admin].password });
                await verifyNotification(page, 'User does not exist.');
                await expect(page.locator('.forgot p')).toHaveText('Forgot Username?');
            });

            test('DA_Login_024 : Verify Login with Valid Username and Invalid Password', async () => {
                await new LoginPage(page).performLogin({ username: users[roleData.Admin].username, password: 'WrongPassword' });
                await verifyNotification(page, 'Invalid Credentials, Please provide valid credentials');
                await expect(page.locator('.forgot p')).toHaveText('Forgot Password?');
            });

            test('DA_Login_025 : Verify Forgot Password Link After Login with Valid Username and Invalid Password', async () => {
                await new LoginPage(page).performLogin({ username: users[roleData.Admin].username, password: 'WrongPassword' });
                await verifyNotification(page, 'Invalid Credentials, Please provide valid credentials');
                const link = page.locator('.forgot p');
                await expect(link).toHaveText('Forgot Password?');
                await link.click();
                await verifyNotification(page, 'For Username & Password Resets contact your site administrator');
            });

            test('DA_Login_026 : Verify Forgot Username Link After Login with Invalid Username and Valid Password', async () => {
                await new LoginPage(page).performLogin({ username: 'InvalidUser', password: users[roleData.Admin].password });
                await verifyNotification(page, 'User does not exist.');
                const link = page.locator('.forgot p');
                await expect(link).toHaveText('Forgot Username?');
                await link.click();
                await verifyNotification(page, 'For Username & Password Resets contact your site administrator');
            });
        });

        test.describe.serial('Password Reset', () => {

            let tempPassword;

            test.beforeAll(async () => {
                await new LoginPage(page).performLogin({ username: orgConfig.defaultAdmin.userName, password: orgConfig.defaultAdmin.password });
                await verifyNotification(page, 'Welcome');

                await new HomePage(page).handleDeviceCards({ deviceTypes: Language.English.DeviceType, buttonText: Language.English.Select, select: Language.English.DeviceType.APC });
                await page.locator('.menu-ul').getByRole('link', { name: Language.English.Menu.Administrator.Manage }).click();

                await new WebTable(page).handleSelectByDropdown({ label: Language.English['Select By'], select: Language.English.ManagePage.SelectBy.Users['User Name'] });
                await new WebTable(page).fillInputValue({ label: Language.English.ManagePage.SelectBy.Users['User Name'], value: users[roleData.Admin].username });
                await page.getByRole('button', { name: Language.English.Search, exact: true }).click();
                await new WebTable(page).waitForSpinner();

                const rowIndex = await new WebTable(page).findRowIndex({ [Language.English.ManagePage.Label.Users['User Name']]: users[roleData.Admin].username });
                await new WebTable(page).interactWithCell({ label: Language.English.ManagePage.Label.Users['Edit'], hover: "Edit User", buttonState: "enabled", buttonClick: true, row: rowIndex });

                await page.locator('.ant-modal-content button:visible', { hasText: "Generate New Password" }).click();
                const passwordContainer = page.locator('[role="document"] div.ant-typography');
                await passwordContainer.getByRole('button').click();

                tempPassword = (await passwordContainer.textContent()).trim();

                await page.getByRole('button', { name: 'Submit', exact: true }).click();
                await verifyNotification(page, `${users[roleData.Admin].username.toLowerCase()} Updated Successfully!`);

                await new Header(page).logout();
                await page.waitForURL(/.*login/, { timeout: 10000 });
            });

            test('DA_Login_028 : Verify Reset Password Form Validation', async () => {
                await new LoginPage(page).performLogin({ username: users[roleData.Admin].username, password: tempPassword });

                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(1)  p')).toHaveText('Old Password is required');

                await new LoginPage(page).oldPasswordInput.fill(tempPassword);
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(2)  p')).toHaveText('New Password is required');

                await new LoginPage(page).newPasswordInput.fill(users[roleData.Admin].password);
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(3)  p')).toHaveText('Confirm New Password is required');

                await new LoginPage(page).confirmPasswordInput.fill(users[roleData.Admin].password + 'e');
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(3)  p')).toHaveText('Passwords do not match');
            });

            test('DA_Login_029 : Validate New Password Field with All Required Criteria on the Reset Password page', async () => {
                await new LoginPage(page).oldPasswordInput.fill(tempPassword);

                await new LoginPage(page).newPasswordInput.fill('aB1!');
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(2)  p')).toHaveText('Password must be at least 8 characters long');

                await new LoginPage(page).newPasswordInput.fill('aB1!'.repeat(6));
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(2)  p')).toHaveText('Password must not exceed 20 characters');

                await new LoginPage(page).newPasswordInput.fill('ABC12345');
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(2)  p')).toHaveText('Password must contain at least one lowercase, one uppercase, one digit, and any special character');

                await new LoginPage(page).newPasswordInput.fill('abc12345');
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(2)  p')).toHaveText('Password must contain at least one lowercase, one uppercase, one digit, and any special character');

                await new LoginPage(page).newPasswordInput.fill('aBc!@#');
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(2)  p')).toHaveText('Password must be at least 8 characters long');

                await new LoginPage(page).newPasswordInput.fill('aB12345');
                await new LoginPage(page).resetButton.click();
                await expect(page.locator('form > div:nth-child(2)  p')).toHaveText('Password must be at least 8 characters long');
            });

            test('DA_Login_027 : Reset Password Functionality', async () => {
                await new LoginPage(page).resetForm({
                    oldPassword: tempPassword,
                    newPassword: users[roleData.Admin].password,
                    confirmPassword: users[roleData.Admin].password
                });
                await verifyNotification(page, `Password Has Been Reset Successfully`);
            });

        });

        test('DA_Login_030 : Password Masking', async () => {
            await new LoginPage(page).passwordMasking({ username: users[roleData.Admin].username, password: users[roleData.Admin].password });
        });

        test('DA_Login_031 : Verify Login Page Load Time', async ({ request }) => {
            const MAX_TIME_MS = 2000;
            const startTime = Date.now();
            const response = await request.get(`${clientPath}/login`);
            const loadTime = Date.now() - startTime;
            expect(response.status()).toBe(200);
            expect(loadTime, `Server responded in ${loadTime}ms (Limit: ${MAX_TIME_MS}ms)`).toBeLessThan(MAX_TIME_MS);
        });
    });
});

*/
import { Page, Locator } from '@playwright/test';

export class LoginPage {

    readonly page: Page;
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.usernameInput = page.getByPlaceholder('User Name');
        this.passwordInput = page.getByPlaceholder('Password');
        this.loginButton = page.getByRole('button', { name: /login/i });
    }


    async navigate() {
        await this.page.goto('/cGh6aW90/login');
    }


    async login(username: string, password: string) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }


    async verifyLoginPage() {
        await this.page.getByAltText('Phizzle').isVisible();
        await this.page.getByText('User Name').isVisible();
        await this.page.getByLabel('Password').isVisible();
    }
}
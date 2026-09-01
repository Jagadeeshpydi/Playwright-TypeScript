import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('https://122.175.46.149:3009/cGh6aW90/login');
  }

  async login(user: string, pass: string) {
    await this.page.getByPlaceholder('User Name').fill(user);
    await this.page.getByPlaceholder('Password').fill(pass);
    await this.page.getByRole('button', { name: /login/i }).click();
  }
}
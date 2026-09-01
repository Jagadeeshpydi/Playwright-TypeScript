import { test } from '@playwright/test';
import { LoginPage } from '../tests/login';
import dotenv from 'dotenv';

dotenv.config();

test('Login Test', async ({ page }) => {
  const login = new LoginPage(page);

  await login.navigate();
  await login.login(process.env.USERNAME!, process.env.PASSWORD!);
});
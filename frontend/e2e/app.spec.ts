import { test, expect } from '@playwright/test';

test.describe('AI-Powered DevSecOps Security Platform E2E Suite', () => {
  test('Login page renders branding and login controls', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DevSecOps/i);
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Registration page renders input fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });
});

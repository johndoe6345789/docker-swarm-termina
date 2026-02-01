import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/username/i).fill('wronguser');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible({ timeout: 10000 });
  });

  test('should redirect to dashboard on successful login', async ({ page }) => {
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');

    // Click sign in and wait for navigation
    await Promise.all([
      page.waitForURL(/dashboard/, { timeout: 15000 }),
      page.getByRole('button', { name: /sign in/i }).click(),
    ]);

    await expect(page).toHaveURL(/dashboard/);
  });

  test('should have accessible form elements', async ({ page }) => {
    const usernameInput = page.getByLabel(/username/i);
    const passwordInput = page.getByLabel(/password/i);
    const submitButton = page.getByRole('button', { name: /sign in/i });

    await expect(usernameInput).toBeEnabled();
    await expect(passwordInput).toBeEnabled();
    await expect(submitButton).toBeEnabled();
  });
});

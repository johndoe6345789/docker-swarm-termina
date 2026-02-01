import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('should display dashboard header', async ({ page }) => {
    await expect(page.getByText(/docker swarm|containers/i)).toBeVisible();
  });

  test('should have logout functionality', async ({ page }) => {
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should have refresh button', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await expect(refreshButton).toBeVisible();
  });

  test('should display container cards or empty state', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(2000);

    // Either shows containers or empty state
    const hasContainers = await page.locator('[data-testid="container-card"]').count() > 0;
    const hasEmptyState = await page.getByText(/no containers|empty/i).isVisible().catch(() => false);

    expect(hasContainers || hasEmptyState).toBeTruthy();
  });
});

test.describe('Dashboard - Protected Route', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });
});

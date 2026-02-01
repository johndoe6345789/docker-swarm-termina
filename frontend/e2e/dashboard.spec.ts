import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if login form is available
    const usernameInput = page.getByLabel(/username/i);
    const isLoginFormVisible = await usernameInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isLoginFormVisible) {
      test.skip(true, 'Login form not available - backend service may not be running');
    }

    await usernameInput.fill('admin');
    await page.getByLabel(/password/i).fill('admin123');

    // Click sign in and wait for navigation
    await Promise.all([
      page.waitForURL(/dashboard/, { timeout: 15000 }),
      page.getByRole('button', { name: /sign in/i }).click(),
    ]);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
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
    // Go to page first to establish context
    await page.goto('/');

    // Clear any existing auth state
    await page.context().clearCookies();
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch (e) {
        // Ignore if localStorage is not accessible
      }
    });

    // Now try to access dashboard
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });
});

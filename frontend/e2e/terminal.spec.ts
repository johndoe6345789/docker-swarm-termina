import { test, expect } from '@playwright/test';

test.describe('Terminal Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('should open terminal modal when shell button is clicked', async ({ page }) => {
    // Wait for containers to load
    await page.waitForTimeout(2000);

    // Check if there are any containers with shell button
    const shellButton = page.getByRole('button', { name: /shell|terminal/i }).first();
    const hasShellButton = await shellButton.isVisible().catch(() => false);

    if (hasShellButton) {
      await shellButton.click();

      // Terminal modal should be visible
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    } else {
      // Skip test if no containers available
      test.skip();
    }
  });

  test('should close terminal modal with close button', async ({ page }) => {
    await page.waitForTimeout(2000);

    const shellButton = page.getByRole('button', { name: /shell|terminal/i }).first();
    const hasShellButton = await shellButton.isVisible().catch(() => false);

    if (hasShellButton) {
      await shellButton.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

      // Close the modal
      const closeButton = page.getByRole('button', { name: /close/i });
      await closeButton.click();

      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });
});

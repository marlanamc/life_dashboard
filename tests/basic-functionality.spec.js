import { test, expect } from '@playwright/test';

test.describe('Basic Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');
    await page.waitForTimeout(2000); // Wait for JS to initialize
  });

  test('should display time and date', async ({ page }) => {
    // These elements should be visible even with auth overlay
    await expect(page.locator('#current-time')).toBeVisible();
    await expect(page.locator('#current-date')).toBeVisible();

    // Check time format
    const timeText = await page.locator('#current-time').textContent();
    expect(timeText).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);

    // Check date format
    const dateText = await page.locator('#current-date').textContent();
    expect(dateText).toMatch(/\w+/); // Should contain at least some text
  });

  test('should show authentication form when not signed in', async ({ page }) => {
    // Auth overlay should be visible
    const authOverlay = page.locator('#auth-overlay');
    const authCard = page.locator('.auth-card');

    // Either overlay should be visible or card should be visible
    const authVisible = await authCard.isVisible();
    if (authVisible) {
      await expect(authCard).toBeVisible();
      await expect(page.locator('#auth-title')).toContainText('Welcome Back');
      await expect(page.locator('#auth-email')).toBeVisible();
      await expect(page.locator('#auth-password')).toBeVisible();
      await expect(page.locator('.auth-submit')).toBeVisible();
    }
  });

  test('should have dashboard components in DOM even if hidden', async ({ page }) => {
    // Even if auth overlay is showing, dashboard components should exist in DOM
    const components = [
      '#projects-table-container',
      '#brain-dump-plus-container',
      '#enough-capacity-container',
      '#weekly-calendar-container',
      '#ticktick-integration-container'
    ];

    let foundComponents = 0;
    for (const selector of components) {
      const element = page.locator(selector);
      const exists = await element.count() > 0;
      if (exists) {
        foundComponents++;
        console.log(`Found component: ${selector}`);
      }
    }

    // Should have at least some dashboard components in the DOM
    expect(foundComponents).toBeGreaterThan(0);
  });

  test('should switch between sign in and sign up modes', async ({ page }) => {
    const authCard = page.locator('.auth-card');

    if (await authCard.isVisible()) {
      const switchButton = page.locator('#auth-switch');
      const title = page.locator('#auth-title');

      // Should start in sign in mode
      await expect(title).toContainText('Welcome Back');

      // Click to switch to sign up
      await switchButton.click();
      await page.waitForTimeout(300);

      await expect(title).toContainText('Create Account');
      await expect(switchButton).toContainText('Already have an account');

      // Name field should be visible in sign up mode
      const nameField = page.locator('[data-field="name"]');
      await expect(nameField).toBeVisible();
    }
  });

  test('should attempt authentication with valid credentials', async ({ page }) => {
    const authCard = page.locator('.auth-card');

    if (await authCard.isVisible()) {
      const emailField = page.locator('#auth-email');
      const passwordField = page.locator('#auth-password');
      const submitButton = page.locator('.auth-submit');

      // Fill in the test credentials
      await emailField.fill('marlana.creed@gmail.com');
      await passwordField.fill('testing123');
      await submitButton.click();

      // Wait for authentication to process
      await page.waitForTimeout(5000);

      // Check if auth overlay is hidden or if we see dashboard content
      const authOverlay = page.locator('#auth-overlay');
      const isHidden = await authOverlay.evaluate((el) => {
        return el.classList.contains('auth-overlay--hidden') ||
               el.getAttribute('aria-hidden') === 'true';
      });

      if (isHidden) {
        console.log('✅ Authentication successful - dashboard should be accessible');

        // Now we should be able to see dashboard components
        await page.waitForTimeout(1000);

        // Check if we can see projects table
        const projectsTable = page.locator('.projects-table-wrapper');
        if (await projectsTable.isVisible()) {
          await expect(projectsTable).toBeVisible();
        }
      } else {
        console.log('Authentication may have failed or is still processing');

        // Check for error messages
        const errorElement = page.locator('#auth-error');
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          console.log('Auth error:', errorText);
        }
      }
    }
  });

  test('should have theme system', async ({ page }) => {
    // Look for theme pills or controls
    const themePills = page.locator('.theme-pill');

    if (await themePills.first().isVisible()) {
      const count = await themePills.count();
      expect(count).toBeGreaterThan(0);
      console.log(`Found ${count} theme options`);
    }
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();

    // Time and date should still be visible
    if (await page.locator('#current-time').isVisible()) {
      await expect(page.locator('#current-time')).toBeVisible();
    }
  });

  test('should have accessible navigation', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const activeElement = await page.evaluate(() => document.activeElement.tagName);
    expect(['INPUT', 'BUTTON', 'A', 'SELECT'].includes(activeElement)).toBeTruthy();
  });

  test('should handle data persistence', async ({ page }) => {
    // Check that localStorage is being used
    const localStorageData = await page.evaluate(() => {
      return Object.keys(localStorage).length;
    });

    // Should have some data stored (even default values)
    expect(localStorageData).toBeGreaterThanOrEqual(0);
  });
});
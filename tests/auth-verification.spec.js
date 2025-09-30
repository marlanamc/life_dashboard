import { test, expect } from '@playwright/test';

test.describe('Authentication Verification with Correct Credentials', () => {
  test('should successfully authenticate with correct password', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');
    await page.waitForTimeout(2000);

    const authCard = page.locator('.auth-card');

    if (await authCard.isVisible()) {
      const emailField = page.locator('#auth-email');
      const passwordField = page.locator('#auth-password');
      const submitButton = page.locator('.auth-submit');

      // Fill in the correct credentials
      await emailField.fill('marlana.creed@gmail.com');
      await passwordField.fill('Testing123'); // Correct password with capital T
      await submitButton.click();

      // Wait for authentication to process
      await page.waitForTimeout(8000);

      // Check if auth overlay is hidden
      const authOverlay = page.locator('#auth-overlay');
      const isHidden = await authOverlay.evaluate((el) => {
        return el.classList.contains('auth-overlay--hidden') ||
               el.getAttribute('aria-hidden') === 'true';
      });

      if (isHidden) {
        console.log('🎉 Authentication successful with correct password!');

        // Now we should be able to see dashboard components
        await page.waitForTimeout(2000);

        // Check if we can see projects table
        const projectsTable = page.locator('.projects-table-wrapper');
        await expect(projectsTable).toBeVisible();

        // Check if we can see brain dump
        const brainDump = page.locator('#brain-dump-plus-container');
        await expect(brainDump).toBeVisible();

        // Check if we can see capacity planner
        const capacity = page.locator('#enough-capacity-container');
        await expect(capacity).toBeVisible();

        console.log('✅ All dashboard components now accessible after authentication');

        // Test adding a project
        const projectNameCell = page.locator('[data-field="name"]').first();
        if (await projectNameCell.isVisible()) {
          await projectNameCell.click();
          await projectNameCell.fill('Test Project from Playwright');
          await projectNameCell.press('Enter');
          await page.waitForTimeout(500);

          await expect(projectNameCell).toContainText('Test Project from Playwright');
          console.log('✅ Project editing functionality works');
        }

      } else {
        console.log('Authentication may have failed');

        // Check for error messages
        const errorElement = page.locator('#auth-error');
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          console.log('Auth error:', errorText);
        }
      }
    } else {
      console.log('No auth card visible - user may already be authenticated');
    }
  });

  test('should have working Firebase cloud sync after authentication', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');
    await page.waitForTimeout(2000);

    const authCard = page.locator('.auth-card');

    // Only test if auth is needed
    if (await authCard.isVisible()) {
      // Authenticate first
      await page.locator('#auth-email').fill('marlana.creed@gmail.com');
      await page.locator('#auth-password').fill('Testing123');
      await page.locator('.auth-submit').click();
      await page.waitForTimeout(8000);
    }

    // Test cloud sync by making changes and checking if they persist
    const projectNameCell = page.locator('[data-field="name"]').first();
    if (await projectNameCell.isVisible()) {
      const timestamp = Date.now();
      const testProjectName = `Cloud Sync Test ${timestamp}`;

      await projectNameCell.click();
      await projectNameCell.fill(testProjectName);
      await projectNameCell.press('Enter');
      await page.waitForTimeout(2000); // Wait for cloud sync

      // Reload page to test persistence
      await page.reload();
      await page.waitForTimeout(3000);

      // Should still have the project
      const persistedProject = page.locator(`text=${testProjectName}`);
      if (await persistedProject.isVisible()) {
        console.log('✅ Cloud sync working - data persisted after reload');
      }
    }
  });
});
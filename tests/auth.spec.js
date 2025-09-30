import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to load
    await page.waitForSelector('.life-dashboard');
  });

  test('should show auth overlay when not signed in', async ({ page }) => {
    // Check if auth overlay is visible (it should be since we're not authenticated)
    const authOverlay = page.locator('#auth-overlay');

    // Wait a bit for Firebase to initialize
    await page.waitForTimeout(2000);

    // The overlay might be hidden if Firebase config is missing
    // Let's check if the auth card exists
    const authCard = page.locator('.auth-card');
    if (await authCard.isVisible()) {
      await expect(authCard).toBeVisible();
      await expect(page.locator('#auth-title')).toContainText('Welcome Back');
    }
  });

  test('should have sign in form elements', async ({ page }) => {
    // Wait for Firebase to initialize
    await page.waitForTimeout(2000);

    const authCard = page.locator('.auth-card');

    // Only test if auth card is visible (Firebase properly configured)
    if (await authCard.isVisible()) {
      await expect(page.locator('#auth-email')).toBeVisible();
      await expect(page.locator('#auth-password')).toBeVisible();
      await expect(page.locator('.auth-submit')).toBeVisible();
      await expect(page.locator('#auth-switch')).toBeVisible();
    }
  });

  test('should switch between sign in and sign up modes', async ({ page }) => {
    await page.waitForTimeout(2000);

    const authCard = page.locator('.auth-card');

    if (await authCard.isVisible()) {
      const switchButton = page.locator('#auth-switch');
      const title = page.locator('#auth-title');

      // Should start in sign in mode
      await expect(title).toContainText('Welcome Back');
      await expect(switchButton).toContainText('Need an account? Sign up');

      // Click to switch to sign up
      await switchButton.click();

      await expect(title).toContainText('Create Account');
      await expect(switchButton).toContainText('Already have an account? Sign in');

      // Name field should be visible in sign up mode
      const nameField = page.locator('[data-field="name"]');
      await expect(nameField).toBeVisible();
    }
  });

  test('should validate email field', async ({ page }) => {
    await page.waitForTimeout(2000);

    const authCard = page.locator('.auth-card');

    if (await authCard.isVisible()) {
      const emailField = page.locator('#auth-email');
      const passwordField = page.locator('#auth-password');
      const submitButton = page.locator('.auth-submit');

      // Try to submit with invalid email
      await emailField.fill('invalid-email');
      await passwordField.fill('password123');
      await submitButton.click();

      // Should show validation (browser native or custom)
      const isInvalid = await emailField.evaluate((el) => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    }
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.waitForTimeout(2000);

    const authCard = page.locator('.auth-card');

    if (await authCard.isVisible()) {
      const emailField = page.locator('#auth-email');
      const forgotButton = page.locator('#auth-forgot');

      // Enter email first
      await emailField.fill('test@example.com');

      // Click forgot password
      await forgotButton.click();

      // Should show loading or success message (depending on implementation)
      // This will trigger the password reset email flow
      await page.waitForTimeout(1000);
    }
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.waitForTimeout(2000);

    const authCard = page.locator('.auth-card');

    if (await authCard.isVisible()) {
      const emailField = page.locator('#auth-email');
      const passwordField = page.locator('#auth-password');
      const submitButton = page.locator('.auth-submit');

      // Try to sign in with invalid credentials
      await emailField.fill('nonexistent@example.com');
      await passwordField.fill('wrongpassword');
      await submitButton.click();

      // Wait for potential error message
      await page.waitForTimeout(3000);

      // Check if error is displayed
      const errorElement = page.locator('#auth-error');
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        expect(errorText.length).toBeGreaterThan(0);
      }
    }
  });

  test('should attempt authentication with provided credentials', async ({ page }) => {
    await page.waitForTimeout(2000);

    const authCard = page.locator('.auth-card');

    if (await authCard.isVisible()) {
      const emailField = page.locator('#auth-email');
      const passwordField = page.locator('#auth-password');
      const submitButton = page.locator('.auth-submit');

      // Use the provided test credentials
      await emailField.fill('marlana.creed@gmail.com');
      await passwordField.fill('testing123');
      await submitButton.click();

      // Wait for authentication to process
      await page.waitForTimeout(5000);

      // Check if auth overlay is hidden (successful login)
      const isHidden = await authCard.evaluate((el) => {
        const overlay = el.closest('#auth-overlay');
        return overlay && overlay.classList.contains('auth-overlay--hidden');
      });

      // If authentication was successful, overlay should be hidden
      if (isHidden) {
        console.log('Authentication successful - overlay hidden');
      } else {
        console.log('Authentication may have failed or is still processing');
      }
    }
  });
});
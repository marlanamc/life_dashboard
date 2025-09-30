import { test, expect } from '@playwright/test';

test.describe('Life Dashboard Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the dashboard to load
    await page.waitForSelector('.life-dashboard');
  });

  test('should load the main dashboard', async ({ page }) => {
    // Check if main dashboard elements are present
    await expect(page.locator('.life-dashboard')).toBeVisible();
    await expect(page.locator('.greeting-section')).toBeVisible();
    await expect(page.locator('#current-time')).toBeVisible();
    await expect(page.locator('#current-date')).toBeVisible();
  });

  test('should display welcome section with greeting', async ({ page }) => {
    // Check greeting text is displayed
    const greeting = page.locator('.greeting h2');
    await expect(greeting).toBeVisible();

    // Should show appropriate greeting based on time
    const greetingText = await greeting.textContent();
    expect(greetingText).toMatch(/(Good morning|Good afternoon|Good evening)/);
  });

  test('should show current time and date', async ({ page }) => {
    const timeElement = page.locator('#current-time');
    const dateElement = page.locator('#current-date');

    await expect(timeElement).toBeVisible();
    await expect(dateElement).toBeVisible();

    // Time should be in format like "10:30 AM"
    const timeText = await timeElement.textContent();
    expect(timeText).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);

    // Date should contain day and month
    const dateText = await dateElement.textContent();
    expect(dateText).toMatch(/\w+,\s+\w+\s+\d{1,2},\s+\d{4}/);
  });

  test('should load projects table', async ({ page }) => {
    const projectsTable = page.locator('.projects-table-wrapper');
    await expect(projectsTable).toBeVisible();

    // Should have table headers
    await expect(page.locator('text=Project')).toBeVisible();
    await expect(page.locator('text=Priority')).toBeVisible();
    await expect(page.locator('text=Category')).toBeVisible();
  });

  test('should load brain dump section', async ({ page }) => {
    const brainDump = page.locator('#brain-dump-plus-container');
    await expect(brainDump).toBeVisible();
  });

  test('should load capacity planner', async ({ page }) => {
    const capacitySection = page.locator('#enough-capacity-container');
    await expect(capacitySection).toBeVisible();
  });

  test('should have theme controller', async ({ page }) => {
    // Check if theme pills are present
    const themePills = page.locator('.theme-pill');
    await expect(themePills.first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Main dashboard should still be visible
    await expect(page.locator('.life-dashboard')).toBeVisible();

    // Check if mobile styles are applied
    const dashboard = page.locator('.life-dashboard');
    const styles = await dashboard.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        flexDirection: computed.flexDirection,
      };
    });

    // Should maintain proper layout
    expect(styles.display).toBe('block');
  });
});
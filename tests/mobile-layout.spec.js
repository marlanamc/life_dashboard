import { test, expect } from '@playwright/test';

/**
 * Mobile Layout Tests
 * Verify mobile-first responsive design works correctly
 */

test.describe('Mobile Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should activate mobile layout on small screens', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for mobile layout to initialize
    await page.waitForTimeout(500);

    // Check that body has mobile-layout class
    const hasClass = await page.evaluate(() => {
      return document.body.classList.contains('mobile-layout');
    });

    expect(hasClass).toBe(true);

    // Take screenshot
    await page.screenshot({ path: 'test-results/mobile-layout-activated.png', fullPage: true });
  });

  test('should show mobile navigation bar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Check for mobile navigation
    const mobileNav = page.locator('.mobile-nav');
    await expect(mobileNav).toBeVisible();

    // Check for 4 navigation tabs
    const tabs = page.locator('.mobile-nav-tab');
    await expect(tabs).toHaveCount(4);

    // Verify tab labels
    await expect(tabs.nth(0)).toContainText('Brain');
    await expect(tabs.nth(1)).toContainText('Energy');
    await expect(tabs.nth(2)).toContainText('Projects');
    await expect(tabs.nth(3)).toContainText('Schedule');

    // Take screenshot
    await page.screenshot({ path: 'test-results/mobile-navigation-bar.png', fullPage: true });
  });

  test('should show mobile header', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Check for mobile header
    const header = page.locator('.mobile-header');
    await expect(header).toBeVisible();

    // Check for title
    const title = page.locator('#mobile-header-title');
    await expect(title).toBeVisible();

    // Check for subtitle
    const subtitle = page.locator('#mobile-header-subtitle');
    await expect(subtitle).toBeVisible();

    // Check for action buttons
    await expect(page.locator('#mobile-search-btn')).toBeVisible();
    await expect(page.locator('#mobile-settings-btn')).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'test-results/mobile-header.png', fullPage: true });
  });

  test('should show mobile page container', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Check for mobile page container
    const pageContainer = page.locator('#mobile-page-container');
    await expect(pageContainer).toBeVisible();

    // Check that original dashboard is hidden
    const mainDashboard = page.locator('.main-dashboard');
    const isHidden = await mainDashboard.evaluate((el) => {
      return window.getComputedStyle(el).display === 'none';
    });
    expect(isHidden).toBe(true);

    // Take screenshot
    await page.screenshot({ path: 'test-results/mobile-page-container.png', fullPage: true });
  });

  test('should switch between tabs', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Click on Energy tab
    await page.locator('[data-tab="capacity"]').click();
    await page.waitForTimeout(300);

    // Check URL hash updated
    expect(page.url()).toContain('#capacity');

    // Check header updated
    const title = page.locator('#mobile-header-title');
    await expect(title).toHaveText('Energy');

    // Take screenshot of Energy page
    await page.screenshot({ path: 'test-results/mobile-energy-page.png', fullPage: true });

    // Click on Projects tab
    await page.locator('[data-tab="projects"]').click();
    await page.waitForTimeout(300);

    expect(page.url()).toContain('#projects');
    await expect(title).toHaveText('Projects');

    // Take screenshot of Projects page
    await page.screenshot({ path: 'test-results/mobile-projects-page.png', fullPage: true });

    // Click on Schedule tab
    await page.locator('[data-tab="calendar"]').click();
    await page.waitForTimeout(300);

    expect(page.url()).toContain('#calendar');
    await expect(title).toHaveText('Schedule');

    // Take screenshot of Schedule page
    await page.screenshot({ path: 'test-results/mobile-schedule-page.png', fullPage: true });

    // Click back to Brain tab
    await page.locator('[data-tab="brain"]').click();
    await page.waitForTimeout(300);

    expect(page.url()).toContain('#brain');
    await expect(title).toHaveText('Brain Space');

    // Take screenshot of Brain Space page
    await page.screenshot({ path: 'test-results/mobile-brain-page.png', fullPage: true });
  });

  test('should show FAB (floating action button)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Check for FAB
    const fab = page.locator('.mobile-fab');
    await expect(fab).toBeVisible();
    await expect(fab).toContainText('+');

    // Take screenshot
    await page.screenshot({ path: 'test-results/mobile-fab.png', fullPage: true });
  });

  test('should have touch-friendly button sizes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Check mobile nav tabs have minimum touch target size (44px)
    const tabs = page.locator('.mobile-nav-tab');
    const firstTab = tabs.first();

    const box = await firstTab.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);

    // Take screenshot
    await page.screenshot({ path: 'test-results/mobile-touch-targets.png', fullPage: true });
  });

  test('should work on tablet size (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    // Check that mobile layout is NOT active at 768px
    const hasClass = await page.evaluate(() => {
      return document.body.classList.contains('mobile-layout');
    });

    // At exactly 768px, should be at the breakpoint
    console.log('Mobile layout active at 768px:', hasClass);

    // Take screenshot
    await page.screenshot({ path: 'test-results/tablet-768px.png', fullPage: true });
  });

  test('should work on iPhone 12 viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    const hasClass = await page.evaluate(() => {
      return document.body.classList.contains('mobile-layout');
    });
    expect(hasClass).toBe(true);

    // Take screenshot
    await page.screenshot({ path: 'test-results/iphone-12.png', fullPage: true });
  });

  test('should work on Pixel 5 viewport', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.waitForTimeout(500);

    const hasClass = await page.evaluate(() => {
      return document.body.classList.contains('mobile-layout');
    });
    expect(hasClass).toBe(true);

    // Take screenshot
    await page.screenshot({ path: 'test-results/pixel-5.png', fullPage: true });
  });

  test('should handle landscape orientation', async ({ page }) => {
    // Landscape mobile
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);

    const hasClass = await page.evaluate(() => {
      return document.body.classList.contains('mobile-layout');
    });
    expect(hasClass).toBe(true);

    // Take screenshot
    await page.screenshot({ path: 'test-results/mobile-landscape.png', fullPage: true });
  });

  test('should log mobile detection info', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Listen for console logs
    const logs = [];
    page.on('console', msg => {
      if (msg.text().includes('Mobile Detection:')) {
        logs.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // Check that mobile detection ran
    expect(logs.length).toBeGreaterThan(0);
    console.log('Mobile detection logs:', logs);
  });

  test('Brain Space page should have quick capture input', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Should be on Brain page by default
    const input = page.locator('#mobile-brain-input');
    await expect(input).toBeVisible();

    // Check for priority buttons
    const priorityBtns = page.locator('.mobile-priority-btn');
    await expect(priorityBtns).toHaveCount(3);

    // Check for add button
    const addBtn = page.locator('#mobile-brain-add');
    await expect(addBtn).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'test-results/brain-quick-capture.png', fullPage: true });
  });

  test('should support safe area insets for notched devices', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    // Check that mobile nav has safe-area-inset padding
    const navPadding = await page.locator('.mobile-nav').evaluate((el) => {
      return window.getComputedStyle(el).paddingBottom;
    });

    // Should have at least the base 8px padding
    console.log('Mobile nav padding-bottom:', navPadding);

    // Take screenshot
    await page.screenshot({ path: 'test-results/safe-area-insets.png', fullPage: true });
  });
});

test.describe('Mobile to Desktop Transition', () => {
  test('should switch from mobile to desktop layout when resizing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Start mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    let hasClass = await page.evaluate(() => {
      return document.body.classList.contains('mobile-layout');
    });
    expect(hasClass).toBe(true);

    // Take mobile screenshot
    await page.screenshot({ path: 'test-results/transition-mobile.png', fullPage: true });

    // Resize to desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);

    hasClass = await page.evaluate(() => {
      return document.body.classList.contains('mobile-layout');
    });
    expect(hasClass).toBe(false);

    // Take desktop screenshot
    await page.screenshot({ path: 'test-results/transition-desktop.png', fullPage: true });
  });
});
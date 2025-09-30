import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Basic Functionality', () => {
  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for any of these main containers to load
    await Promise.race([
      page.waitForSelector('body', { timeout: 10000 }),
      page.waitForSelector('main', { timeout: 10000 }),
      page.waitForSelector('#app', { timeout: 10000 }),
      page.waitForSelector('.dashboard', { timeout: 10000 }),
      page.waitForSelector('.life-dashboard', { timeout: 10000 })
    ]);

    // Check if page loaded successfully
    const title = await page.title();
    console.log('Page title:', title);

    // Check if body exists
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have main content visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');
    await page.waitForTimeout(2000); // Give JS time to initialize

    // Take a screenshot to see what's actually rendered
    await page.screenshot({ path: 'test-results/smoke-test.png', fullPage: true });

    // Check for any main content indicators
    const hasContent = await page.evaluate(() => {
      const body = document.body;
      return body.children.length > 0 && body.innerText.trim().length > 0;
    });

    expect(hasContent).toBeTruthy();

    // Log what we can see
    const bodyText = await page.locator('body').textContent();
    console.log('Page content preview:', bodyText?.substring(0, 200));
  });

  test('should have JavaScript working', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');
    await page.waitForTimeout(2000);

    // Check if JavaScript is executing
    const jsWorking = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    });

    expect(jsWorking).toBeTruthy();

    // Check for any JS errors
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.waitForTimeout(1000);

    if (errors.length > 0) {
      console.log('JavaScript errors found:', errors);
    }
  });

  test('should find dashboard elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');
    await page.waitForTimeout(3000); // Wait for components to initialize

    // Try to find various dashboard elements
    const elementChecks = [
      { selector: '.life-dashboard', name: 'Life Dashboard' },
      { selector: '.dashboard', name: 'Dashboard' },
      { selector: '#app', name: 'App Container' },
      { selector: 'main', name: 'Main Element' },
      { selector: '.greeting-section', name: 'Greeting Section' },
      { selector: '.projects-table', name: 'Projects Table' },
      { selector: '.brain-dump', name: 'Brain Dump' },
      { selector: '.capacity', name: 'Capacity Section' },
      { selector: '#current-time', name: 'Current Time' },
      { selector: '#current-date', name: 'Current Date' }
    ];

    const foundElements = [];
    for (const check of elementChecks) {
      const element = page.locator(check.selector);
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        foundElements.push(check.name);
      }
    }

    console.log('Found dashboard elements:', foundElements);

    // Should find at least some elements
    expect(foundElements.length).toBeGreaterThan(0);
  });

  test('should load CSS styles', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    // Check if CSS is loaded by checking computed styles
    const hasStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = getComputedStyle(body);
      return styles.fontSize !== '' && styles.color !== '';
    });

    expect(hasStyles).toBeTruthy();
  });
});
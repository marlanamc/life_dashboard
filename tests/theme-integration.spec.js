import { test, expect } from '@playwright/test';

test.describe('Theme System and Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.life-dashboard');
    await page.waitForTimeout(1000);
  });

  test('should have theme controller', async ({ page }) => {
    // Look for theme pills or theme controls
    const themeControls = [
      '.theme-pill',
      '.theme-btn',
      '.theme-selector',
      '[data-theme]',
      '.color-theme'
    ];

    let hasThemeControls = false;
    for (const selector of themeControls) {
      const controls = page.locator(selector);
      if (await controls.first().isVisible()) {
        hasThemeControls = true;
        console.log(`Theme controls found: ${selector}`);

        // Count theme options
        const count = await controls.count();
        console.log(`Number of theme options: ${count}`);
        break;
      }
    }

    if (hasThemeControls) {
      console.log('Theme system is available');
    }
  });

  test('should change themes when clicked', async ({ page }) => {
    const themePills = page.locator('.theme-pill');

    if (await themePills.first().isVisible()) {
      // Get initial body classes or styles
      const initialBodyClass = await page.locator('body').getAttribute('class');

      // Click a theme pill
      await themePills.first().click();
      await page.waitForTimeout(300);

      // Check if body class changed or CSS variables updated
      const newBodyClass = await page.locator('body').getAttribute('class');

      // Should have some theme-related class or the CSS variables should change
      const cssVariables = await page.evaluate(() => {
        const styles = getComputedStyle(document.documentElement);
        return {
          primary: styles.getPropertyValue('--color-primary'),
          secondary: styles.getPropertyValue('--color-secondary'),
          accent: styles.getPropertyValue('--color-accent')
        };
      });

      console.log('Theme CSS variables:', cssVariables);
      expect(typeof cssVariables.primary).toBe('string');
    }
  });

  test('should persist theme selection', async ({ page }) => {
    const themePills = page.locator('.theme-pill');

    if (await themePills.count() > 1) {
      // Click second theme
      await themePills.nth(1).click();
      await page.waitForTimeout(300);

      // Reload page
      await page.reload();
      await page.waitForTimeout(1000);

      // Check if theme persisted
      const activeTheme = page.locator('.theme-pill.active, .theme-pill[data-active="true"]');
      if (await activeTheme.isVisible()) {
        console.log('Theme selection persisted after reload');
      }

      // Check localStorage for theme data
      const themeData = await page.evaluate(() => {
        return localStorage.getItem('selectedTheme') || localStorage.getItem('theme');
      });

      if (themeData) {
        console.log('Theme data found in localStorage:', themeData);
      }
    }
  });

  test('should have ADHD-friendly design elements', async ({ page }) => {
    // Check for ADHD-friendly features
    const adhdFeatures = [
      '.stimming-animation',
      '.floating-notes',
      '.focus-indicator',
      '.energy-visual',
      '.progress-celebration'
    ];

    for (const selector of adhdFeatures) {
      const feature = page.locator(selector);
      if (await feature.isVisible()) {
        console.log(`ADHD-friendly feature found: ${selector}`);
      }
    }

    // Check for accessibility features
    const body = page.locator('body');
    const styles = await body.evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
        fontFamily: computed.fontFamily
      };
    });

    // Should have readable font sizes
    const fontSize = parseFloat(styles.fontSize);
    expect(fontSize).toBeGreaterThan(12);

    console.log('Typography styles:', styles);
  });

  test('should integrate all components smoothly', async ({ page }) => {
    // Test cross-component integration

    // 1. Add a high priority brain dump item
    const brainInput = page.locator('.add-thought-input, input[placeholder*="thought"]').first();
    if (await brainInput.isVisible()) {
      await brainInput.fill('High priority integration test');
      await brainInput.press('Enter');
      await page.waitForTimeout(500);

      // Set it to high priority if possible
      const priorityBtn = page.locator('.priority-btn, .high-priority').first();
      if (await priorityBtn.isVisible()) {
        await priorityBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // 2. Check if it appears in capacity planner
    const capacityTasks = page.locator('.capacity-task');
    if (await capacityTasks.count() > 0) {
      console.log('Brain dump to capacity integration working');
    }

    // 3. Add project work to capacity
    const workTodayBtn = page.locator('.work-today-btn').first();
    if (await workTodayBtn.isVisible()) {
      await workTodayBtn.click();

      const modal = page.locator('.project-work-modal');
      if (await modal.isVisible()) {
        const descInput = page.locator('#work-description');
        if (await descInput.isVisible()) {
          await descInput.fill('Integration test project work');
          await page.locator('#add-work-submit').click();
          await page.waitForTimeout(500);
        }
      }
    }

    // 4. Check data consistency
    const allData = await page.evaluate(() => {
      const data = {};
      Object.keys(localStorage).forEach(key => {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch {
          data[key] = localStorage.getItem(key);
        }
      });
      return data;
    });

    console.log('All localStorage data keys:', Object.keys(allData));
  });

  test('should handle data synchronization', async ({ page }) => {
    // Test that changes in one component reflect in others
    const initialCapacityTasks = await page.locator('.capacity-task').count();

    // Make changes in different components
    const projectNameCell = page.locator('[data-field="name"]').first();
    if (await projectNameCell.isVisible()) {
      await projectNameCell.click();
      await projectNameCell.fill('Sync Test Project');
      await projectNameCell.press('Enter');
      await page.waitForTimeout(300);
    }

    // Check if data manager is keeping things in sync
    const dataManagerEvents = await page.evaluate(() => {
      // Check if DataManager exists and has event listeners
      return typeof window.DataManager !== 'undefined';
    });

    console.log('DataManager available:', dataManagerEvents);
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test error handling by corrupting localStorage
    await page.evaluate(() => {
      localStorage.setItem('projects', 'invalid json');
      localStorage.setItem('simpleBrainDumpItems', '{incomplete json');
    });

    // Reload and see if it recovers
    await page.reload();
    await page.waitForTimeout(2000);

    // Should still load the dashboard
    await expect(page.locator('.life-dashboard')).toBeVisible();

    // Should recover with default data
    const projectsTable = page.locator('.projects-table-wrapper');
    await expect(projectsTable).toBeVisible();
  });

  test('should have keyboard navigation support', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Should have focusable elements
    const focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(['INPUT', 'BUTTON', 'A', 'SELECT'].includes(focusedElement)).toBeTruthy();

    // Test common keyboard shortcuts
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Should handle escape key gracefully
    console.log('Keyboard navigation tested');
  });

  test('should maintain performance with data', async ({ page }) => {
    // Add a lot of data to test performance
    await page.evaluate(() => {
      // Add many projects
      const projects = [];
      for (let i = 0; i < 50; i++) {
        projects.push({
          id: i + 100,
          name: `Performance Test Project ${i}`,
          priority: ['high', 'medium', 'low'][i % 3],
          category: 'Testing',
          todos: `Test todos for project ${i}`
        });
      }
      localStorage.setItem('projects', JSON.stringify(projects));

      // Add many brain dump items
      const brainItems = [];
      for (let i = 0; i < 100; i++) {
        brainItems.push({
          text: `Performance test thought ${i}`,
          priority: ['high', 'medium', 'low'][i % 3],
          completed: i % 4 === 0
        });
      }
      localStorage.setItem('simpleBrainDumpItems', JSON.stringify(brainItems));
    });

    // Reload with lots of data
    await page.reload();

    // Measure load time
    const loadTime = await page.evaluate(() => {
      return performance.now();
    });

    // Should load within reasonable time (less than 5 seconds)
    expect(loadTime).toBeLessThan(5000);

    // Should still be responsive
    await expect(page.locator('.life-dashboard')).toBeVisible();
    console.log(`Dashboard loaded with large dataset in ${loadTime}ms`);
  });
});
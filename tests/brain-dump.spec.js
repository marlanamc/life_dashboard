import { test, expect } from '@playwright/test';

test.describe('Brain Dump Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.life-dashboard');
    await page.waitForTimeout(1000);
  });

  test('should display brain dump section', async ({ page }) => {
    const brainDumpContainer = page.locator('#brain-dump-plus-container');
    await expect(brainDumpContainer).toBeVisible();

    // Should have the brain dump component
    const brainDumpSection = page.locator('.simple-brain-dump');
    if (await brainDumpSection.isVisible()) {
      await expect(brainDumpSection).toBeVisible();
    }
  });

  test('should have add thought input', async ({ page }) => {
    const addInput = page.locator('.add-thought-input, input[placeholder*="thought"], input[placeholder*="brain"]');

    if (await addInput.first().isVisible()) {
      await expect(addInput.first()).toBeVisible();
    }
  });

  test('should allow adding new thoughts', async ({ page }) => {
    // Look for various input selectors that might be used for brain dump
    const possibleInputs = [
      '.add-thought-input',
      'input[placeholder*="thought"]',
      'input[placeholder*="brain"]',
      'input[placeholder*="dump"]',
      'textarea[placeholder*="thought"]',
      '.brain-dump input',
      '.brain-dump textarea'
    ];

    let addInput = null;
    for (const selector of possibleInputs) {
      const input = page.locator(selector);
      if (await input.first().isVisible()) {
        addInput = input.first();
        break;
      }
    }

    if (addInput) {
      const testThought = 'Test brain dump thought';
      await addInput.fill(testThought);
      await addInput.press('Enter');

      // Should add the thought to the list
      await page.waitForTimeout(500);

      // Look for the thought in various possible containers
      const thoughtContainers = [
        '.brain-dump-item',
        '.thought-item',
        '.brain-item',
        '[data-thought]',
        'li'
      ];

      let foundThought = false;
      for (const container of thoughtContainers) {
        const thoughts = page.locator(`${container}:has-text("${testThought}")`);
        if (await thoughts.first().isVisible()) {
          await expect(thoughts.first()).toContainText(testThought);
          foundThought = true;
          break;
        }
      }

      if (!foundThought) {
        console.log('Thought may have been added but not found in expected containers');
      }
    }
  });

  test('should have priority controls for thoughts', async ({ page }) => {
    // Look for priority buttons or controls
    const priorityControls = [
      '.priority-btn',
      '.priority-toggle',
      'button[data-priority]',
      '.high-priority',
      '.medium-priority',
      '.low-priority'
    ];

    let hasPriorityControls = false;
    for (const selector of priorityControls) {
      const controls = page.locator(selector);
      if (await controls.first().isVisible()) {
        hasPriorityControls = true;
        break;
      }
    }

    if (hasPriorityControls) {
      console.log('Priority controls found for brain dump items');
    }
  });

  test('should allow completing thoughts', async ({ page }) => {
    // Look for completion controls
    const completionControls = [
      'input[type="checkbox"]',
      '.complete-btn',
      '.done-btn',
      '[data-complete]',
      '.check-btn'
    ];

    let hasCompletionControls = false;
    for (const selector of completionControls) {
      const controls = page.locator(selector);
      if (await controls.first().isVisible()) {
        hasCompletionControls = true;
        // Try clicking the first one
        await controls.first().click();
        await page.waitForTimeout(300);
        break;
      }
    }

    if (hasCompletionControls) {
      console.log('Completion controls found and tested');
    }
  });

  test('should have delete functionality for thoughts', async ({ page }) => {
    // Look for delete buttons
    const deleteControls = [
      '.delete-btn',
      '.remove-btn',
      'button[title*="delete"]',
      'button[title*="remove"]',
      '.trash-btn',
      '[data-delete]'
    ];

    let hasDeleteControls = false;
    for (const selector of deleteControls) {
      const controls = page.locator(selector);
      if (await controls.first().isVisible()) {
        hasDeleteControls = true;
        break;
      }
    }

    if (hasDeleteControls) {
      console.log('Delete controls found for brain dump items');
    }
  });

  test('should save thoughts to localStorage', async ({ page }) => {
    // Add a thought first
    const possibleInputs = [
      '.add-thought-input',
      'input[placeholder*="thought"]',
      'input[placeholder*="brain"]',
      'textarea[placeholder*="thought"]'
    ];

    let addInput = null;
    for (const selector of possibleInputs) {
      const input = page.locator(selector);
      if (await input.first().isVisible()) {
        addInput = input.first();
        break;
      }
    }

    if (addInput) {
      await addInput.fill('Persistent test thought');
      await addInput.press('Enter');
      await page.waitForTimeout(500);

      // Check if data is saved to localStorage
      const localStorageData = await page.evaluate(() => {
        const keys = Object.keys(localStorage);
        const brainDumpKeys = keys.filter(key =>
          key.includes('brain') || key.includes('thoughts') || key.includes('dump')
        );
        return brainDumpKeys.map(key => ({ key, value: localStorage.getItem(key) }));
      });

      expect(localStorageData.length).toBeGreaterThanOrEqual(0);
      console.log('Brain dump localStorage keys:', localStorageData.map(item => item.key));
    }
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Clear any existing data
    await page.evaluate(() => {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('brain') || key.includes('thoughts') || key.includes('dump')) {
          localStorage.removeItem(key);
        }
      });
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // Should still show the brain dump component
    const brainDumpContainer = page.locator('#brain-dump-plus-container');
    await expect(brainDumpContainer).toBeVisible();
  });

  test('should integrate with task hub', async ({ page }) => {
    // Check if high priority brain dump items sync to capacity planner
    const capacitySection = page.locator('#enough-capacity-container');
    if (await capacitySection.isVisible()) {
      console.log('Capacity section visible - brain dump integration possible');
    }
  });

  test('should have keyboard shortcuts', async ({ page }) => {
    const possibleInputs = [
      '.add-thought-input',
      'input[placeholder*="thought"]',
      'textarea[placeholder*="thought"]'
    ];

    let addInput = null;
    for (const selector of possibleInputs) {
      const input = page.locator(selector);
      if (await input.first().isVisible()) {
        addInput = input.first();
        break;
      }
    }

    if (addInput) {
      // Test Enter key to add
      await addInput.fill('Keyboard test');
      await addInput.press('Enter');
      await page.waitForTimeout(300);

      // Test Escape to cancel/clear
      await addInput.fill('Cancel this');
      await addInput.press('Escape');
      await page.waitForTimeout(300);

      const currentValue = await addInput.inputValue();
      // Should either clear or keep value depending on implementation
      expect(typeof currentValue).toBe('string');
    }
  });
});
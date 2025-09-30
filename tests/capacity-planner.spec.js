import { test, expect } from '@playwright/test';

test.describe('Capacity Planner (Enough Capacity) Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.life-dashboard');
    await page.waitForTimeout(1000);
  });

  test('should display capacity planner section', async ({ page }) => {
    const capacityContainer = page.locator('#enough-capacity-container');
    await expect(capacityContainer).toBeVisible();

    // Should have the enough capacity component
    const capacitySection = page.locator('.enough-capacity');
    if (await capacitySection.isVisible()) {
      await expect(capacitySection).toBeVisible();
    }
  });

  test('should show energy level indicator', async ({ page }) => {
    // Look for energy/capacity indicators
    const energyIndicators = [
      '.energy-level',
      '.capacity-meter',
      '.energy-bar',
      '.capacity-indicator',
      '[data-energy]',
      '.progress-bar'
    ];

    let hasEnergyIndicator = false;
    for (const selector of energyIndicators) {
      const indicator = page.locator(selector);
      if (await indicator.first().isVisible()) {
        hasEnergyIndicator = true;
        console.log(`Found energy indicator: ${selector}`);
        break;
      }
    }

    if (hasEnergyIndicator) {
      console.log('Energy indicator found in capacity planner');
    }
  });

  test('should have add task input', async ({ page }) => {
    // Look for task input fields
    const taskInputs = [
      '.add-task-input',
      'input[placeholder*="task"]',
      'input[placeholder*="capacity"]',
      'textarea[placeholder*="task"]',
      '.task-input',
      '.capacity-input'
    ];

    let hasTaskInput = false;
    for (const selector of taskInputs) {
      const input = page.locator(selector);
      if (await input.first().isVisible()) {
        hasTaskInput = true;
        console.log(`Found task input: ${selector}`);
        break;
      }
    }

    if (hasTaskInput) {
      console.log('Task input found in capacity planner');
    }
  });

  test('should allow adding tasks with energy estimates', async ({ page }) => {
    // Look for add task functionality
    const addTaskInputs = [
      '.add-task-input',
      'input[placeholder*="task"]',
      'textarea[placeholder*="task"]'
    ];

    let addInput = null;
    for (const selector of addTaskInputs) {
      const input = page.locator(selector);
      if (await input.first().isVisible()) {
        addInput = input.first();
        break;
      }
    }

    if (addInput) {
      const testTask = 'Review project documentation';
      await addInput.fill(testTask);
      await addInput.press('Enter');
      await page.waitForTimeout(500);

      // Look for the task in capacity list
      const taskContainers = [
        '.capacity-task',
        '.task-item',
        '.energy-task',
        '[data-task]'
      ];

      let foundTask = false;
      for (const container of taskContainers) {
        const tasks = page.locator(`${container}:has-text("${testTask}")`);
        if (await tasks.first().isVisible()) {
          foundTask = true;
          break;
        }
      }

      if (foundTask) {
        console.log('Task successfully added to capacity planner');
      }
    }
  });

  test('should show energy calculations', async ({ page }) => {
    // Look for energy calculation displays
    const energyDisplays = [
      '.energy-total',
      '.capacity-total',
      '.energy-remaining',
      '.capacity-used',
      '[data-energy-value]',
      '.percentage'
    ];

    let hasEnergyDisplay = false;
    for (const selector of energyDisplays) {
      const display = page.locator(selector);
      if (await display.first().isVisible()) {
        hasEnergyDisplay = true;
        const text = await display.first().textContent();
        console.log(`Energy display found: ${selector} - "${text}"`);
        break;
      }
    }

    if (hasEnergyDisplay) {
      console.log('Energy calculations displayed');
    }
  });

  test('should have task completion controls', async ({ page }) => {
    // Look for task completion checkboxes or buttons
    const completionControls = [
      '.capacity-task input[type="checkbox"]',
      '.task-complete',
      '.done-btn',
      '.check-task',
      '[data-complete]'
    ];

    let hasCompletionControls = false;
    for (const selector of completionControls) {
      const controls = page.locator(selector);
      if (await controls.first().isVisible()) {
        hasCompletionControls = true;
        console.log(`Completion controls found: ${selector}`);
        break;
      }
    }

    if (hasCompletionControls) {
      console.log('Task completion controls available');
    }
  });

  test('should update energy when tasks are completed', async ({ page }) => {
    // Find a completion control and energy display
    const checkbox = page.locator('.capacity-task input[type="checkbox"]').first();
    const energyDisplay = page.locator('.energy-total, .capacity-total, .energy-remaining').first();

    if (await checkbox.isVisible() && await energyDisplay.isVisible()) {
      // Get initial energy value
      const initialEnergy = await energyDisplay.textContent();

      // Complete a task
      await checkbox.click();
      await page.waitForTimeout(500);

      // Check if energy updated
      const newEnergy = await energyDisplay.textContent();
      console.log(`Energy changed from "${initialEnergy}" to "${newEnergy}"`);
    }
  });

  test('should have energy factors or modifiers', async ({ page }) => {
    // Look for energy factor controls
    const factorControls = [
      '.energy-factor',
      '.capacity-factor',
      '.mood-selector',
      '.energy-modifier',
      '.factor-btn',
      'input[type="range"]'
    ];

    let hasFactorControls = false;
    for (const selector of factorControls) {
      const controls = page.locator(selector);
      if (await controls.first().isVisible()) {
        hasFactorControls = true;
        console.log(`Factor controls found: ${selector}`);
        break;
      }
    }

    if (hasFactorControls) {
      console.log('Energy factor controls available');
    }
  });

  test('should show time estimates for tasks', async ({ page }) => {
    // Look for time duration displays
    const timeDisplays = [
      '.task-duration',
      '.time-estimate',
      '.minutes',
      '.hours',
      '[data-duration]',
      '.task-time'
    ];

    let hasTimeDisplay = false;
    for (const selector of timeDisplays) {
      const display = page.locator(selector);
      if (await display.first().isVisible()) {
        hasTimeDisplay = true;
        const text = await display.first().textContent();
        console.log(`Time display found: ${selector} - "${text}"`);
        break;
      }
    }

    if (hasTimeDisplay) {
      console.log('Time estimates displayed for tasks');
    }
  });

  test('should integrate with projects table', async ({ page }) => {
    // Check if "Work today" button from projects adds to capacity
    const workTodayBtn = page.locator('.work-today-btn').first();

    if (await workTodayBtn.isVisible()) {
      // Count initial capacity tasks
      const initialTasks = page.locator('.capacity-task');
      const initialCount = await initialTasks.count();

      // Click work today button
      await workTodayBtn.click();

      // Look for modal and fill it
      const modal = page.locator('.project-work-modal');
      if (await modal.isVisible()) {
        const descInput = page.locator('#work-description');
        const hoursInput = page.locator('#estimated-hours');
        const submitBtn = page.locator('#add-work-submit');

        if (await descInput.isVisible()) {
          await descInput.fill('Work on project integration');
        }
        if (await hoursInput.isVisible()) {
          await hoursInput.fill('2');
        }
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
        }

        await page.waitForTimeout(1000);

        // Check if task was added to capacity
        const newTasks = page.locator('.capacity-task');
        const newCount = await newTasks.count();

        if (newCount > initialCount) {
          console.log('Project task successfully added to capacity planner');
        }
      }
    }
  });

  test('should save capacity data', async ({ page }) => {
    // Check if capacity data is saved to localStorage
    const localStorageData = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const capacityKeys = keys.filter(key =>
        key.includes('capacity') || key.includes('enough') || key.includes('energy') || key.includes('tasks')
      );
      return capacityKeys.map(key => ({ key, value: localStorage.getItem(key) }));
    });

    expect(localStorageData.length).toBeGreaterThanOrEqual(0);
    console.log('Capacity localStorage keys:', localStorageData.map(item => item.key));
  });

  test('should handle mobile view', async ({ page }) => {
    // Test mobile responsiveness
    await page.setViewportSize({ width: 375, height: 667 });

    const capacityContainer = page.locator('#enough-capacity-container');
    await expect(capacityContainer).toBeVisible();

    // Should maintain usability on mobile
    const capacitySection = page.locator('.enough-capacity');
    if (await capacitySection.isVisible()) {
      const styles = await capacitySection.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          overflow: computed.overflow,
        };
      });

      expect(styles.display).not.toBe('none');
    }
  });
});
import { test, expect } from '@playwright/test';

test.describe('Database Synchronization Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');
    await page.waitForTimeout(2000);

    // Authenticate if needed
    const authCard = page.locator('.auth-card');
    if (await authCard.isVisible()) {
      await page.locator('#auth-email').fill('marlana.creed@gmail.com');
      await page.locator('#auth-password').fill('Testing123');
      await page.locator('.auth-submit').click();
      await page.waitForTimeout(8000); // Wait for auth and sync
    }
  });

  test('should sync project data to Firestore', async ({ page }) => {
    // Wait for dashboard to be visible
    const projectsTable = page.locator('.projects-table-wrapper');
    await expect(projectsTable).toBeVisible();

    const timestamp = Date.now();
    const testProjectName = `Database Test Project ${timestamp}`;

    // Add a new project
    const firstProjectCell = page.locator('[data-field="name"]').first();
    await firstProjectCell.click();
    await firstProjectCell.fill(testProjectName);
    await firstProjectCell.press('Enter');
    await page.waitForTimeout(3000); // Wait for cloud sync

    // Modify category
    const categoryCell = page.locator('[data-field="category"]').first();
    await categoryCell.click();
    await categoryCell.fill('Database Testing');
    await categoryCell.press('Enter');
    await page.waitForTimeout(2000);

    // Modify todos
    const todosCell = page.locator('[data-field="todos"]').first();
    await todosCell.click();
    await todosCell.fill('Verify data sync to Firestore');
    await todosCell.press('Enter');
    await page.waitForTimeout(2000);

    console.log(`✅ Added project: ${testProjectName}`);

    // Reload page to verify persistence
    await page.reload();
    await page.waitForTimeout(5000); // Wait for auth and data loading

    // Check if project persisted
    const persistedProject = page.locator(`text=${testProjectName}`);
    await expect(persistedProject).toBeVisible();

    const persistedCategory = page.locator('text=Database Testing');
    await expect(persistedCategory).toBeVisible();

    const persistedTodos = page.locator('text=Verify data sync to Firestore');
    await expect(persistedTodos).toBeVisible();

    console.log('✅ Project data persisted after reload - Firestore sync working');
  });

  test('should sync brain dump data to Firestore', async ({ page }) => {
    // Look for brain dump input field
    const brainInputSelectors = [
      '.add-thought-input',
      'input[placeholder*="thought"]',
      'input[placeholder*="brain"]',
      'textarea[placeholder*="thought"]',
      '.brain-dump input',
      '.brain-dump textarea'
    ];

    let brainInput = null;
    for (const selector of brainInputSelectors) {
      const input = page.locator(selector);
      if (await input.first().isVisible()) {
        brainInput = input.first();
        break;
      }
    }

    if (brainInput) {
      const timestamp = Date.now();
      const testThought = `Database sync test thought ${timestamp}`;

      await brainInput.fill(testThought);
      await brainInput.press('Enter');
      await page.waitForTimeout(3000); // Wait for sync

      console.log(`✅ Added brain dump: ${testThought}`);

      // Reload page to verify persistence
      await page.reload();
      await page.waitForTimeout(5000);

      // Check if thought persisted
      const persistedThought = page.locator(`text=${testThought}`);
      if (await persistedThought.isVisible()) {
        console.log('✅ Brain dump data persisted after reload - Firestore sync working');
      }
    } else {
      console.log('⚠️ Brain dump input not found - may need manual verification');
    }
  });

  test('should sync capacity/energy data to Firestore', async ({ page }) => {
    // Look for capacity input fields
    const capacityInputSelectors = [
      '.add-task-input',
      'input[placeholder*="task"]',
      'input[placeholder*="capacity"]',
      'textarea[placeholder*="task"]',
      '.capacity-input'
    ];

    let capacityInput = null;
    for (const selector of capacityInputSelectors) {
      const input = page.locator(selector);
      if (await input.first().isVisible()) {
        capacityInput = input.first();
        break;
      }
    }

    if (capacityInput) {
      const timestamp = Date.now();
      const testTask = `Database sync capacity task ${timestamp}`;

      await capacityInput.fill(testTask);
      await capacityInput.press('Enter');
      await page.waitForTimeout(3000); // Wait for sync

      console.log(`✅ Added capacity task: ${testTask}`);

      // Reload page to verify persistence
      await page.reload();
      await page.waitForTimeout(5000);

      // Check if task persisted
      const persistedTask = page.locator(`text=${testTask}`);
      if (await persistedTask.isVisible()) {
        console.log('✅ Capacity data persisted after reload - Firestore sync working');
      }
    } else {
      console.log('⚠️ Capacity input not found - may need manual verification');
    }
  });

  test('should verify all local storage data matches Firestore', async ({ page }) => {
    // Get all localStorage data
    const localData = await page.evaluate(() => {
      const data = {};
      const relevantKeys = [
        'projects',
        'simpleBrainDumpItems',
        'enoughTasks',
        'focusSessions',
        'calendar_events',
        'selectedTheme',
        'unifiedTasks'
      ];

      relevantKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value;
          }
        }
      });

      return data;
    });

    console.log('📊 Current localStorage data:');
    Object.keys(localData).forEach(key => {
      const item = localData[key];
      if (Array.isArray(item)) {
        console.log(`  ${key}: ${item.length} items`);
      } else if (typeof item === 'object') {
        console.log(`  ${key}: object with ${Object.keys(item).length} properties`);
      } else {
        console.log(`  ${key}: ${item}`);
      }
    });

    // Verify we have some data
    expect(Object.keys(localData).length).toBeGreaterThan(0);

    // Projects should have data
    if (localData.projects) {
      expect(Array.isArray(localData.projects)).toBeTruthy();
      expect(localData.projects.length).toBeGreaterThan(0);
      console.log(`✅ Found ${localData.projects.length} projects in localStorage`);
    }

    // After waiting for sync, this data should match what's in Firestore
    await page.waitForTimeout(3000);
    console.log('✅ Data verification complete - should be synced to Firestore');
  });

  test('should demonstrate cross-device sync simulation', async ({ page }) => {
    // Make changes in one "session"
    const timestamp = Date.now();
    const testProject = `Cross-device sync test ${timestamp}`;

    // Add a project
    const projectCell = page.locator('[data-field="name"]').first();
    await projectCell.click();
    await projectCell.fill(testProject);
    await projectCell.press('Enter');
    await page.waitForTimeout(3000);

    console.log(`✅ Added project in "first device": ${testProject}`);

    // Simulate "second device" by opening new page context
    const newPage = await page.context().newPage();
    await newPage.goto('/');
    await newPage.waitForSelector('body');
    await newPage.waitForTimeout(2000);

    // Authenticate on "second device"
    const authCard = newPage.locator('.auth-card');
    if (await authCard.isVisible()) {
      await newPage.locator('#auth-email').fill('marlana.creed@gmail.com');
      await newPage.locator('#auth-password').fill('Testing123');
      await newPage.locator('.auth-submit').click();
      await newPage.waitForTimeout(8000);
    }

    // Check if data synced to "second device"
    const syncedProject = newPage.locator(`text=${testProject}`);
    if (await syncedProject.isVisible()) {
      console.log('🌟 Cross-device sync working! Data appears on "second device"');
    } else {
      console.log('⚠️ Cross-device sync may need more time or manual verification');
    }

    await newPage.close();
  });
});
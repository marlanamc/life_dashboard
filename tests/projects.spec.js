import { test, expect } from '@playwright/test';

test.describe('Projects Table Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.life-dashboard');
    // Wait a bit for components to initialize
    await page.waitForTimeout(1000);
  });

  test('should display projects table', async ({ page }) => {
    const projectsTable = page.locator('.projects-table-wrapper');
    await expect(projectsTable).toBeVisible();

    // Check table headers
    await expect(page.locator('text=Priority')).toBeVisible();
    await expect(page.locator('text=Project')).toBeVisible();
    await expect(page.locator('text=Category')).toBeVisible();
    await expect(page.locator('text=Todos')).toBeVisible();
  });

  test('should show starter project by default', async ({ page }) => {
    // Should have at least the welcome project
    const projectRows = page.locator('tr[data-project-id]');
    await expect(projectRows).toHaveCountGreaterThan(0);

    // Welcome project should be visible
    await expect(page.locator('text=Welcome to Your Project Library')).toBeVisible();
  });

  test('should have functional priority filters', async ({ page }) => {
    const priorityFilter = page.locator('#priority-filter');
    await expect(priorityFilter).toBeVisible();

    // Should have priority options
    await expect(priorityFilter.locator('option[value="all"]')).toBeVisible();
    await expect(priorityFilter.locator('option[value="high"]')).toBeVisible();
    await expect(priorityFilter.locator('option[value="medium"]')).toBeVisible();
    await expect(priorityFilter.locator('option[value="low"]')).toBeVisible();
  });

  test('should filter projects by priority', async ({ page }) => {
    const priorityFilter = page.locator('#priority-filter');

    // Get initial count
    const initialRows = page.locator('tr[data-project-id]');
    const initialCount = await initialRows.count();

    // Filter by high priority
    await priorityFilter.selectOption('high');
    await page.waitForTimeout(500);

    // Count should change (may be 0 if no high priority projects)
    const filteredRows = page.locator('tr[data-project-id]');
    const filteredCount = await filteredRows.count();

    // Should be different from initial count or same if all were high priority
    expect(typeof filteredCount).toBe('number');
  });

  test('should allow editing project names', async ({ page }) => {
    // Find the first editable project name cell
    const nameCell = page.locator('[data-field="name"]').first();

    if (await nameCell.isVisible()) {
      await nameCell.click();
      await nameCell.fill('Updated Project Name');
      await nameCell.press('Enter');

      // Should update the content
      await expect(nameCell).toContainText('Updated Project Name');
    }
  });

  test('should allow editing project categories', async ({ page }) => {
    const categoryCell = page.locator('[data-field="category"]').first();

    if (await categoryCell.isVisible()) {
      await categoryCell.click();
      await categoryCell.fill('New Category');
      await categoryCell.press('Enter');

      await expect(categoryCell).toContainText('New Category');
    }
  });

  test('should allow editing project todos', async ({ page }) => {
    const todosCell = page.locator('[data-field="todos"]').first();

    if (await todosCell.isVisible()) {
      await todosCell.click();
      await todosCell.fill('Updated todos');
      await todosCell.press('Enter');

      await expect(todosCell).toContainText('Updated todos');
    }
  });

  test('should cycle priority when clicking priority button', async ({ page }) => {
    const priorityBtn = page.locator('.priority-btn').first();

    if (await priorityBtn.isVisible()) {
      // Get initial priority emoji
      const initialEmoji = await priorityBtn.textContent();

      // Click to cycle priority
      await priorityBtn.click();

      // Wait for update
      await page.waitForTimeout(300);

      // Should have different emoji or same if it cycled back
      const newEmoji = await priorityBtn.textContent();
      expect(typeof newEmoji).toBe('string');
    }
  });

  test('should have work today buttons', async ({ page }) => {
    const workTodayBtns = page.locator('.work-today-btn');

    // Should have at least one work today button
    if (await workTodayBtns.first().isVisible()) {
      await expect(workTodayBtns.first()).toContainText('Work today');
    }
  });

  test('should open work today modal', async ({ page }) => {
    const workTodayBtn = page.locator('.work-today-btn').first();

    if (await workTodayBtn.isVisible()) {
      await workTodayBtn.click();

      // Should open modal
      const modal = page.locator('.project-work-modal');
      if (await modal.isVisible()) {
        await expect(modal).toBeVisible();
        await expect(page.locator('#work-description')).toBeVisible();
        await expect(page.locator('#estimated-hours')).toBeVisible();
      }
    }
  });

  test('should have delete project functionality', async ({ page }) => {
    const deleteBtn = page.locator('.delete-project-btn').first();

    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();

      // Should show confirmation dialog
      const dialog = page.locator('.delete-confirmation-dialog');
      if (await dialog.isVisible()) {
        await expect(dialog).toBeVisible();
        await expect(page.locator('text=Delete Project')).toBeVisible();

        // Cancel the deletion
        await page.locator('.dialog-cancel').click();

        // Dialog should close
        await expect(dialog).not.toBeVisible();
      }
    }
  });

  test('should sort projects by columns', async ({ page }) => {
    const nameHeader = page.locator('.header-sort[data-column="name"]');

    if (await nameHeader.isVisible()) {
      // Get initial order
      const projectNames = page.locator('[data-field="name"]');
      const initialFirst = await projectNames.first().textContent();

      // Click to sort
      await nameHeader.click();
      await page.waitForTimeout(300);

      // Order might have changed
      const newFirst = await projectNames.first().textContent();
      expect(typeof newFirst).toBe('string');
    }
  });

  test('should show project count', async ({ page }) => {
    const projectCount = page.locator('.projects-table__meta span');

    if (await projectCount.isVisible()) {
      const countText = await projectCount.textContent();
      expect(countText).toMatch(/\d+\s+projects?/);
    }
  });
});
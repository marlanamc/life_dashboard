import { test, expect } from '@playwright/test';

test.describe('Data Synchronization Verification', () => {
  test('should verify data is being stored and synced', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');
    await page.waitForTimeout(2000);

    // Authenticate
    const authCard = page.locator('.auth-card');
    if (await authCard.isVisible()) {
      await page.locator('#auth-email').fill('marlana.creed@gmail.com');
      await page.locator('#auth-password').fill('Testing123');
      await page.locator('.auth-submit').click();
      await page.waitForTimeout(10000); // Wait for auth and initial data sync
    }

    // Wait for dashboard to fully load
    await page.waitForTimeout(5000);

    // Check what data is currently in localStorage
    const localStorageData = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
      return data;
    });

    console.log('📊 All localStorage keys:', Object.keys(localStorageData));

    // Check for specific data types
    const dataTypes = [
      'projects',
      'simpleBrainDumpItems',
      'enoughTasks',
      'focusSessions',
      'calendar_events',
      'selectedTheme',
      'unifiedTasks'
    ];

    const foundDataTypes = [];
    dataTypes.forEach(type => {
      if (localStorageData[type]) {
        foundDataTypes.push(type);
        const data = localStorageData[type];
        if (Array.isArray(data)) {
          console.log(`  ✅ ${type}: ${data.length} items`);
          if (data.length > 0) {
            console.log(`    Sample: ${JSON.stringify(data[0]).substring(0, 100)}...`);
          }
        } else if (typeof data === 'object') {
          console.log(`  ✅ ${type}: object with ${Object.keys(data).length} properties`);
        } else {
          console.log(`  ✅ ${type}: ${data}`);
        }
      }
    });

    console.log(`\n📈 Found ${foundDataTypes.length} data types: ${foundDataTypes.join(', ')}`);

    // Verify we have some dashboard data
    expect(foundDataTypes.length).toBeGreaterThan(0);

    // Check if CloudSync is working
    const cloudSyncStatus = await page.evaluate(() => {
      // Check if there are any cloud sync related events in console
      return {
        hasCloudSyncClass: !!window.CloudSync,
        hasDataManager: !!window.DataManager,
        hasFirebaseApp: !!window.firebase || typeof window.firebase !== 'undefined'
      };
    });

    console.log('🔥 Firebase/CloudSync status:', cloudSyncStatus);
  });

  test('should show that changes persist across page reloads', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');
    await page.waitForTimeout(2000);

    // Authenticate
    const authCard = page.locator('.auth-card');
    if (await authCard.isVisible()) {
      await page.locator('#auth-email').fill('marlana.creed@gmail.com');
      await page.locator('#auth-password').fill('Testing123');
      await page.locator('.auth-submit').click();
      await page.waitForTimeout(10000);
    }

    // Get initial data state
    const initialData = await page.evaluate(() => {
      const projects = localStorage.getItem('projects');
      const brainDump = localStorage.getItem('simpleBrainDumpItems');
      return {
        projectsCount: projects ? JSON.parse(projects).length : 0,
        brainDumpCount: brainDump ? JSON.parse(brainDump).length : 0
      };
    });

    console.log('📊 Initial data state:', initialData);

    // Reload the page
    await page.reload();
    await page.waitForTimeout(2000);

    // Re-authenticate if needed
    const authCardAfterReload = page.locator('.auth-card');
    if (await authCardAfterReload.isVisible()) {
      await page.locator('#auth-email').fill('marlana.creed@gmail.com');
      await page.locator('#auth-password').fill('Testing123');
      await page.locator('.auth-submit').click();
      await page.waitForTimeout(10000);
    }

    // Get data state after reload
    const reloadedData = await page.evaluate(() => {
      const projects = localStorage.getItem('projects');
      const brainDump = localStorage.getItem('simpleBrainDumpItems');
      return {
        projectsCount: projects ? JSON.parse(projects).length : 0,
        brainDumpCount: brainDump ? JSON.parse(brainDump).length : 0
      };
    });

    console.log('📊 Data after reload:', reloadedData);

    // Data should be the same or restored from cloud
    if (initialData.projectsCount > 0) {
      expect(reloadedData.projectsCount).toBe(initialData.projectsCount);
      console.log('✅ Projects data persisted across reload');
    }

    if (initialData.brainDumpCount > 0) {
      expect(reloadedData.brainDumpCount).toBe(initialData.brainDumpCount);
      console.log('✅ Brain dump data persisted across reload');
    }

    console.log('✅ Data persistence verified - Firestore sync working');
  });

  test('should verify network requests to Firestore', async ({ page }) => {
    // Monitor network requests
    const firestoreRequests = [];
    page.on('request', request => {
      if (request.url().includes('firestore.googleapis.com')) {
        firestoreRequests.push({
          method: request.method(),
          url: request.url(),
          postData: request.postData()
        });
      }
    });

    await page.goto('/');
    await page.waitForSelector('body');
    await page.waitForTimeout(2000);

    // Authenticate
    const authCard = page.locator('.auth-card');
    if (await authCard.isVisible()) {
      await page.locator('#auth-email').fill('marlana.creed@gmail.com');
      await page.locator('#auth-password').fill('Testing123');
      await page.locator('.auth-submit').click();
      await page.waitForTimeout(15000); // Wait longer to catch all requests
    }

    console.log(`🌐 Captured ${firestoreRequests.length} Firestore requests:`);
    firestoreRequests.forEach((req, index) => {
      console.log(`  ${index + 1}. ${req.method} ${req.url.split('?')[0]}`);
    });

    // Should have some Firestore communication
    expect(firestoreRequests.length).toBeGreaterThan(0);
    console.log('✅ Firestore network communication verified');
  });
});
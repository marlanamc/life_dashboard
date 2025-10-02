// Mobile Analysis Script
import { chromium } from 'playwright';

async function analyzeMobileExperience() {
  const browser = await chromium.launch();

  // Test multiple mobile viewports
  const devices = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 13', width: 390, height: 844 },
    { name: 'Samsung Galaxy S21', width: 360, height: 800 },
    { name: 'iPad Mini', width: 768, height: 1024 }
  ];

  for (const device of devices) {
    console.log(`\n📱 Analyzing ${device.name} (${device.width}x${device.height})`);

    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height }
    });

    const page = await context.newPage();

    try {
      // Navigate to the dashboard
      await page.goto('http://localhost:3001');
      await page.waitForTimeout(2000);

      // Take screenshot
      await page.screenshot({
        path: `mobile-${device.name.toLowerCase().replace(' ', '-')}.png`,
        fullPage: true
      });

      // Analyze layout issues
      const layoutIssues = await page.evaluate(() => {
        const issues = [];

        // Check if content overflows horizontally
        const body = document.body;
        if (body.scrollWidth > window.innerWidth) {
          issues.push('Horizontal overflow detected');
        }

        // Check if grid items are too small
        const gridItems = document.querySelectorAll('.dashboard-section, .card, .widget');
        gridItems.forEach((item, index) => {
          const rect = item.getBoundingClientRect();
          if (rect.width < 200) {
            issues.push(`Grid item ${index} too narrow: ${rect.width}px`);
          }
          if (rect.height < 100) {
            issues.push(`Grid item ${index} too short: ${rect.height}px`);
          }
        });

        // Check touch targets
        const buttons = document.querySelectorAll('button, .btn, input[type="submit"]');
        buttons.forEach((btn, index) => {
          const rect = btn.getBoundingClientRect();
          if (rect.width < 44 || rect.height < 44) {
            issues.push(`Touch target ${index} too small: ${rect.width}x${rect.height}px`);
          }
        });

        // Check text readability
        const textElements = document.querySelectorAll('p, span, div');
        let smallTextCount = 0;
        textElements.forEach(el => {
          const styles = window.getComputedStyle(el);
          const fontSize = parseFloat(styles.fontSize);
          if (fontSize < 14) {
            smallTextCount++;
          }
        });

        if (smallTextCount > 0) {
          issues.push(`${smallTextCount} elements with text smaller than 14px`);
        }

        return issues;
      });

      console.log(`   Issues found: ${layoutIssues.length}`);
      layoutIssues.forEach(issue => console.log(`   - ${issue}`));

      // Test scrolling performance
      const scrollTest = await page.evaluate(() => {
        const startTime = performance.now();
        window.scrollTo(0, document.body.scrollHeight);
        const endTime = performance.now();
        return endTime - startTime;
      });

      console.log(`   Scroll performance: ${scrollTest.toFixed(2)}ms`);

    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }

    await context.close();
  }

  await browser.close();
  console.log('\n✅ Mobile analysis complete! Check generated screenshots.');
}

analyzeMobileExperience().catch(console.error);
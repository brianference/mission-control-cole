import { test, expect } from '@playwright/test';

test('costs page with time range selector', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/costs');
  await page.waitForTimeout(2000);
  
  // Verify time range buttons exist
  await expect(page.getByText('📅 Daily')).toBeVisible();
  await expect(page.getByText('📆 Weekly')).toBeVisible();
  await expect(page.getByText('🗓️ Monthly')).toBeVisible();
  
  // Take screenshot with monthly (default)
  await page.screenshot({ path: 'screenshots/costs-monthly.png' });
  
  // Click weekly and screenshot
  await page.getByText('📆 Weekly').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/costs-weekly.png' });
  
  // Click daily and screenshot
  await page.getByText('📅 Daily').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/costs-daily.png' });
});

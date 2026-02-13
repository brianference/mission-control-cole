import { test, expect } from '@playwright/test';

async function snap(page: any, name: string) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: false });
}

test.describe('Mission Control - production verification screenshots', () => {
  test('Overview + key pages render and navigation works', async ({ page }) => {
    // Overview
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /mission control/i })).toBeVisible();
    await snap(page, '01-overview-top');

    // Costs
    await page.getByRole('link', { name: /costs/i }).click();
    await expect(page).toHaveURL(/\/costs|\/cost-tracking|\/cost/i);
    await snap(page, '02-costs-top');

    // Skills
    await page.getByRole('link', { name: /skills/i }).click();
    await expect(page).toHaveURL(/\/skills/);
    await expect(page.getByRole('heading', { name: /skills/i })).toBeVisible();
    await snap(page, '03-skills');

    // Agents
    await page.getByRole('link', { name: /agents/i }).click();
    await expect(page).toHaveURL(/\/agents/);
    await expect(page.getByRole('heading', { name: /agents/i })).toBeVisible();
    await snap(page, '04-agents');

    // Tasks
    await page.getByRole('link', { name: /^tasks$/i }).click();
    await expect(page).toHaveURL(/\/tasks/);
    await expect(page.getByRole('heading', { name: /tasks/i })).toBeVisible();
    await snap(page, '05-tasks');

    // Header/rocket returns home
    await page.getByRole('link', { name: /mission control/i }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await snap(page, '06-header-home-link');
  });
});

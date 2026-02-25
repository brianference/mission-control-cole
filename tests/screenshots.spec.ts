import { test, expect, Page } from '@playwright/test';

async function snap(page: Page, name: string, projectName?: string) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `screenshots/${projectName ? projectName + '-' : ''}${name}.png`, fullPage: false });
}

test.describe('Mission Control - production verification screenshots', () => {
  test('Overview + key pages render and navigation works', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;
    // Overview
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Mission Control' })).toBeVisible();
    await snap(page, '01-overview-top', projectName);

    // Costs (direct nav)
    await page.goto('/costs');
    await expect(page).toHaveURL(/\/costs/);
    await snap(page, '02-costs-top');

    // Skills
    await page.goto('/skills');
    await expect(page).toHaveURL(/\/skills/);
    await expect(page.getByRole('heading', { name: /skills/i })).toBeVisible();
    await snap(page, '03-skills');

    // Agents
    await page.goto('/agents');
    await expect(page).toHaveURL(/\/agents/);
    await expect(page.getByRole('heading', { name: /agents/i })).toBeVisible();
    await snap(page, '04-agents');

    // Tasks
    await page.goto('/tasks');
    await expect(page).toHaveURL(/\/tasks/);
    await expect(page.getByRole('heading', { name: /tasks/i })).toBeVisible();
    await snap(page, '05-tasks');

    // Home (final)
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await snap(page, '06-home-again');
  });
});

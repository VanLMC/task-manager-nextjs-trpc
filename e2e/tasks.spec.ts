import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const SEEDED_TASK = 'Plan the quarterly roadmap';

function trackCspViolations(page: Page) {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('Content Security Policy')) violations.push(message.text());
  });
  return violations;
}

test.describe('task list', () => {
  test('is rendered on the server, even without JavaScript', async ({ browser, request }) => {
    const html = await (await request.get('/tasks')).text();
    expect(html).toContain(SEEDED_TASK);

    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/tasks');
    await expect(page.getByRole('article', { name: SEEDED_TASK })).toBeVisible();
    await context.close();
  });

  test('does not refetch the list right after hydration', async ({ page }) => {
    const listRequests: string[] = [];
    page.on('request', (req) => req.url().includes('task.list') && listRequests.push(req.url()));

    await page.goto('/tasks');
    await page.getByRole('article').first().waitFor();
    await page.waitForLoadState('networkidle');

    expect(listRequests).toEqual([]);
  });

  test('loads more tasks while scrolling', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.getByRole('article')).toHaveCount(10);

    await expect(async () => {
      await page.mouse.wheel(0, 10_000);
      await expect(page.getByText('You have reached the end of the list.')).toBeVisible({
        timeout: 1_000,
      });
    }).toPass();
    expect(await page.getByRole('article').count()).toBeGreaterThan(20);
  });

  test('searches by title through the URL', async ({ page, request }) => {
    const html = await (await request.get('/tasks?q=quarterly')).text();
    expect(html).toContain(SEEDED_TASK);
    expect(html).not.toContain('Review pull requests');

    await page.goto('/tasks');
    await page.getByRole('searchbox', { name: 'Search by title' }).fill('QUARTERLY');
    await expect(page).toHaveURL(/\?q=QUARTERLY$/);
    await expect(page.getByRole('article')).toHaveCount(1);
  });
});

test('creates, completes, edits, deletes and restores a task', async ({ page }) => {
  const title = `E2E task ${Date.now()}`;
  await page.goto('/tasks/new');

  await page.getByRole('button', { name: 'Create task' }).click();
  await expect(page.getByText('Title is required')).toBeVisible();

  await page.getByRole('textbox', { name: 'Title' }).fill(title);
  await page.getByRole('textbox', { name: 'Description' }).fill('Created by the browser test');
  await page.getByRole('button', { name: 'Create task' }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByText('Task created.')).toBeVisible();
  const card = page.getByRole('article', { name: title });
  await expect(card).toBeVisible();

  await card.getByRole('checkbox').click();
  await expect(card.getByRole('checkbox')).toBeChecked();

  await card.getByRole('link', { name: 'Edit' }).click();
  await page.getByRole('textbox', { name: 'Title' }).fill(`${title} (edited)`);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Task updated.')).toBeVisible();
  const editedCard = page.getByRole('article', { name: `${title} (edited)` });
  await expect(editedCard.getByRole('checkbox')).toBeChecked();

  await editedCard.getByRole('button', { name: /Delete/ }).click();
  await expect(editedCard).toBeHidden();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('Task restored.')).toBeVisible();
  await expect(editedCard).toBeVisible();
});

test('returns a real 404 for a missing task', async ({ page }) => {
  const response = await page.goto('/tasks/00000000-0000-4000-8000-000000000000/edit');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Task not found' })).toBeVisible();
});

test('sends security headers and loads without CSP violations', async ({ page }) => {
  const violations = trackCspViolations(page);

  const response = await page.goto('/tasks');
  await page.getByRole('article').first().waitFor();
  const headers = response?.headers() ?? {};

  expect(headers['content-security-policy']).toMatch(
    /script-src 'self' 'nonce-[^']+' 'strict-dynamic'/,
  );
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(violations).toEqual([]);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`has no accessibility violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    for (const path of ['/tasks', '/tasks/new']) {
      await page.goto(path);
      await page.getByRole('heading', { level: 1 }).waitFor();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(results.violations, `${path} in ${colorScheme} mode`).toEqual([]);
    }
  });
}

import { expect, test } from '@playwright/test';

test('renders Gradator 2 web application smoke screen', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Gradator 2' })).toBeVisible();
  await expect(page.getByTestId('gradient-fn')).toContainText('linear-gradient()');

  await page.getByRole('button', { name: 'radial' }).click();
  await expect(page.getByTestId('gradient-fn')).toContainText('radial-gradient()');
});

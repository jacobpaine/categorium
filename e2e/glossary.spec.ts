import { test, expect } from '@playwright/test';

test('the glossary re-themes its definitions when you change the theme', async ({ page }) => {
  await page.goto('/glossary?debug=true'); // debug shows all terms

  // Data theme: the "object" definition mentions a Raw CSV.
  await expect(page.getByText('Raw CSV', { exact: false }).first()).toBeVisible();

  // Switch to Spellcraft — the same definition is reworded in that vocabulary.
  await page.getByTestId('glossary-theme').selectOption('spellcraft');
  await expect(page.getByText('Spark', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('Raw CSV', { exact: false })).toHaveCount(0);
});

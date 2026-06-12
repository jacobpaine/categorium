import { test, expect } from '@playwright/test';

test('?debug=true unlocks later chapters and shows the debug panel', async ({ page }) => {
  await page.goto('/?debug=true');

  // Theme select -> chapter map (the ?debug flag is sticky for the session).
  await page.getByTestId('theme-data').click();
  await expect(page.getByRole('button', { name: /DEBUG/ })).toBeVisible();

  // A Chapter 2 puzzle is reachable without completing Chapter 1.
  const ch2Puzzle = page.getByTestId('puzzle-link-puzzle-06');
  await expect(ch2Puzzle).toBeVisible();
  await ch2Puzzle.click();

  // The debug panel renders with its sections + live validation.
  await expect(page.getByText('Validation (live graph)')).toBeVisible();
  await expect(page.getByText('Theme mappings')).toBeVisible();

  // And it can be dismissed.
  await page.getByRole('button', { name: 'Close debug panel' }).click();
  await expect(page.getByText('Validation (live graph)')).toHaveCount(0);
});

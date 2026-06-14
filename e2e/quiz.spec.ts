import { test, expect } from '@playwright/test';

test('the quiz is gated to unlocked terms — empty for a fresh profile', async ({ page }) => {
  await page.goto('/quiz');
  await expect(page.getByText('No glossary terms unlocked yet.')).toBeVisible();
  await expect(page.getByTestId('quiz-progress')).toHaveCount(0);
});

test('the Quiz tab is in the nav and runs (debug unlocks every term)', async ({ page }) => {
  await page.goto('/?debug=true'); // unlock all glossary terms for the quiz
  await page.getByRole('link', { name: 'Quiz' }).click();
  await expect(page).toHaveURL(/\/quiz/);
  await expect(page.getByTestId('quiz-progress')).toHaveText('1 / 44');

  // Next is disabled until an option is chosen.
  await expect(page.getByTestId('quiz-next')).toBeDisabled();

  // Answer the first question correctly (q-object-1 → "Object") wherever it's shuffled to.
  await page.getByTestId('quiz-option').filter({ hasText: 'Object' }).first().click();
  await expect(page.getByTestId('quiz-explanation')).toContainText('Correct');
  await page.getByTestId('quiz-next').click();
  await expect(page.getByTestId('quiz-progress')).toHaveText('2 / 44');
});

test('switching theme re-themes the questions and restarts', async ({ page }) => {
  await page.goto('/quiz?debug=true');
  const prompt = page.locator('p.text-lg');
  await expect(prompt).toContainText('Raw CSV'); // data theme

  await page.getByRole('combobox').selectOption('spellcraft');
  await expect(page.getByTestId('quiz-progress')).toHaveText('1 / 44');
  await expect(prompt).toContainText('Spark'); // spellcraft vocabulary
});

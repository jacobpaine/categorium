import { test, expect, type Page } from '@playwright/test';

async function connect(page: Page, from: string, to: string) {
  const a = await page.locator(from).boundingBox();
  const b = await page.locator(to).boundingBox();
  if (!a || !b) throw new Error(`missing handle: ${from} -> ${to}`);
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 6 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 });
  await page.mouse.up();
}
const right = (id: string) => `.react-flow__node[data-id="${id}"] .react-flow__handle-right`;
const left = (id: string) => `.react-flow__node[data-id="${id}"] .react-flow__handle-left`;

test('chapter 7 (monads): wrapping a value with return solves the puzzle', async ({ page }) => {
  await page.goto('/chapter/chapter-07-monads/puzzle/puzzle-m1?debug=true');
  await expect(page.locator('.react-flow__node[data-id="n-return"]')).toBeVisible();
  await page.waitForTimeout(400);

  await connect(page, right('n-a'), left('n-return'));
  await connect(page, right('n-return'), left('n-ta'));
  await page.getByTestId('run-check').click();
  await expect(page.getByTestId('solved')).toBeVisible();
  await expect(page.getByText('What you learned')).toBeVisible();
});

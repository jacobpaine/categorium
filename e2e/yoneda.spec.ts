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

test('chapter 11: matching each tier to its incoming-arrow fingerprint solves the representable puzzle', async ({ page }) => {
  await page.goto('/chapter/chapter-11-yoneda/puzzle/puzzle-y1?debug=true');
  await expect(page.locator('.react-flow__node[data-id="source:item:l-basic"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="target:item:r-one"]')).toBeVisible();
  await page.waitForTimeout(400);

  // A wrong match first: pair the top tier with the impossible profile → not solved.
  await connect(page, right('source:item:l-premium'), left('target:item:r-bad'));
  await connect(page, right('source:item:l-basic'), left('target:item:r-one'));
  await connect(page, right('source:item:l-plus'), left('target:item:r-two'));
  await page.getByTestId('run-check').click();
  await expect(page.getByText('Not matched yet')).toBeVisible();

  // Fix the top tier: everything maps into it.
  await connect(page, right('source:item:l-premium'), left('target:item:r-three'));
  await page.getByTestId('run-check').click();
  await expect(page.getByTestId('solved')).toBeVisible();
});

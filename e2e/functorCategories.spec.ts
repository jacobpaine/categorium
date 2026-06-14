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

test('chapter 9: picking the composite component at each object solves', async ({ page }) => {
  await page.goto('/chapter/chapter-09-functor-categories/puzzle/puzzle-v1?debug=true');
  await expect(page.locator('.react-flow__node[data-id="source:object:obj-a"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="target:morphism:d-gammaA"]')).toBeVisible();
  await page.waitForTimeout(400);

  // Choose the vertical composite β·α at each object.
  await connect(page, right('source:object:obj-a'), left('target:morphism:d-gammaA'));
  await connect(page, right('source:object:obj-b'), left('target:morphism:d-gammaB'));
  await page.getByTestId('run-check').click();
  await expect(page.getByTestId('solved')).toBeVisible();
});

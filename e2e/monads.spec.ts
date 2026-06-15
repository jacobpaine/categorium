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

const nodeExact = (id: string) => `.react-flow__node[data-id="${id}"]`;
// Placed-from-tray nodes get id `tk-<kind>-<refId>-<n>`; match by prefix so order doesn't matter.
const nodePlaced = (kind: 'object' | 'morphism', refId: string) =>
  `.react-flow__node[data-id^="tk-${kind}-${refId}-"]`;
const rightOf = (nodeSel: string) => `${nodeSel} .react-flow__handle-right`;
const leftOf = (nodeSel: string) => `${nodeSel} .react-flow__handle-left`;

/** Click a tray piece and wait for its placed node to appear. */
async function place(page: Page, kind: 'object' | 'morphism', refId: string) {
  await page.getByTestId(`tray-${kind}-${refId}`).click();
  await expect(page.locator(nodePlaced(kind, refId))).toBeVisible();
  await page.waitForTimeout(120);
}

test('chapter 7 (monads): wrapping a value with return solves the puzzle', async ({ page }) => {
  await page.goto('/chapter/chapter-07-monads/puzzle/puzzle-m1?debug=true');
  await expect(page.getByTestId('tray-morphism-mor-return')).toBeVisible();
  await page.waitForTimeout(400);

  await place(page, 'morphism', 'mor-return');
  await connect(page, rightOf(nodeExact('n-a')), leftOf(nodePlaced('morphism', 'mor-return')));
  await connect(page, rightOf(nodePlaced('morphism', 'mor-return')), leftOf(nodeExact('n-ta')));
  await page.getByTestId('run-check').click();
  await expect(page.getByTestId('solved')).toBeVisible();
  await expect(page.getByText('What you learned')).toBeVisible();
});

test('chapter 7 (multi-case): a fabricating bind passes the easy case but fails the suite', async ({ page }) => {
  await page.goto('/chapter/chapter-07-monads/puzzle/puzzle-m3?debug=true');
  await expect(page.getByTestId('tray-morphism-mor-bind')).toBeVisible();
  await page.waitForTimeout(400);

  // Honest lookup, but the fabricating bind: passes Ada, invents a host for Bo — so the suite fails.
  await place(page, 'object', 'obj-tb');
  await place(page, 'morphism', 'mor-f');
  await place(page, 'morphism', 'mor-bindbad');
  await connect(page, rightOf(nodeExact('n-a')), leftOf(nodePlaced('morphism', 'mor-f')));
  await connect(page, rightOf(nodePlaced('morphism', 'mor-f')), leftOf(nodePlaced('object', 'obj-tb')));
  await connect(page, rightOf(nodePlaced('object', 'obj-tb')), leftOf(nodePlaced('morphism', 'mor-bindbad')));
  await connect(page, rightOf(nodePlaced('morphism', 'mor-bindbad')), leftOf(nodeExact('n-tc')));
  await page.getByTestId('run-check').click();
  await expect(page.getByText('1 / 2 pass')).toBeVisible();
  await expect(page.getByTestId('solved')).toHaveCount(0);
});

test('chapter 7 (multi-case): the faithful pipeline passes every case', async ({ page }) => {
  await page.goto('/chapter/chapter-07-monads/puzzle/puzzle-m3?debug=true');
  await expect(page.getByTestId('tray-morphism-mor-bind')).toBeVisible();
  await page.waitForTimeout(400);

  await place(page, 'object', 'obj-tb');
  await place(page, 'morphism', 'mor-f');
  await place(page, 'morphism', 'mor-bind');
  await connect(page, rightOf(nodeExact('n-a')), leftOf(nodePlaced('morphism', 'mor-f')));
  await connect(page, rightOf(nodePlaced('morphism', 'mor-f')), leftOf(nodePlaced('object', 'obj-tb')));
  await connect(page, rightOf(nodePlaced('object', 'obj-tb')), leftOf(nodePlaced('morphism', 'mor-bind')));
  await connect(page, rightOf(nodePlaced('morphism', 'mor-bind')), leftOf(nodeExact('n-tc')));
  await page.getByTestId('run-check').click();
  await expect(page.getByText('2 / 2 pass')).toBeVisible();
  await expect(page.getByTestId('solved')).toBeVisible();
});

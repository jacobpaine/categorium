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
const nodePlaced = (kind: 'object' | 'morphism', refId: string) =>
  `.react-flow__node[data-id^="tk-${kind}-${refId}-"]`;
const rightOf = (nodeSel: string) => `${nodeSel} .react-flow__handle-right`;
const leftOf = (nodeSel: string) => `${nodeSel} .react-flow__handle-left`;

test('chapter 8 (limits): collapsing to the terminal object solves', async ({ page }) => {
  await page.goto('/chapter/chapter-08-limits/puzzle/puzzle-l1?debug=true');
  await expect(page.getByTestId('tray-morphism-mor-collapse')).toBeVisible();
  await page.waitForTimeout(400);

  // The unique map ! to the terminal object lives in the tray; bring it on and wire it.
  await page.getByTestId('tray-morphism-mor-collapse').click();
  await expect(page.locator(nodePlaced('morphism', 'mor-collapse'))).toBeVisible();
  await page.waitForTimeout(120);
  await connect(page, rightOf(nodeExact('n-a')), leftOf(nodePlaced('morphism', 'mor-collapse')));
  await connect(page, rightOf(nodePlaced('morphism', 'mor-collapse')), leftOf(nodeExact('n-1')));
  await page.getByTestId('run-check').click();
  await expect(page.getByTestId('solved')).toBeVisible();
});

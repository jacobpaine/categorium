import { test, expect, type Page } from '@playwright/test';

async function connect(page: Page, fromSelector: string, toSelector: string) {
  const a = await page.locator(fromSelector).boundingBox();
  const b = await page.locator(toSelector).boundingBox();
  if (!a || !b) throw new Error(`missing handle: ${fromSelector} -> ${toSelector}`);
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;
  await page.mouse.move(ax, ay);
  await page.mouse.down();
  await page.mouse.move((ax + bx) / 2, (ay + by) / 2, { steps: 6 });
  await page.mouse.move(bx, by, { steps: 6 });
  await page.mouse.up();
}

const right = (id: string) => `.react-flow__node[data-id="${id}"] .react-flow__handle-right`;
const left = (id: string) => `.react-flow__node[data-id="${id}"] .react-flow__handle-left`;
const placed = (kind: 'object' | 'morphism', refId: string) => `tk-${kind}-${refId}-0`;

async function openPuzzle14(page: Page) {
  await page.goto('/?debug=true'); // unlock Chapter 4
  await page.getByTestId('theme-data').click();
  await page.getByTestId('puzzle-link-puzzle-14').click();
  // Only start/goal are pinned; the lifts wait in the toolkit tray.
  await expect(page.locator('.react-flow__node[data-id="n-fa"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="n-fb"]')).toBeVisible();
  await expect(page.getByTestId('tray-morphism-mor-Ff')).toBeVisible();
  await page.waitForTimeout(400);
}

test('lifting a machine: the faithful lift transforms the whole batch', async ({ page }) => {
  await openPuzzle14(page);

  await page.getByTestId('tray-morphism-mor-Ff').click();
  await expect(page.locator(`.react-flow__node[data-id="${placed('morphism', 'mor-Ff')}"]`)).toBeVisible();
  await page.waitForTimeout(150);
  await connect(page, right('n-fa'), left(placed('morphism', 'mor-Ff')));
  await connect(page, right(placed('morphism', 'mor-Ff')), left('n-fb'));

  await page.getByTestId('run-check').click();
  await expect(page.getByTestId('solved')).toBeVisible();
  await expect(page.getByText('What you learned')).toBeVisible();
});

test('the impostor lift (same type) produces the wrong batch', async ({ page }) => {
  await openPuzzle14(page);

  await page.getByTestId('tray-morphism-mor-Ffbad').click();
  await expect(page.locator(`.react-flow__node[data-id="${placed('morphism', 'mor-Ffbad')}"]`)).toBeVisible();
  await page.waitForTimeout(150);
  await connect(page, right('n-fa'), left(placed('morphism', 'mor-Ffbad')));
  await connect(page, right(placed('morphism', 'mor-Ffbad')), left('n-fb'));

  await page.getByTestId('run-check').click();
  await expect(page.getByText('Not quite yet')).toBeVisible();
  await expect(page.getByText('0 / 1 pass')).toBeVisible();
  await expect(page.locator('.bg-rose-100').filter({ hasText: 'a batch of shredded records' })).toBeVisible();
  await expect(page.getByTestId('solved')).toHaveCount(0);
});

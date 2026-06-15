import { test, expect, type Page } from '@playwright/test';

/** Drag from one React Flow handle to another to create a wire. */
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
/** First piece placed from the tray gets suffix -0 (placeCounter starts at 0). */
const placed = (kind: 'object' | 'morphism', refId: string) => `tk-${kind}-${refId}-0`;

async function openPuzzle1(page: Page) {
  await page.goto('/');
  await page.getByTestId('theme-data').click();
  await page.getByTestId('puzzle-link-puzzle-01').click();
  // Only the pinned start/goal are on the board; the machines wait in the toolkit tray.
  await expect(page.locator('.react-flow__node[data-id="n-a"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="n-b"]')).toBeVisible();
  await expect(page.getByTestId('tray-morphism-mor-parser')).toBeVisible();
  await expect(page.getByTestId('tray-morphism-mor-shred')).toBeVisible();
  await page.waitForTimeout(400); // let fitView settle
}

test('toolkit: place the faithful machine, wire it, and solve', async ({ page }) => {
  await openPuzzle1(page);

  // Bring the Parser onto the board (it leaves the tray) and wire it through.
  await page.getByTestId('tray-morphism-mor-parser').click();
  await expect(page.locator(`.react-flow__node[data-id="${placed('morphism', 'mor-parser')}"]`)).toBeVisible();
  await expect(page.getByTestId('tray-morphism-mor-parser')).toHaveCount(0);
  await page.waitForTimeout(150);

  await connect(page, right('n-a'), left(placed('morphism', 'mor-parser')));
  await connect(page, right(placed('morphism', 'mor-parser')), left('n-b'));

  await page.getByTestId('run-check').click();
  await expect(page.getByTestId('solved')).toBeVisible();
  await expect(page.getByText('What you learned')).toBeVisible();
  await expect(page.getByText('1 / 1 pass')).toBeVisible();
});

test('toolkit: choosing the wrong tray piece (Shredder) is rejected', async ({ page }) => {
  await openPuzzle1(page);

  // The Shredder is also A→B (same color), but it produces the wrong value.
  await page.getByTestId('tray-morphism-mor-shred').click();
  await expect(page.locator(`.react-flow__node[data-id="${placed('morphism', 'mor-shred')}"]`)).toBeVisible();
  await page.waitForTimeout(150);

  await connect(page, right('n-a'), left(placed('morphism', 'mor-shred')));
  await connect(page, right(placed('morphism', 'mor-shred')), left('n-b'));

  await page.getByTestId('run-check').click();
  await expect(page.getByText('Not quite yet')).toBeVisible();
  await expect(page.getByText('0 / 1 pass')).toBeVisible();
  await expect(page.getByText('shredded mess', { exact: false })).toBeVisible();
  await expect(page.getByTestId('solved')).toHaveCount(0);
});

test('toolkit: a placed piece can be sent back to the tray with its ✕', async ({ page }) => {
  await openPuzzle1(page);

  await page.getByTestId('tray-morphism-mor-parser').click();
  const node = page.locator(`.react-flow__node[data-id="${placed('morphism', 'mor-parser')}"]`);
  await expect(node).toBeVisible();
  await expect(page.getByTestId('tray-morphism-mor-parser')).toHaveCount(0);

  // The ✕ affordance returns it to the tray and removes the node.
  await node.hover();
  await page.getByTestId('remove-machine-mor-parser').click();
  await expect(node).toHaveCount(0);
  await expect(page.getByTestId('tray-morphism-mor-parser')).toBeVisible();
});

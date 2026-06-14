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

async function openPuzzle1(page: Page) {
  await page.goto('/');
  await page.getByTestId('theme-data').click();
  await page.getByTestId('puzzle-link-puzzle-01').click();
  await expect(page.locator('.react-flow__node[data-id="n-a"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="n-parser"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="n-shred"]')).toBeVisible();
  await page.waitForTimeout(400); // let fitView settle
}

test('solving requires the right BEHAVIOR, not just a matching type', async ({ page }) => {
  await openPuzzle1(page);

  // Wire the machine that actually makes a clean table.
  await connect(page, right('n-a'), left('n-parser'));
  await connect(page, right('n-parser'), left('n-b'));

  await page.getByTestId('run-check').click();
  await expect(page.getByTestId('solved')).toBeVisible();
  await expect(page.getByText('What you learned')).toBeVisible();
  await expect(page.getByText('1 / 1 pass')).toBeVisible();
});

test('a same-typed but wrong-behaved machine (Shredder) is rejected', async ({ page }) => {
  await openPuzzle1(page);

  // The Shredder is also A→B (same color), but it produces the wrong value.
  await connect(page, right('n-a'), left('n-shred'));
  await connect(page, right('n-shred'), left('n-b'));

  await page.getByTestId('run-check').click();
  await expect(page.getByText('Not quite yet')).toBeVisible();
  // The failing test case shows the wrong value it actually produced.
  await expect(page.getByText('0 / 1 pass')).toBeVisible();
  await expect(page.getByText('shredded mess', { exact: false })).toBeVisible();
  await expect(page.getByTestId('solved')).toHaveCount(0);
});

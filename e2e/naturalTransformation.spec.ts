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

test('a player can build a natural transformation (Chapter 6)', async ({ page }) => {
  await page.goto('/?debug=true');
  await page.getByTestId('theme-data').click();
  await page.getByTestId('puzzle-link-puzzle-21').click();

  await expect(page.locator('.react-flow__node[data-id="source:object:obj-a"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="target:morphism:d-shA"]')).toBeVisible();
  await page.waitForTimeout(400);

  // Choose the safeHead component at each object.
  await connect(page, right('source:object:obj-a'), left('target:morphism:d-shA'));
  await connect(page, right('source:object:obj-b'), left('target:morphism:d-shB'));

  await page.getByTestId('run-check').click();
  await expect(page.getByTestId('solved')).toBeVisible();
  await expect(page.getByText('What you learned')).toBeVisible();
});

test('an incomplete transformation is rejected', async ({ page }) => {
  await page.goto('/?debug=true');
  await page.getByTestId('theme-data').click();
  await page.getByTestId('puzzle-link-puzzle-21').click();
  await expect(page.locator('.react-flow__node[data-id="source:object:obj-a"]')).toBeVisible();

  await page.getByTestId('run-check').click();
  await expect(page.getByText('Not natural yet')).toBeVisible();
  await expect(page.getByTestId('solved')).toHaveCount(0);
});

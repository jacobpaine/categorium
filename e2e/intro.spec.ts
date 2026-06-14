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

test('the theme picker offers the walkthrough', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('start-walkthrough')).toBeVisible();
  await page.getByTestId('start-walkthrough').click();
  await expect(page.getByTestId('tour-progress')).toHaveText('Step 1 of 5');
});

test('walkthrough: solving the first step advances to the next', async ({ page }) => {
  await page.goto('/intro');
  await expect(page.locator('.react-flow__node[data-id="n-f"]')).toBeVisible();
  await page.waitForTimeout(400);

  // Build A -> f -> B and run.
  await connect(page, right('n-a'), left('n-f'));
  await connect(page, right('n-f'), left('n-b'));
  await page.getByTestId('run-check').click();

  await expect(page.getByTestId('solved')).toBeVisible();
  await expect(page.getByText('What you learned')).toBeVisible();

  await page.getByTestId('tour-next').click();
  await expect(page.getByTestId('tour-progress')).toHaveText('Step 2 of 5');
});

test('toggling formal labels shows them immediately, without a reset', async ({ page }) => {
  await page.goto('/intro');
  const node = page.locator('.react-flow__node[data-id="n-a"]');
  await expect(node).toBeVisible();
  await page.waitForTimeout(400);

  // The formal label badge ("A") is hidden until the toggle is on.
  await expect(node.getByText('A', { exact: true })).toHaveCount(0);
  await page.getByLabel('Formal labels').check();
  await expect(node.getByText('A', { exact: true })).toBeVisible();
  // And turning it back off hides them again — all live, no remount.
  await page.getByLabel('Formal labels').uncheck();
  await expect(node.getByText('A', { exact: true })).toHaveCount(0);
});

test('the notation box writes the notation for what you build', async ({ page }) => {
  await page.goto('/intro');
  await expect(page.locator('.react-flow__node[data-id="n-a"]')).toBeVisible();
  await page.waitForTimeout(400);

  // Empty board: a prompt.
  await expect(page.getByText('Select an object, or wire an arrow')).toBeVisible();

  // Selecting an object populates it.
  await page.locator('.react-flow__node[data-id="n-a"]').click({ position: { x: 30, y: 20 } });
  await expect(page.getByText('Selected object')).toBeVisible();

  // Wiring A → f → B writes the arrow as f : A → B.
  await connect(page, right('n-a'), left('n-f'));
  await connect(page, right('n-f'), left('n-b'));
  await expect(page.getByText('f : A → B', { exact: false })).toBeVisible();
});

test('hovering an element reveals what it represents', async ({ page }) => {
  await page.goto('/intro');
  const machine = page.locator('.react-flow__node[data-id="n-f"]');
  await expect(machine).toBeVisible();
  await page.waitForTimeout(400);

  // The hover-card is a role="tooltip" inside the node, revealed on hover (pure CSS).
  const card = machine.getByRole('tooltip');
  await expect(card).toBeHidden();
  await machine.hover();
  await expect(card).toBeVisible();
  await expect(card).toContainText('cleans the data');
  await expect(card).toContainText('A → B');
});

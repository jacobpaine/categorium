import { test, expect, type Page } from '@playwright/test';

/**
 * Drag from one React Flow handle to another to create a wire. Source handles are on the right
 * of a node, target handles on the left (see ObjectTerminalNode / MachineNode).
 */
async function connect(page: Page, fromSelector: string, toSelector: string) {
  const from = page.locator(fromSelector);
  const to = page.locator(toSelector);
  const a = await from.boundingBox();
  const b = await to.boundingBox();
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

const rightHandle = (nodeId: string) =>
  `.react-flow__node[data-id="${nodeId}"] .react-flow__handle-right`;
const leftHandle = (nodeId: string) =>
  `.react-flow__node[data-id="${nodeId}"] .react-flow__handle-left`;

test('a player can solve Puzzle 1 by wiring the machine', async ({ page }) => {
  await page.goto('/');

  // Theme selection -> chapter map -> puzzle 1.
  await page.getByTestId('theme-data').click();
  await page.getByTestId('puzzle-link-puzzle-01').click();

  // Canvas renders the three pre-placed nodes.
  await expect(page.locator('.react-flow__node[data-id="n-a"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="n-f"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="n-b"]')).toBeVisible();
  await page.waitForTimeout(400); // let fitView settle before measuring handles

  // Wire start -> machine -> goal.
  await connect(page, rightHandle('n-a'), leftHandle('n-f'));
  await connect(page, rightHandle('n-f'), leftHandle('n-b'));
  await expect(page.locator('.react-flow__edge')).toHaveCount(2);

  // Run / Check -> success, reveal, and a Next-puzzle affordance.
  await page.getByTestId('run-check').click();
  await expect(page.getByTestId('solved')).toBeVisible();
  await expect(page.getByText('What you learned')).toBeVisible();
  await expect(page.getByTestId('next-puzzle')).toBeVisible();

  // A sample token animates along the solved path.
  await expect(page.locator('.react-flow__node-sampleToken')).toBeVisible();
});

test('running with no wires shows a hint instead of success', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('theme-data').click();
  await page.getByTestId('puzzle-link-puzzle-01').click();
  await expect(page.locator('.react-flow__node[data-id="n-a"]')).toBeVisible();

  await page.getByTestId('run-check').click();
  await expect(page.getByText('Not quite yet')).toBeVisible();
  await expect(page.getByTestId('solved')).toHaveCount(0);
});

import { expect, test } from '@playwright/test';
import { game, newGame, skipCutscenes, trackErrors, waitUntilIdle } from './helpers';

// Each test gets a fresh browser context, so it starts with empty storage.

test('title screen loads without errors', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/?e2e');
  await expect(page.locator('#overlay h1')).toHaveText('The Eclipse Crown');
  await expect(page.locator('#view > canvas:not(#mapov)')).toBeVisible();
  expect(errors).toEqual([]);
});

test('new game: the party can walk and turn', async ({ page }) => {
  const errors = trackErrors(page);
  await newGame(page);
  const start = await game<{ x: number; y: number; dir: number; time: number }>(
    page,
    '({ x: EC.S.x, y: EC.S.y, dir: EC.S.dir, time: EC.S.time })',
  );

  // Turn until the tile ahead is open, then step forward.
  let moved = false;
  for (let turn = 0; turn < 4 && !moved; turn++) {
    await page.keyboard.press('w');
    await waitUntilIdle(page);
    const now = await game<{ x: number; y: number }>(page, '({ x: EC.S.x, y: EC.S.y })');
    moved = now.x !== start.x || now.y !== start.y;
    if (!moved) {
      await page.keyboard.press('d');
      await waitUntilIdle(page);
    }
  }
  expect(moved).toBe(true);
  expect(await game<number>(page, 'EC.S.time')).toBeGreaterThan(start.time);
  expect(errors).toEqual([]);
});

test('a fight can be won and play returns to exploring', async ({ page }) => {
  const errors = trackErrors(page);
  await newGame(page);
  const xpBefore = await game<number>(page, 'EC.S.party.reduce((t, p) => t + p.xp, 0)');
  await page.evaluate(() => (window as any).__EC.startCombat(['rat']));
  await expect.poll(() => game(page, 'EC.S.mode'), { timeout: 20_000 }).toBe('combat');

  // Attack on every hero turn until the fight ends.
  await expect(async () => {
    const mode = await game<string>(page, 'EC.S.mode');
    if (mode === 'combat') {
      const attack = page.locator('[data-act="attack"]:not([disabled])');
      if (await attack.isVisible()) await attack.click({ timeout: 1000 });
    }
    expect(mode).toBe('explore');
  }).toPass({ timeout: 60_000, intervals: [400] });

  await skipCutscenes(page);
  expect(await game<number>(page, 'EC.S.party.reduce((t, p) => t + p.xp, 0)')).toBeGreaterThan(xpBefore);
  expect(errors).toEqual([]);
});

test('a saved game continues after a reload', async ({ page }) => {
  const errors = trackErrors(page);
  await newGame(page);
  await page.evaluate(() => {
    const ec = (window as any).__EC;
    ec.S.gold = 4321;
    ec.save(true);
  });
  const saved = await game<{ x: number; y: number; dir: number }>(page, '({ x: EC.S.x, y: EC.S.y, dir: EC.S.dir })');

  await page.reload();
  await page.locator('[data-act="ov-cont"]').click();
  await expect.poll(() => game(page, 'EC.S && EC.S.mode')).toBe('explore');
  expect(await game(page, '({ x: EC.S.x, y: EC.S.y, dir: EC.S.dir })')).toEqual(saved);
  expect(await game<number>(page, 'EC.S.gold')).toBe(4321);
  expect(errors).toEqual([]);
});

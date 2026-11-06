import { expect, test } from '@playwright/test';
import { game, skipCutscenes, trackErrors, waitUntilIdle } from './helpers';

// The free demo (Chapters I and II) ends at the stair down to the Moonspire.
test('the demo ends at the Moonspire stair and play goes on', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/?e2e&demo');
  await expect(page.locator('#overlay .eyebrow')).toHaveText('Free demo · Chapters I and II');
  await page.locator('[data-act="ov-new"]').click();
  await expect.poll(() => game(page, 'EC.S && EC.S.mode'), { timeout: 20_000 }).toBe('explore');
  await skipCutscenes(page);

  // Stand in the Barrow, facing the stair down (x 9, y 13).
  await page.evaluate(() => (window as any).__EC.goTo(1, 8, 13, 1));
  await skipCutscenes(page);
  await page.keyboard.press('w');

  await expect(page.locator('#overlay h1')).toHaveText('The Moonspire Waits', { timeout: 30_000 });
  expect(await game<number>(page, 'EC.S.lvl')).toBe(1);

  await page.locator('[data-act="ov-keep"]').click();
  await expect(page.locator('#overlay')).toBeHidden();
  await waitUntilIdle(page);
  expect(await game<string>(page, 'EC.S.mode')).toBe('explore');
  expect(errors).toEqual([]);
});

test('the full game still goes down into the Moonspire', async ({ page }) => {
  await page.goto('/?e2e');
  await page.locator('[data-act="ov-new"]').click();
  await expect.poll(() => game(page, 'EC.S && EC.S.mode'), { timeout: 20_000 }).toBe('explore');
  await skipCutscenes(page);
  await page.evaluate(() => (window as any).__EC.goTo(1, 8, 13, 1));
  await skipCutscenes(page);
  await page.keyboard.press('w');
  await expect.poll(() => game(page, 'EC.S.lvl'), { timeout: 30_000 }).toBe(2);
});

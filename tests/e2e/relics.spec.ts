import { expect, test } from '@playwright/test';
import { game, newGame, skipCutscenes, trackErrors, waitUntilIdle } from './helpers';

test('a dread champion drops a relic that a hero wears and can pass on', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = trackErrors(page);
  await newGame(page);
  // Look like a save from before relics existed.
  await page.evaluate(() => {
    const S = (window as any).__EC.S;
    delete S.relics;
    S.party.forEach((p: any) => delete p.relic);
  });
  const atkBefore = await game<number>(page, 'EC.S.party[0].atk');

  await page.evaluate(() => (window as any).__EC.startCombat(['wolf'], { elite: true }));
  await expect.poll(() => game(page, 'EC.S.mode'), { timeout: 20_000 }).toBe('combat');
  await expect(async () => {
    const mode = await game<string>(page, 'EC.S.mode');
    if (mode === 'combat') {
      const attack = page.locator('[data-act="attack"]:not([disabled])');
      if (await attack.isVisible()) await attack.click({ timeout: 1000 });
    }
    expect(mode).toBe('explore');
  }).toPass({ timeout: 150_000, intervals: [400] });
  await skipCutscenes(page);
  await waitUntilIdle(page);

  // The first dread champion carries the Wolfmoon Fang, and Aldric takes it up at once.
  expect(await game<string[]>(page, 'EC.S.relics')).toEqual(['fang']);
  expect(await game<string>(page, 'EC.S.party[0].relic')).toBe('fang');
  expect(await game<number>(page, 'EC.S.party[0].atk')).toBeGreaterThanOrEqual(atkBefore);

  // Hand it to Sefa from her sheet.
  await page.locator('.card[data-i="1"]').click();
  await page.locator('#sheet [data-sa="tab"][data-arg="relics"]').click();
  await expect(page.locator('#sheet .rl-head b')).toHaveText("Wolfmoon Fang");
  await page.locator('#sheet [data-sa="relic"][data-arg="fang"]').click();
  expect(await game<string>(page, 'EC.S.party[1].relic')).toBe('fang');
  expect(await game<null>(page, 'EC.S.party[0].relic')).toBeNull();
  await expect(page.locator('#sheet .rl.worn')).toHaveCount(1);
  expect(errors).toEqual([]);
});

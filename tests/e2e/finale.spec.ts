import { expect, test } from '@playwright/test';
import { game, newGame, skipCutscenes, trackErrors, waitUntilIdle } from './helpers';

// The last stretch of the story: kindle the eclipse at the altar, face the Regent,
// win, see the ending, then keep exploring in the epilogue.
test('the altar, the Regent and the ending play through', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = trackErrors(page);
  await newGame(page);

  // Arrive beside the Moonspire altar holding both sigils, with a party strong enough to
  // end the fight quickly (balance is covered by tests/unit/balance.spec.ts).
  await page.evaluate(() => {
    const ec = (window as any).__EC;
    Object.assign(ec.S.flags, { sun: true, moon: true });
    ec.S.time = 20 * 60; // night, so only the altar can make an eclipse
    ec.S.party.forEach((p: any) => Object.assign(p, { atk: 900, hp: 999, maxhp: 999 }));
    ec.goTo(2, 6, 13, 1); // facing east, the altar one step ahead
  });
  await skipCutscenes(page);

  // Step onto the altar: the eclipse is kindled and the game saves.
  await page.keyboard.press('w');
  await waitUntilIdle(page);
  expect(await game<boolean>(page, 'EC.S.time < EC.S.flags.riteUntil')).toBe(true);

  // Turn to the throne and step forward into the Regent's story scene and fight.
  await page.keyboard.press('d');
  await waitUntilIdle(page);
  await page.keyboard.press('w');
  await expect(async () => {
    if (await page.evaluate(() => !!document.querySelector('#saga.on, #chap.on'))) await page.keyboard.press('Escape');
    expect(await game<string>(page, 'EC.S.mode')).toBe('combat');
  }).toPass({ timeout: 45_000, intervals: [400] });
  expect(await game<boolean>(page, 'EC.C.boss')).toBe(true);

  // The fight began from a fresh save at the throne, so a defeat would not cost the run.
  const saved = await page.evaluate(() => localStorage.length);
  expect(saved).toBeGreaterThan(0);

  await expect(async () => {
    if (await page.evaluate(() => !!document.querySelector('#saga.on, #chap.on'))) await page.keyboard.press('Escape');
    const mode = await game<string>(page, 'EC.S.mode');
    if (mode === 'combat') {
      const attack = page.locator('[data-act="attack"]:not([disabled])');
      if (await attack.isVisible()) await attack.click({ timeout: 1000 });
    }
    expect(await game<boolean>(page, 'EC.S.flags.crown')).toBe(true);
  }).toPass({ timeout: 150_000, intervals: [400] });

  // The crown scene, then the ending card.
  await expect(async () => {
    if (await page.evaluate(() => !!document.querySelector('#saga.on, #chap.on'))) await page.keyboard.press('Escape');
    await expect(page.locator('#overlay h1')).toHaveText('The Crown Returns', { timeout: 500 });
  }).toPass({ timeout: 45_000, intervals: [500] });

  // Epilogue: the world stays open.
  await page.locator('[data-act="ov-keep"]').click();
  await skipCutscenes(page);
  expect(await game<string>(page, 'EC.S.mode')).toBe('explore');
  expect(errors).toEqual([]);
});

import { expect, type Page, test } from '@playwright/test';
import { game, newGame, trackErrors } from './helpers';

/** Starts the Regent fight directly and weakens him to the given share of his health. */
async function faceRegent(page: Page, hpShare: number): Promise<void> {
  await page.evaluate(() => (window as any).__EC.startCombat(['regent'], { boss: true }));
  await expect.poll(() => game(page, 'EC.C && EC.C.boss'), { timeout: 20_000 }).toBe(true);
  await page.evaluate((share) => {
    const r = (window as any).__EC.C.enemies[0];
    r.hp = Math.max(1, Math.floor(r.max * share));
  }, hpShare);
}

/** Dismisses the closing scenes until the ending screen shows, and returns its title. */
async function endingTitle(page: Page): Promise<string> {
  const title = page.locator('#overlay:not([hidden]) h1');
  await expect(async () => {
    if (!(await title.isVisible())) await page.keyboard.press('Escape');
    await expect(title).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 60_000, intervals: [400] });
  return (await title.textContent()) ?? '';
}

test('with all twelve pages, playing the Oath spares Caedmon', async ({ page }) => {
  const errors = trackErrors(page);
  await newGame(page);
  await page.evaluate(() => {
    const lore = (window as any).__EC.S.story.lore;
    for (const level of [0, 1, 2, 3]) for (const i of [0, 1, 2]) lore[`${level}:${i}`] = 1;
  });
  await faceRegent(page, 0.4);

  const oath = page.locator('[data-act="oath"]');
  await expect(oath).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('[data-act="flee"]')).toHaveCount(0);
  await oath.click();

  expect(await endingTitle(page)).toBe('The Oath Remembered');
  expect(await game(page, 'EC.S.flags')).toMatchObject({ crown: true, oath: true });
  expect(errors).toEqual([]);
});

test('without the pages, defeating the Regent gives the original ending', async ({ page }) => {
  const errors = trackErrors(page);
  await newGame(page);
  await faceRegent(page, 0);

  // The Oath never appears without the pages; Flee stays in its slot, disabled.
  const attack = page.locator('[data-act="attack"]:not([disabled])');
  await expect(attack).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('[data-act="oath"]')).toHaveCount(0);
  await expect(page.locator('[data-act="flee"]')).toBeDisabled();
  await attack.click();

  expect(await endingTitle(page)).toBe('The Crown Returns');
  expect(await game(page, 'EC.S.flags.oath')).toBeFalsy();
  expect(errors).toEqual([]);
});

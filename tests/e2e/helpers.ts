import { expect, type Page } from '@playwright/test';

/** Fails the test on any uncaught page error or console error. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    // Google Fonts can be blocked in CI; that is not a game error.
    if (m.type() === 'error' && !m.text().includes('fonts.g')) errors.push(`console: ${m.text()}`);
  });
  return errors;
}

/** Reads a value from the running game through the ?e2e hook. */
export function game<T>(page: Page, expr: string): Promise<T> {
  return page.evaluate(`(() => { const EC = window.__EC; return ${expr}; })()`) as Promise<T>;
}

/** Starts a new game from the title screen and skips the prologue and opening scenes. */
export async function newGame(page: Page): Promise<void> {
  await page.goto('/?e2e');
  await page.locator('[data-act="ov-new"]').click();
  await expect.poll(() => game(page, 'EC.S && EC.S.mode'), { timeout: 20_000 }).toBe('explore');
  await skipCutscenes(page);
}

/**
 * Waits until the party can take its next action, dismissing any story scene that a
 * step triggered. Headless Chromium renders with a software GPU at a frame or two per
 * second, so one step can take several seconds.
 */
export async function waitUntilIdle(page: Page): Promise<void> {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (await game<boolean>(page, 'EC.canAct()')) return;
    const scene = await page.evaluate(
      () => !!document.querySelector('#saga.on, #chap.on, #intro.on'),
    );
    if (scene) await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  throw new Error('The party never became free to act');
}

/** Presses Escape through the prologue, chapter cards and story scenes until play is free. */
export async function skipCutscenes(page: Page): Promise<void> {
  // Scenes queue up one after another, so play must stay free for a moment to count.
  let freeSince = 0;
  for (let i = 0; i < 120; i++) {
    if (await game<boolean>(page, 'EC.canAct()')) {
      freeSince ||= Date.now();
      if (Date.now() - freeSince > 2500) return;
    } else {
      freeSince = 0;
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(250);
  }
  throw new Error('Cutscenes did not finish');
}

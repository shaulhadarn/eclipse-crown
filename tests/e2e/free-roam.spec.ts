import { expect, test } from '@playwright/test';
import { game, newGame, trackErrors } from './helpers';

test('free roam: F toggles a first-person mode that walks smoothly and snaps back to the grid', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard play test');
  const errors = trackErrors(page);
  await newGame(page);
  const start = await game<{ x: number; z: number }>(page, '({ x: EC.camera.position.x, z: EC.camera.position.z })');

  await page.keyboard.press('f');
  expect(await game<boolean>(page, 'EC.FR.on')).toBe(true);
  await expect(page.locator('#bRoam')).toHaveText('Free roam: on');

  // Hold W until the camera has moved off the tile centre (the town start faces an open street).
  await page.keyboard.down('w');
  await expect
    .poll(() => game<number>(page, 'Math.hypot(EC.camera.position.x - ' + start.x + ', EC.camera.position.z - ' + start.z + ')'), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0.15);
  await page.keyboard.up('w');

  // Turning free roam off puts the party back in the middle of its tile.
  await page.keyboard.press('f');
  expect(await game<boolean>(page, 'EC.FR.on')).toBe(false);
  const snapped = await game<{ x: number; z: number; tx: number; ty: number }>(
    page,
    '({ x: EC.camera.position.x, z: EC.camera.position.z, tx: EC.S.x, ty: EC.S.y })',
  );
  expect(snapped.x).toBeCloseTo(snapped.tx + 0.5, 5);
  expect(snapped.z).toBeCloseTo(snapped.ty + 0.5, 5);
  expect(errors).toEqual([]);
});

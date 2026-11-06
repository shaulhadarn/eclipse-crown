import { expect, test } from '@playwright/test';
import { expectedRunXP, levelForXP, winRate } from '../../tools/balance-sim.mjs';

// Guards the final fight's difficulty. If a change to monsters, classes or spells moves
// these numbers, run `node tools/balance-sim.mjs` and retune MON.regent on purpose.
test('a typical run reaches the Regent around level 7 or 8', () => {
  const lvl = levelForXP(expectedRunXP());
  expect(lvl).toBeGreaterThanOrEqual(6);
  expect(lvl).toBeLessThanOrEqual(9);
});

test('the Regent is a real fight at the eclipse and hopeless without it', () => {
  const atEclipse = winRate(7, {}, 1500).win;
  expect(atEclipse).toBeGreaterThan(0.75);
  expect(atEclipse).toBeLessThan(0.98);
  expect(winRate(5, {}, 800).win).toBeLessThan(0.6); // rushing in underlevelled is punished
  expect(winRate(8, { eclipse: false }, 300).win).toBeLessThan(0.05);
});

import { expect, test } from '@playwright/test';
import {
  CHEST_RELICS,
  FOE_RELICS,
  RELICS,
  awakeFaces,
  describeFace,
  nextUnfound,
  relicBonus,
} from '../../src/data/relics';

test('a relic gives its sun face by day and its moon face by night', () => {
  // Herald's Black Seal: +1 attack by day, +5 by night.
  expect(relicBonus('seal', 'atk', true, false)).toBe(1);
  expect(relicBonus('seal', 'atk', false, false)).toBe(5);
});

test('in an eclipse both faces wake and add together', () => {
  expect(awakeFaces(true, true)).toEqual(['sun', 'moon']);
  expect(relicBonus('seal', 'atk', true, true)).toBe(6);
  expect(relicBonus('buckle', 'def', false, true)).toBe(4);
});

test('no relic, or an unknown one, gives nothing', () => {
  expect(relicBonus(null, 'atk', true, false)).toBe(0);
  expect(relicBonus('nope', 'atk', true, false)).toBe(0);
  expect(relicBonus('signet', 'crit', true, false)).toBe(0);
});

test('every relic is placed exactly once and every face says something', () => {
  const placed = [...Object.values(CHEST_RELICS).flat(), ...FOE_RELICS];
  expect([...placed].sort()).toEqual(Object.keys(RELICS).sort());
  for (const r of Object.values(RELICS)) {
    expect(describeFace(r.sun)).not.toBe('');
    expect(describeFace(r.moon)).not.toBe('');
  }
});

test('finds come in order and stop when the hoard is empty', () => {
  expect(nextUnfound(['a', 'b'], [])).toBe('a');
  expect(nextUnfound(['a', 'b'], ['a'])).toBe('b');
  expect(nextUnfound(['a', 'b'], ['b', 'a'])).toBeNull();
});

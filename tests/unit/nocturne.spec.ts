import { expect, test } from '@playwright/test';
import { BAR_COUNT, NOCTURNE_BARS, barIndex, heldBars, isOathComplete, noteFreq } from '../../src/story/nocturne';

const allPages = Object.fromEntries(
  [0, 1, 2, 3].flatMap((level) => [0, 1, 2].map((i) => [`${level}:${i}`, 1])),
);

test('every bar has a three-note chord and three beats of melody', () => {
  expect(NOCTURNE_BARS).toHaveLength(12);
  for (const bar of NOCTURNE_BARS) {
    expect(bar.chord).toHaveLength(3);
    expect(bar.melody.reduce((t, [, beats]) => t + beats, 0)).toBe(3);
    for (const [pitch] of [...bar.melody, ...bar.chord.map((p) => [p, 0] as const)]) {
      expect(noteFreq(pitch)).toBeGreaterThan(30);
    }
  }
});

test('the twelve lost pages map one to one onto the twelve bars', () => {
  const bars = Object.keys(allPages).map(barIndex);
  expect(new Set(bars).size).toBe(BAR_COUNT);
  expect(Math.min(...bars)).toBe(0);
  expect(Math.max(...bars)).toBe(BAR_COUNT - 1);
  expect(barIndex('4:0')).toBe(-1);
  expect(barIndex('nonsense')).toBe(-1);
});

test('held bars come back in playing order, and only all twelve complete the Oath', () => {
  expect(heldBars({ '3:2': 1, '0:1': 1, '1:0': 1 })).toEqual([1, 3, 11]);
  expect(heldBars(undefined)).toEqual([]);
  expect(isOathComplete({ '0:0': 1 })).toBe(false);
  expect(isOathComplete(allPages)).toBe(true);
});

test('pitch names convert to equal-tempered frequencies', () => {
  expect(noteFreq('A4')).toBe(440);
  expect(noteFreq('A5')).toBeCloseTo(880);
  expect(noteFreq('C#5')).toBeCloseTo(554.37, 1);
  expect(noteFreq('Bb2')).toBeCloseTo(116.54, 1);
  expect(() => noteFreq('H9')).toThrow();
});

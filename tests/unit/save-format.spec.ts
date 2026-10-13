import { expect, test } from '@playwright/test';
import { SAVE_VERSION, decodeSave, encodeSave, type LevelDef, type SaveState } from '../../src/core/save-format';

const town: LevelDef = { W: 4, H: 3, map: ['####', '#@.#', '####'] };
const cave: LevelDef = { W: 3, H: 3, map: ['###', '#.#', '###'] };

function stateOn(levels: LevelDef[], lvl = 0): SaveState {
  return {
    lvl,
    x: 1,
    y: 1,
    party: [{ name: 'Aldric' }],
    maps: levels.map((l) => l.map.map((r) => r.replace('@', '.').split(''))),
    seen: levels.map((l) => new Array(l.W * l.H).fill(1)),
    gold: 99,
  };
}

test('round-trips a current save', () => {
  const state = stateOn([town, cave]);
  const res = decodeSave(encodeSave(state), [town, cave]);
  expect(res.ok && res.state.gold).toBe(99);
  expect(res.ok && res.notes).toEqual([]);
  expect(JSON.parse(encodeSave(state)).version).toBe(SAVE_VERSION);
});

test('loads a bare v3 save from the single-file build', () => {
  const res = decodeSave(JSON.stringify(stateOn([town, cave])), [town, cave]);
  expect(res.ok).toBe(true);
});

test('adds a level that did not exist when the game was saved', () => {
  const res = decodeSave(encodeSave(stateOn([town])), [town, cave]);
  if (!res.ok) throw new Error(res.reason);
  expect(res.state.maps).toHaveLength(2);
  expect(res.state.seen[1]).toHaveLength(9);
  expect(res.state.seen[0].every((v) => v === 1)).toBe(true); // town progress kept
});

test('rebuilds a resized level and moves the party out of it', () => {
  const bigCave: LevelDef = { W: 5, H: 3, map: ['#####', '#...#', '#####'] };
  const res = decodeSave(encodeSave(stateOn([town, cave], 1)), [town, bigCave]);
  if (!res.ok) throw new Error(res.reason);
  expect(res.state.maps[1][0]).toHaveLength(5);
  expect({ lvl: res.state.lvl, x: res.state.x, y: res.state.y }).toEqual({ lvl: 0, x: 1, y: 1 });
});

test('rejects corrupt saves and saves from a newer version', () => {
  expect(decodeSave('{not json', [town])).toEqual({ ok: false, reason: 'corrupt' });
  expect(decodeSave(null, [town])).toEqual({ ok: false, reason: 'empty' });
  const future = JSON.stringify({ version: SAVE_VERSION + 1, savedAt: 0, state: stateOn([town]) });
  expect(decodeSave(future, [town])).toEqual({ ok: false, reason: 'too-new' });
});

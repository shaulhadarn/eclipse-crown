// Versioned save files.
//
// A save is stored as { version, savedAt, state }. Loading runs every migration from the
// save's version up to SAVE_VERSION, then reconciles the stored world against the current
// level maps, so changing or adding a map no longer makes old saves unloadable.

export const SAVE_VERSION = 4;
export const SAVE_KEY = 'eclipse-crown';
/** Saves written by the single-file build: the raw state object, with no envelope. */
export const LEGACY_SAVE_KEY = 'eclipse-crown-v3';

export interface LevelDef {
  W: number;
  H: number;
  map: string[];
}

/** The game state is still untyped JavaScript; only the fields saves depend on are named. */
export interface SaveState {
  lvl: number;
  x: number;
  y: number;
  maps: string[][][];
  seen: number[][];
  party: unknown[];
  [key: string]: unknown;
}

interface SaveEnvelope {
  version: number;
  savedAt: number;
  state: SaveState;
}

type Migration = (state: SaveState) => SaveState;

/** MIGRATIONS[n] upgrades a version-n state to version n+1. */
const MIGRATIONS: Record<number, Migration> = {
  // v3 (single-file build) to v4: same state shape, now wrapped in an envelope.
  3: (state) => state,
};

export function encodeSave(state: SaveState, now = Date.now()): string {
  const envelope: SaveEnvelope = { version: SAVE_VERSION, savedAt: now, state };
  return JSON.stringify(envelope);
}

export type DecodeResult =
  | { ok: true; state: SaveState; notes: string[] }
  | { ok: false; reason: 'empty' | 'corrupt' | 'too-new' | 'no-migration' };

export function decodeSave(raw: string | null, levels: LevelDef[]): DecodeResult {
  if (!raw) return { ok: false, reason: 'empty' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'corrupt' };
  }
  const envelope = toEnvelope(parsed);
  if (!envelope) return { ok: false, reason: 'corrupt' };
  if (envelope.version > SAVE_VERSION) return { ok: false, reason: 'too-new' };

  let state = envelope.state;
  for (let v = envelope.version; v < SAVE_VERSION; v++) {
    const migrate = MIGRATIONS[v];
    if (!migrate) return { ok: false, reason: 'no-migration' };
    state = migrate(state);
  }
  const notes = reconcileWorld(state, levels);
  return { ok: true, state, notes };
}

function toEnvelope(parsed: unknown): SaveEnvelope | null {
  if (!isObject(parsed)) return null;
  if (typeof parsed.version === 'number' && isState(parsed.state)) {
    return { version: parsed.version, savedAt: Number(parsed.savedAt) || 0, state: parsed.state };
  }
  // A bare state object is a save from the single-file build.
  if (isState(parsed)) return { version: 3, savedAt: 0, state: parsed };
  return null;
}

/**
 * Makes the saved world match the current level maps. Any level whose saved map is
 * missing or has a different size is rebuilt fresh (its opened chests and explored tiles
 * reset). If the party stood on a rebuilt level, it returns to the town start.
 */
export function reconcileWorld(state: SaveState, levels: LevelDef[]): string[] {
  const notes: string[] = [];
  const rebuilt = new Set<number>();
  if (!Array.isArray(state.maps)) state.maps = [];
  if (!Array.isArray(state.seen)) state.seen = [];

  levels.forEach((level, i) => {
    const saved = state.maps[i];
    const fits =
      Array.isArray(saved) &&
      saved.length === level.H &&
      saved.every((row) => Array.isArray(row) && row.length === level.W);
    if (!fits) {
      state.maps[i] = freshMap(level);
      rebuilt.add(i);
      notes.push(`Level ${i} map was rebuilt to match the current world.`);
    }
    const seen = state.seen[i];
    if (rebuilt.has(i) || !Array.isArray(seen) || seen.length !== level.W * level.H) {
      state.seen[i] = new Array(level.W * level.H).fill(0);
    }
  });
  state.maps.length = levels.length;
  state.seen.length = levels.length;

  if (rebuilt.has(state.lvl) || !levels[state.lvl]) {
    const start = findStart(levels[0]);
    state.lvl = 0;
    state.x = start.x;
    state.y = start.y;
    notes.push('The party was moved back to the town start.');
  }
  return notes;
}

function freshMap(level: LevelDef): string[][] {
  return level.map.map((row) => row.split('').map((c) => (c === '@' ? '.' : c)));
}

function findStart(level: LevelDef): { x: number; y: number } {
  for (let y = 0; y < level.map.length; y++) {
    const x = level.map[y].indexOf('@');
    if (x >= 0) return { x, y };
  }
  return { x: 1, y: 1 };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isState(v: unknown): v is SaveState {
  return isObject(v) && Array.isArray(v.party) && typeof v.lvl === 'number' && Array.isArray(v.maps);
}

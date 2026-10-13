// Relics: named treasures with two faces. One face wakes by day, the other by night, and in
// an eclipse both wake at once. Each hero can wear one relic.

export type RelicStat = 'atk' | 'def' | 'crit' | 'spell' | 'heal' | 'regen' | 'sp';
export type RelicFace = Partial<Record<RelicStat, number>>;

export interface Relic {
  name: string;
  sun: RelicFace;
  moon: RelicFace;
  lore: string;
}

export const RELICS: Record<string, Relic> = {
  signet: {
    name: 'Dawnbreak Signet',
    sun: { atk: 3 },
    moon: { def: 2 },
    lore: 'A priest of the Dawn Order wore this ring into the Barrow and never wore it out.',
  },
  lantern: {
    name: "Pilgrim's Lantern",
    sun: { regen: 3 },
    moon: { sp: 1 },
    lore: 'By day its glass warms the hand that holds it. By night it burns blue and steady.',
  },
  buckle: {
    name: "Gravewarden's Buckle",
    sun: { def: 3 },
    moon: { def: 1, crit: 0.05 },
    lore: 'Bone Wardens still salute whoever wears it, a moment before they swing.',
  },
  moonglass: {
    name: "Vess's Moonglass",
    sun: { spell: 0.05 },
    moon: { spell: 0.25 },
    lore: 'A lens of pale glass, ground by Ilyra\'s teacher. Her initials are scratched on the rim.',
  },
  seal: {
    name: "Herald's Black Seal",
    sun: { atk: 1 },
    moon: { atk: 5 },
    lore: 'The Regent\'s mark, pressed into black wax that never cools. It hungers in the dark.',
  },
  shard: {
    name: 'Shard of the Divided Sky',
    sun: { crit: 0.1 },
    moon: { crit: 0.1 },
    lore: 'A sliver of the sky itself, one edge gold and one edge silver. It hums near the Regent.',
  },
  thornheart: {
    name: 'Thornheart Charm',
    sun: { regen: 4 },
    moon: { def: 2 },
    lore: 'A knot of living bramble. It drinks sunlight and gives it back as blood.',
  },
  feather: {
    name: "Tamsin's Owl Feather",
    sun: { heal: 0.15 },
    moon: { crit: 0.15 },
    lore: 'The hermit swears the owl gave it freely. The owl has not said otherwise.',
  },
  bracer: {
    name: 'Barkskin Bracer',
    sun: { def: 4 },
    moon: { regen: 2 },
    lore: 'Grown, not forged, from the hide of a Barkling. It still creaks when the wind turns.',
  },
  wick: {
    name: "Lamplighter's Wick",
    sun: { heal: 0.2 },
    moon: { heal: 0.05, sp: 1 },
    lore: 'Old Maren lit every lamp in Hollowmere with it for forty years, then lost it to a thief.',
  },
  fang: {
    name: 'Wolfmoon Fang',
    sun: { atk: 1 },
    moon: { atk: 4, crit: 0.05 },
    lore: 'Torn from a dread wolf. Under the moon it is warm, as if it remembers running.',
  },
  clasp: {
    name: "Caedmon's Broken Clasp",
    sun: { atk: 3, def: 3 },
    moon: { spell: 0.15, sp: 1 },
    lore: 'The cloak-clasp of the Steward of Hollowmere, snapped in two. Someone kept both halves.',
  },
};

/** Relics found in each level's chests, in the order they are found. */
export const CHEST_RELICS: Record<number, string[]> = {
  1: ['signet', 'buckle'],
  2: ['moonglass', 'shard'],
  3: ['thornheart', 'bracer', 'feather', 'lantern'],
};

/** Relics carried by dread champions and, rarely, by ordinary foes. */
export const FOE_RELICS = ['fang', 'wick', 'seal', 'clasp'];

/** The faces awake under the current sky: one by day or night, both in an eclipse. */
export function awakeFaces(day: boolean, eclipse: boolean): Array<'sun' | 'moon'> {
  if (eclipse) return ['sun', 'moon'];
  return [day ? 'sun' : 'moon'];
}

/** How much of one stat a relic gives under the current sky. Unknown ids give nothing. */
export function relicBonus(
  id: string | null | undefined,
  stat: RelicStat,
  day: boolean,
  eclipse: boolean,
): number {
  const r = id ? RELICS[id] : undefined;
  if (!r) return 0;
  return awakeFaces(day, eclipse).reduce((sum, face) => sum + (r[face][stat] ?? 0), 0);
}

const STAT_TEXT: Record<RelicStat, (v: number) => string> = {
  atk: (v) => `+${v} attack`,
  def: (v) => `+${v} armor`,
  crit: (v) => `+${Math.round(v * 100)}% critical`,
  spell: (v) => `+${Math.round(v * 100)}% spell power`,
  heal: (v) => `+${Math.round(v * 100)}% healing`,
  regen: (v) => `heals ${v} HP each round`,
  sp: (v) => `restores ${v} SP each round`,
};

/** A face as plain words, such as "+3 attack, +5% critical". */
export function describeFace(face: RelicFace): string {
  return (Object.keys(face) as RelicStat[]).map((k) => STAT_TEXT[k](face[k] ?? 0)).join(', ');
}

/**
 * Picks the next relic the party has not found yet from a list, or null when they have
 * them all.
 */
export function nextUnfound(list: string[], owned: string[]): string | null {
  return list.find((id) => !owned.includes(id)) ?? null;
}

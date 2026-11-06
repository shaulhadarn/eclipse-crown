// Balance simulator: estimates how strong the party is when it reaches the Umbral Regent,
// then fights the Regent many times to measure how often a fair party wins.
//
//   node tools/balance-sim.mjs            # report
//   node tools/balance-sim.mjs --json     # machine-readable (used by the unit test)
//
// It reads the real numbers from src/data/constants.js and mirrors the combat formulas in
// src/game/combat.js and src/core/state.js. It is a model, not the game: heroes play a simple,
// sensible script (heal when low, otherwise hit hard), and relics are left out so the
// baseline holds for players who skip them.
import { CLASSES, GEAR_A, GEAR_W, LEVELS, MON, SPELLS, xpNeed } from '../src/data/constants.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ---- 1. How much XP does a normal run collect before the Regent? ------------------------

// Steps a typical player takes in each area before moving on (first visit plus backtracking).
// Hollowmere is safe by day, so it is left out.
export const ROUTE = [
  { lvl: 1, steps: 260, nightShare: 0.5 }, // Barrow: both vaults need a day and a night
  { lvl: 3, steps: 160, nightShare: 0.3 }, // Wildwood: side path, most players see part of it
  { lvl: 2, steps: 200, nightShare: 0.5 }, // Moonspire
];

function fightXP(types, elite) {
  return types.reduce((t, k, i) => t + MON[k].xp * (elite && i === 0 ? 2 : 1), 0);
}

export function expectedRunXP() {
  let xp = 0;
  for (const leg of ROUTE) {
    const L = LEVELS[leg.lvl];
    for (const f of L.fixed) xp += fightXP(f, false);
    for (let s = 0; s < leg.steps; s++) {
      const night = s < leg.steps * leg.nightShare;
      const ch = L.danger + (night ? L.nightExtra : 0);
      const pool = night ? L.pool.concat(L.nightPool, L.nightPool) : L.pool;
      const n = (L.size[0] + L.size[1]) / 2;
      const avg = pool.reduce((t, k) => t + MON[k].xp, 0) / pool.length;
      xp += ch * n * avg * 1.08; // 8% of fights have a dread champion worth double
    }
  }
  return Math.round(xp);
}

export function levelForXP(xp) {
  let lvl = 1;
  while (xp >= xpNeed(lvl)) xp -= xpNeed(lvl++);
  return lvl;
}

// ---- 2. Build the party at a given level -----------------------------------------------

function hero(cls, lvl) {
  const c = CLASSES[cls];
  const g = c.grow;
  const up = lvl - 1;
  const ap = up * 3; // training points: fighters put them in Might, casters in Spirit
  const fighter = cls === 'knight' || cls === 'ranger';
  return {
    cls,
    lvl,
    hp: c.hp + g.hp * up + (fighter ? 0 : 0),
    maxhp: c.hp + g.hp * up,
    sp: c.sp + g.sp * up + (fighter ? 0 : ap * 4),
    maxsp: c.sp + g.sp * up + (fighter ? 0 : ap * 4),
    atk: c.atk + g.atk * up + (fighter ? ap : 0),
    def: c.def + g.def * up,
    spd: c.spd + g.spd * up,
    crit: c.crit,
    spi: fighter ? 0 : ap,
    cd: {},
  };
}

/** Gear a player can afford by the Regent: steel weapons and plate armour. */
export function party(lvl, gear = { w: 2, a: 2 }) {
  return ['knight', 'ranger', 'cleric', 'sorc'].map((cls) => {
    const h = hero(cls, lvl);
    h.atk += GEAR_W[gear.w].b;
    h.def += GEAR_A[gear.a].b;
    return h;
  });
}

// ---- 3. Fight the Regent ---------------------------------------------------------------

export function fightRegent(lvl, { eclipse = true, potions = 4, regent = MON.regent } = {}) {
  const P = party(lvl);
  const R = { hp: regent.hp, max: regent.hp, atk: regent.atk, def: regent.def, spd: regent.spd, turns: 0, tideEvery: regent.tide || 3 };
  const magicMul = eclipse ? 2 : 1;
  const ward = (d) => (eclipse ? d : Math.max(1, Math.round(d * (regent.ward ?? 0.25))));
  let pots = potions;
  let round = 0;
  while (round++ < 80) {
    const q = [];
    P.forEach((p, i) => p.hp > 0 && q.push({ k: 'p', i, init: p.spd + Math.random() * 4 }));
    for (let a = 0; a < 2; a++) q.push({ k: 'e', init: R.spd + Math.random() * 4 - a * 4 });
    q.sort((a, b) => b.init - a.init);
    if (P.wall > 0) P.wall--;
    for (const t of q) {
      if (R.hp <= 0) return { win: true, rounds: round };
      if (P.every((p) => p.hp <= 0)) return { win: false, rounds: round };
      if (t.k === 'p') {
        const p = P[t.i];
        if (p.hp <= 0) continue;
        heroTurn(p, P, R, magicMul, ward, () => (pots > 0 ? (pots--, true) : false));
      } else {
        regentTurn(R, P, eclipse);
      }
    }
  }
  return { win: R.hp <= 0, rounds: round };
}

function hit(p, R, mul = 1) {
  let d = (p.atk + rnd(0, p.atk * 0.6)) * mul - R.def * 0.7;
  if (Math.random() < p.crit) d *= 1.8;
  return Math.max(1, Math.round(d));
}

function spell(p, base, magicMul, R) {
  const pm = magicMul * (1 + p.spi * 0.03);
  return Math.max(1, Math.round(base * pm * rnd(0.9, 1.1) - R.def * 0.3));
}

function heroTurn(p, P, R, magicMul, ward, drink) {
  for (const k in p.cd) if (p.cd[k] > 0) p.cd[k]--;
  const low = P.filter((q) => q.hp > 0 && q.hp < q.maxhp * 0.6).length;
  // Skills a player has by then (see SKILLS in constants.js): Shield Wall, Sanctuary, Falling Star.
  if (p.cls === 'knight' && !p.cd.wall && low >= 2) {
    p.cd.wall = 5;
    P.wall = 3;
    return;
  }
  if (p.cls === 'cleric' && p.lvl >= 3 && low >= 2 && p.sp >= 9) {
    p.sp -= 9;
    const h = Math.round(SPELLS.mend.heal(p.lvl) * 0.6 * 1.25 * magicMul * (1 + p.spi * 0.03));
    P.forEach((q) => q.hp > 0 && (q.hp = Math.min(q.maxhp, q.hp + h)));
    return;
  }
  if (p.cls === 'sorc' && p.lvl >= 5 && p.sp >= 18) {
    p.sp -= 18;
    R.hp -= ward(Math.round(spell(p, 40 + p.lvl * 6, magicMul, R) * 1.2));
    return;
  }
  const hurt = P.filter((q) => q.hp > 0 && q.hp < q.maxhp * 0.45).sort((a, b) => a.hp / a.maxhp - b.hp / b.maxhp)[0];
  const fallen = P.find((q) => q.hp <= 0);
  if (p.cls === 'cleric') {
    if (fallen && p.lvl >= 3 && p.sp >= 12) {
      p.sp -= 12;
      fallen.hp = Math.round(fallen.maxhp * 0.3);
      return;
    }
    if (hurt && p.sp >= 4) {
      p.sp -= 4;
      const h = Math.round(SPELLS.mend.heal(p.lvl) * magicMul * (1 + p.spi * 0.03));
      hurt.hp = Math.min(hurt.maxhp, hurt.hp + h);
      return;
    }
    if (p.sp >= 3) {
      p.sp -= 3;
      R.hp -= ward(spell(p, SPELLS.spark.pow(p.lvl), magicMul, R));
      return;
    }
  }
  if (hurt && hurt.hp < hurt.maxhp * 0.3 && drink()) {
    hurt.hp = Math.min(hurt.maxhp, hurt.hp + 30);
    return;
  }
  if (p.cls === 'sorc') {
    if (p.lvl >= 4 && p.sp >= 14) {
      p.sp -= 14;
      R.hp -= ward(spell(p, SPELLS.starfall.pow(p.lvl), magicMul, R));
      return;
    }
    if (p.sp >= 3) {
      p.sp -= 3;
      R.hp -= ward(spell(p, SPELLS.frost.pow(p.lvl), magicMul, R));
      return;
    }
  }
  if (Math.random() < (p.cls === 'ranger' ? 1 : 0.92)) R.hp -= ward(hit(p, R));
}

/** Mirrors regentTide() in combat.js: Night Tide every few turns, faster once the crown cracks. */
function isTideTurn(R) {
  const every = R.hp <= R.max / 2 ? Math.max(2, R.tideEvery - 1) : R.tideEvery;
  return R.turns % every === 0;
}

function regentTurn(R, P, eclipse) {
  R.turns++;
  const harm = (p, d) => (p.hp = Math.max(0, p.hp - (P.wall > 0 ? Math.ceil(d / 2) : d)));
  if (isTideTurn(R)) {
    // Night Tide hits everyone
    P.forEach((p) => {
      if (p.hp > 0) harm(p, Math.max(2, Math.round((R.atk * 0.75 + rnd(0, 6)) * (eclipse ? 0.6 : 1) - p.def * 0.3)));
    });
    return;
  }
  const w = P.map((p, i) => (p.hp > 0 ? [3, 2, 2, 1.4][i] : 0));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  let ti = 0;
  for (; ti < 4; ti++) if ((r -= w[ti]) <= 0) break;
  const p = P[Math.min(ti, 3)];
  if (Math.random() > 0.88) return;
  harm(p, Math.max(1, Math.round(R.atk + rnd(0, R.atk * 0.5) - p.def * 0.6)));
}

export function winRate(lvl, opts = {}, runs = 2000) {
  let wins = 0;
  let rounds = 0;
  for (let i = 0; i < runs; i++) {
    const r = fightRegent(lvl, opts);
    if (r.win) wins++;
    rounds += r.rounds;
  }
  return { lvl, win: wins / runs, rounds: Math.round((rounds / runs) * 10) / 10 };
}

// ---- Report ----------------------------------------------------------------------------

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const xp = expectedRunXP();
  const lvl = levelForXP(xp);
  const rows = [];
  for (let l = Math.max(2, lvl - 2); l <= lvl + 2; l++) rows.push({ ...winRate(l), noEclipse: winRate(l, { eclipse: false }, 500).win });
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ xp, lvl, rows }));
  } else {
    console.log(`A typical run reaches the Regent with ~${xp} XP per hero: level ${lvl}.`);
    console.log('Win rate against the Regent (at the eclipse / without it):');
    for (const r of rows) console.log(`  level ${r.lvl}: ${(r.win * 100).toFixed(0)}% / ${(r.noEclipse * 100).toFixed(0)}%   (~${r.rounds} rounds)`);
  }
}

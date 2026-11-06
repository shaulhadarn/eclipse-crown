// Test-only handle on the running game, enabled by adding ?e2e to the URL.
// Playwright uses it to read state and start fights without random encounters.
import { C, S } from '../core/state.js';
import { startCombat } from '../game/combat.js';
import { canAct } from '../game/exploration.js';
import { save } from '../core/save.js';
import { buildLevel, snapCamera } from '../render/world.js';

declare global {
  interface Window {
    __EC?: unknown;
  }
}

export function installE2EHook(): void {
  window.__EC = {
    get S() {
      return S;
    },
    get C() {
      return C;
    },
    startCombat,
    canAct,
    save,
    /** Moves the party to a tile on any level, as a fast travel for tests. */
    goTo(lvl: number, x: number, y: number, dir: number) {
      Object.assign(S as unknown as object, { lvl, x, y, dir });
      buildLevel();
      snapCamera();
    },
  };
}

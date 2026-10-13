// Test-only handle on the running game, enabled by adding ?e2e to the URL.
// Playwright uses it to read state and start fights without random encounters.
import { C, FR, S } from '../core/state.js';
import { camera } from '../render/world.js';
import { startCombat } from '../game/combat.js';
import { canAct } from '../game/exploration.js';
import { save } from '../core/save.js';

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
    get FR() {
      return FR;
    },
    get camera() {
      return camera;
    },
    startCombat,
    canAct,
    save,
  };
}

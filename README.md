# The Eclipse Crown

A first-person, turn-based party RPG in the spirit of the classic grid crawlers. Four heroes
of Hollowmere chase the stolen Crown of Two Lights through a town, a wilderness, the Barrow
Catacombs and the Moonspire, under a sky where the sun and the moon change everything.

Built with [three.js](https://threejs.org) and [Vite](https://vite.dev). All art is drawn in code.

## Running it

```bash
npm install
npm run dev        # local dev server with hot reload
npm run build      # type-check and build into dist/
npm test           # unit tests plus play tests in headless Chromium (desktop and phone)
```

Add `?e2e` to the URL to expose a test handle as `window.__EC` (state, `startCombat`, `save`).

## Layout

| Folder | What lives there |
|---|---|
| `src/data` | Maps, monsters, items, spells, heroes |
| `src/core` | Event bus and game state, saves, input, the main loop |
| `src/render` | three.js scene, world building, textures, weather and sky |
| `src/game` | Exploration and combat rules |
| `src/ui` | HUD, side panels, character sheet, message log |
| `src/story` | Prologue, chapters, scenes, banter, lost pages |
| `src/audio` | Music and sound effects (Web Audio) |
| `tests/unit` | Pure logic tests (save format and migrations) |
| `tests/e2e` | Play tests: start a game, walk, win a fight, save and continue |

## Saves

Saves are versioned (`src/core/save-format.ts`). When the save shape changes, bump
`SAVE_VERSION` and add a migration. When a map changes size, or a new level is added, old
saves still load: the changed level is rebuilt fresh and everything else is kept.

## Porting notes

The game was ported from a single 330 KB HTML file. The modules are still plain JavaScript
with the original code style, and they reference each other in cycles. To keep the original
start-up order, each module's first import is the module that preceded it in the old file
(see `src/game/index.js`). Next steps:

1. Untangle the cycles (move shared state into `core/state.js`, pass dependencies in), then
   drop the load-order chain.
2. Convert modules to TypeScript one at a time, starting with `data/` and `core/`.
3. Upgrade three.js from r128 (pinned so the look stays identical) to the current release.

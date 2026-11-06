// Which edition this build is: the full game, or the free demo (Chapters I and II).
//   npm run build:demo   builds the demo (reads .env.demo)
//   ?demo in the URL     previews the demo rules on any build
// VITE_STORE_URL is where the demo's "Get the full game" button points (itch.io, Steam...).

export const DEMO =
  import.meta.env.VITE_EDITION === 'demo' ||
  (typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo'));

export const STORE_URL: string = import.meta.env.VITE_STORE_URL ?? '';

/** The Moonspire (level 2) opens Chapter III, where the demo ends. */
export const DEMO_LAST_LEVEL = 1;
export const isLockedInDemo = (level: number): boolean => DEMO && level === 2;

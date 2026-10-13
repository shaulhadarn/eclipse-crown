// The Broken Nocturne: "Caedmon's Oath", a piece in twelve bars.
//
// Each of the twelve lost pages carries one bar in its margin. The journal plays back
// the bars the party holds, and with all twelve the party can play the whole Oath to
// the Umbral Regent in the final battle, which frees Caedmon instead of destroying him.
//
// The bars are synthesized for now. A recorded piano take can replace scheduleNocturne
// later without changing anything else: bars stay indexed 0 to 11.

type Note = [pitch: string, beats: number];

export interface Bar {
  /** Left-hand broken chord: low, middle, high. */
  chord: [string, string, string];
  /** Right-hand melody; the beats in each bar add up to 3. */
  melody: Note[];
}

/** D minor, climbing through the moon's keys and resolving to D major: both lights at once. */
export const NOCTURNE_BARS: Bar[] = [
  { chord: ['D3', 'A3', 'F4'], melody: [['A4', 2], ['F4', 0.5], ['E4', 0.5]] },
  { chord: ['Bb2', 'F3', 'D4'], melody: [['D5', 1.5], ['C5', 0.5], ['Bb4', 1]] },
  { chord: ['G2', 'D3', 'Bb3'], melody: [['G4', 1], ['Bb4', 1], ['D5', 1]] },
  { chord: ['A2', 'E3', 'C#4'], melody: [['C#5', 2], ['A4', 1]] },
  { chord: ['D3', 'A3', 'F4'], melody: [['F5', 1.5], ['E5', 0.5], ['D5', 1]] },
  { chord: ['G2', 'D3', 'Bb3'], melody: [['D5', 1], ['Bb4', 1], ['G4', 1]] },
  { chord: ['C3', 'G3', 'E4'], melody: [['E5', 1.5], ['D5', 0.5], ['C5', 1]] },
  { chord: ['F2', 'C3', 'A3'], melody: [['A4', 2], ['C5', 1]] },
  { chord: ['Bb2', 'F3', 'D4'], melody: [['D5', 1], ['F5', 1], ['Bb5', 1]] },
  { chord: ['A2', 'E3', 'C#4'], melody: [['A5', 1.5], ['G5', 0.5], ['E5', 1]] },
  { chord: ['G2', 'D3', 'B3'], melody: [['B4', 1], ['D5', 1], ['G5', 1]] },
  { chord: ['D3', 'A3', 'F#4'], melody: [['F#5', 0.5], ['E5', 0.5], ['D5', 2]] },
];

export const BAR_COUNT = NOCTURNE_BARS.length;
const PAGES_PER_LEVEL = 3;

/** Lost pages are keyed "level:index"; page k of level l carries bar l*3+k. */
export function barIndex(pageId: string): number {
  const [level, index] = pageId.split(':').map(Number);
  if (!Number.isInteger(level) || !Number.isInteger(index)) return -1;
  const bar = level * PAGES_PER_LEVEL + index;
  return bar >= 0 && bar < BAR_COUNT ? bar : -1;
}

/** The bars the party holds, in playing order. */
export function heldBars(lore: Record<string, unknown> | undefined): number[] {
  const bars = new Set<number>();
  for (const id of Object.keys(lore ?? {})) {
    const bar = barIndex(id);
    if (bar >= 0) bars.add(bar);
  }
  return [...bars].sort((a, b) => a - b);
}

export function isOathComplete(lore: Record<string, unknown> | undefined): boolean {
  return heldBars(lore).length === BAR_COUNT;
}

const SEMITONES: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

/** Converts a pitch name such as "C#5" or "Bb2" to a frequency in Hz (A4 = 440). */
export function noteFreq(pitch: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(pitch);
  if (!m) throw new Error(`Bad pitch: ${pitch}`);
  const semis = SEMITONES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * Math.pow(2, semis / 12);
}

export interface Performance {
  /** Seconds until the last note has faded. */
  duration: number;
  stop(): void;
}

/**
 * Plays the given bars, in order, on a soft synthesized piano. The left hand rolls each
 * chord across the bar while the right hand carries the melody.
 */
export function scheduleNocturne(
  ctx: AudioContext,
  bars: number[],
  { beat = 0.72, volume = 0.5, delay = 0.05 }: { beat?: number; volume?: number; delay?: number } = {},
): Performance {
  const out = ctx.createGain();
  out.gain.value = volume;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2400;
  tone.connect(out).connect(ctx.destination);

  const start = ctx.currentTime + delay;
  const sources: OscillatorNode[] = [];
  const strike = (pitch: string, at: number, length: number, level: number) => {
    const f = noteFreq(pitch);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(level, at + 0.012);
    env.gain.exponentialRampToValueAtTime(level * 0.35, at + 0.35);
    env.gain.exponentialRampToValueAtTime(0.0001, at + length);
    env.connect(tone);
    // A fundamental plus a quiet octave gives a rounder, more piano-like attack.
    for (const [type, mul, gain] of [['triangle', 1, 1], ['sine', 2, 0.25]] as const) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = f * mul;
      g.gain.value = gain;
      osc.connect(g).connect(env);
      osc.start(at);
      osc.stop(at + length + 0.05);
      sources.push(osc);
    }
  };

  let t = start;
  bars.forEach((index, n) => {
    const bar = NOCTURNE_BARS[index];
    if (!bar) return;
    // Hold the last bar a little longer, like a final ritardando.
    const b = n === bars.length - 1 && index === BAR_COUNT - 1 ? beat * 1.3 : beat;
    bar.chord.forEach((pitch, i) => strike(pitch, t + i * b, b * 3 - i * b + 0.6, 0.16));
    let m = t;
    for (const [pitch, beats] of bar.melody) {
      strike(pitch, m, beats * b + 0.5, 0.3);
      m += beats * b;
    }
    t += b * 3;
  });

  const duration = t - ctx.currentTime + 0.6;
  return {
    duration,
    stop() {
      const now = ctx.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.linearRampToValueAtTime(0, now + 0.25);
      for (const s of sources) {
        try {
          s.stop(now + 0.3);
        } catch {
          // Already stopped.
        }
      }
    },
  };
}

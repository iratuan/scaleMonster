import { NOTES } from './notes';

/** Tolerância, em centavos, para considerar a corda afinada. */
export const IN_TUNE_CENTS = 5;

export const A4_DEFAULT = 440;
export const A4_MIN = 430;
export const A4_MAX = 450;

/** Altura MIDI (fracionária) de uma frequência, em relação à referência A4. */
export function freqToMidi(freq: number, a4 = A4_DEFAULT): number {
  return 69 + 12 * Math.log2(freq / a4);
}

export interface NoteReading {
  name: string;
  octave: number;
  midi: number;
  /** Desvio da nota mais próxima, em centavos (−50 a +50). */
  cents: number;
}

/** Nota mais próxima de uma frequência, com o desvio em centavos. */
export function readNote(freq: number, a4 = A4_DEFAULT): NoteReading {
  const m = freqToMidi(freq, a4);
  const midi = Math.round(m);
  return {
    name: NOTES[((midi % 12) + 12) % 12],
    octave: Math.floor(midi / 12) - 1,
    midi,
    cents: Math.round((m - midi) * 100),
  };
}

/** Desvio, em centavos, de uma frequência em relação a uma altura MIDI alvo. */
export function centsFromTarget(freq: number, targetMidi: number, a4 = A4_DEFAULT): number {
  return Math.round((freqToMidi(freq, a4) - targetMidi) * 100);
}

/** Índice da corda cuja altura está mais perto da frequência. */
export function nearestString(freq: number, strings: { midi: number }[], a4 = A4_DEFAULT): number {
  let best = 0;
  let bestDist = Infinity;
  strings.forEach((s, i) => {
    const d = Math.abs(freqToMidi(freq, a4) - s.midi);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

/** Mediana: remove picos isolados de leitura. */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function isInTune(cents: number): boolean {
  return Math.abs(cents) <= IN_TUNE_CENTS;
}

export function clampA4(value: number): number {
  return Math.min(A4_MAX, Math.max(A4_MIN, Math.round(value)));
}

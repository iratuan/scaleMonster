import data from './scales-data.json';
import { DEFAULT_INSTRUMENT, resolveInstrument, type Instrument, type InstrumentId } from './instruments';
import type { ModeDef, ScaleBank, ScaleContext } from './types';

export const NOTES: readonly string[] = data.notasCromaticas;

export const SCALE_BANK = data.bancoDeEscalas as unknown as ScaleBank;

export const CATEGORIES: string[] = Object.keys(SCALE_BANK);

/** Nome da nota a partir de um índice cromático (C = 0). */
export function noteAt(index: number): string {
  return NOTES[((index % 12) + 12) % 12];
}

/** Nota de uma corda solta mais traste, pela altura MIDI (C = 0 em classe de altura). */
export function noteOnString(instrument: Instrument, string: number, fret: number): string {
  return noteAt(instrument.strings[string].midi + fret);
}

export function modesOf(category: string): string[] {
  return Object.keys(SCALE_BANK[category] ?? {});
}

export function getModeDef(category: string, mode: string): ModeDef | undefined {
  return SCALE_BANK[category]?.[mode];
}

export function getScaleContext(
  root: string,
  category: string,
  mode: string,
  instrument: Instrument | InstrumentId = DEFAULT_INSTRUMENT,
): ScaleContext | null {
  const rootIdx = NOTES.indexOf(root);
  const def = getModeDef(category, mode);
  if (rootIdx < 0 || !def) return null;
  return {
    root,
    rootIdx,
    category,
    mode,
    intervals: def.i,
    notes: new Set(def.i.map((i) => noteAt(rootIdx + i))),
    cagedOffset: def.c,
    instrument: typeof instrument === 'string' ? resolveInstrument(instrument) : instrument,
  };
}

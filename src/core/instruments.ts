/**
 * Instrumentos de cordas. Cada um é um dado: afinação, trastes e filtros de cordas.
 * Alguns têm variantes de número de cordas (baixo 4/5/6, violão 6/7).
 * As cordas vão do topo visual (mais aguda, índice 0) à base.
 */

export type InstrumentId = 'guitarra' | 'violao' | 'baixo' | 'ukulele' | 'cavaco';

export interface StringDef {
  name: string;
  /** Altura MIDI da corda solta (E2 = 40, A4 = 69). */
  midi: number;
}

export interface FilterDef {
  id: string;
  /** Rótulo curto (ex.: "1–3"). O filtro 'all' usa o número de cordas. */
  label: string;
  test: (string: number) => boolean;
}

/** Instrumento já resolvido para um número de cordas. */
export interface Instrument {
  id: InstrumentId;
  /** Chave i18n do nome do instrumento. */
  nameKey: string;
  frets: number;
  strings: StringDef[];
  filters: FilterDef[];
}

/** Especificação do instrumento: todas as variantes de cordas que ele suporta. */
export interface InstrumentSpec extends Instrument {
  variants: number[];
  defaultCount: number;
  tunings: Record<number, StringDef[]>;
}

const ALL: FilterDef = { id: 'all', label: 'all', test: () => true };

/** Filtros de grupos de cordas. Para 6 cordas: 1–3, 1–4, 3–6, 4–6 (como no legado). */
export function filtersFor(count: number): FilterDef[] {
  if (count === 4) {
    return [
      ALL,
      { id: '1-2', label: '1–2', test: (s) => s <= 1 },
      { id: '3-4', label: '3–4', test: (s) => s >= 2 },
      { id: '1-3', label: '1–3', test: (s) => s <= 2 },
      { id: '2-4', label: '2–4', test: (s) => s >= 1 },
    ];
  }
  const n = count;
  return [
    ALL,
    { id: '1-3', label: '1–3', test: (s) => s <= 2 },
    { id: '1-4', label: '1–4', test: (s) => s <= 3 },
    { id: `${n - 3}-${n}`, label: `${n - 3}–${n}`, test: (s) => s >= n - 4 },
    { id: `${n - 2}-${n}`, label: `${n - 2}–${n}`, test: (s) => s >= n - 3 },
  ];
}

const GUITAR_6: StringDef[] = [
  { name: 'E', midi: 64 },
  { name: 'B', midi: 59 },
  { name: 'G', midi: 55 },
  { name: 'D', midi: 50 },
  { name: 'A', midi: 45 },
  { name: 'E', midi: 40 },
];

const BASS_4: StringDef[] = [
  { name: 'G', midi: 43 },
  { name: 'D', midi: 38 },
  { name: 'A', midi: 33 },
  { name: 'E', midi: 28 },
];

function spec(
  id: InstrumentId,
  nameKey: string,
  frets: number,
  tunings: Record<number, StringDef[]>,
  defaultCount: number,
): InstrumentSpec {
  const strings = tunings[defaultCount];
  return {
    id,
    nameKey,
    frets,
    strings,
    filters: filtersFor(strings.length),
    variants: Object.keys(tunings).map(Number).sort((a, b) => a - b),
    defaultCount,
    tunings,
  };
}

const GUITAR_7: StringDef[] = [...GUITAR_6, { name: 'B', midi: 35 }];
const BASS_5: StringDef[] = [...BASS_4, { name: 'B', midi: 23 }];
const BASS_6: StringDef[] = [{ name: 'C', midi: 48 }, ...BASS_5];

export const INSTRUMENTS: Record<InstrumentId, InstrumentSpec> = {
  guitarra: spec('guitarra', 'inst_guitarra', 15, { 6: GUITAR_6 }, 6),
  violao: spec('violao', 'inst_violao', 15, { 6: GUITAR_6, 7: GUITAR_7 }, 6),
  baixo: spec('baixo', 'inst_baixo', 15, { 4: BASS_4, 5: BASS_5, 6: BASS_6 }, 4),
  ukulele: spec(
    'ukulele',
    'inst_ukulele',
    12,
    {
      // Afinação reentrante: a G (4ª corda) é mais aguda que a C.
      4: [
        { name: 'A', midi: 69 },
        { name: 'E', midi: 64 },
        { name: 'C', midi: 60 },
        { name: 'G', midi: 67 },
      ],
    },
    4,
  ),
  cavaco: spec(
    'cavaco',
    'inst_cavaco',
    12,
    {
      4: [
        { name: 'D', midi: 74 },
        { name: 'B', midi: 71 },
        { name: 'G', midi: 67 },
        { name: 'D', midi: 62 },
      ],
    },
    4,
  ),
};

export const INSTRUMENT_LIST: InstrumentSpec[] = Object.values(INSTRUMENTS);

export const DEFAULT_INSTRUMENT: InstrumentId = 'guitarra';

/** Instrumento com o número de cordas escolhido (cai para o padrão se a variante não existir). */
export function resolveInstrument(id: InstrumentId, count?: number): Instrument {
  const s = INSTRUMENTS[id];
  const c = count !== undefined && s.tunings[count] ? count : s.defaultCount;
  const strings = s.tunings[c];
  return { id: s.id, nameKey: s.nameKey, frets: s.frets, strings, filters: filtersFor(strings.length) };
}

/** Frequência (Hz) de uma altura MIDI, com A4 = 440 Hz. */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function filterFor(instrument: Instrument, id: string) {
  return instrument.filters.find((f) => f.id === id) ?? instrument.filters[0];
}

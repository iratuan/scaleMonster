import { midiToFreq, type StringDef } from './instruments';
import { NOTES } from './notes';
import type { PlayNote } from './types';

/**
 * Acordes: tipos (intervalos a partir da tônica), nomes e digitações.
 *
 * Violão e guitarra (afinação padrão): formas CAGED móveis. Cada forma é um formato aberto (E, A, C, G, D)
 * que se desloca no braço; a fundamental fica na corda indicada e as demais cordas seguem o desenho.
 * Escolhe-se a forma que cai no traste mais baixo.
 *
 * Demais instrumentos (e tipos sem forma CAGED): gerador por busca, que toca fundamental, terça e quinta
 * com cordas contíguas, numa janela curta de trastes, e prefere a fundamental na corda mais grave.
 */

export type ChordTypeId = 'maj' | 'min' | '7' | 'maj7' | 'min7' | 'dim' | 'aug' | 'sus2' | 'sus4';

/** Intervalos em semitons a partir da tônica. Os três primeiros são obrigatórios na digitação. */
export const CHORD_TYPES: Record<ChordTypeId, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
};

export const CHORD_TYPE_IDS = Object.keys(CHORD_TYPES) as ChordTypeId[];

/** Sufixo do nome do acorde (ex.: "m" em Dm). */
export const CHORD_SUFFIX: Record<ChordTypeId, string> = {
  maj: '',
  min: 'm',
  '7': '7',
  maj7: 'maj7',
  min7: 'm7',
  dim: 'º',
  aug: '+',
  sus2: 'sus2',
  sus4: 'sus4',
};

export function chordName(rootIdx: number, type: ChordTypeId): string {
  return `${NOTES[rootIdx]}${CHORD_SUFFIX[type]}`;
}

export interface Voicing {
  /** Notas do acorde, da mais grave à mais aguda (ordem do arpejo). */
  notes: PlayNote[];
  /** Janela de trastes para mostrar a forma. */
  start: number;
  end: number;
  /** Nome da forma CAGED usada (ex.: "E"), quando houver. */
  shape?: string;
}

/** Forma CAGED: a corda da fundamental e o desvio de traste de cada corda em relação a ela (null = muda). */
export interface CagedShape {
  name: 'C' | 'A' | 'G' | 'E' | 'D';
  /** Índice da corda da fundamental (0 = corda mais aguda). */
  rootString: number;
  /** Desvio de traste por corda (0 = mais aguda, 5 = mais grave), em relação ao traste da fundamental. */
  offsets: (number | null)[];
}

/**
 * Formas CAGED móveis para violão e guitarra de 6 cordas (afinação padrão). Os desvios vêm dos formatos
 * abertos: E (fundamental na 6ª corda), A (na 5ª), C (na 5ª), G (na 6ª), D (na 4ª).
 * Menores: E, A e D. Sétimas: E, A, C, G e D.
 */
export const CAGED_SHAPES: Record<'maj' | 'min' | '7', CagedShape[]> = {
  maj: [
    { name: 'E', rootString: 5, offsets: [0, 0, 1, 2, 2, 0] },
    { name: 'A', rootString: 4, offsets: [0, 2, 2, 2, 0, null] },
    { name: 'C', rootString: 4, offsets: [-3, -2, -3, -1, 0, null] },
    { name: 'G', rootString: 5, offsets: [0, -3, -3, -3, -1, 0] },
    { name: 'D', rootString: 3, offsets: [2, 3, 2, 0, null, null] },
  ],
  min: [
    { name: 'E', rootString: 5, offsets: [0, 0, 0, 2, 2, 0] },
    { name: 'A', rootString: 4, offsets: [0, 1, 2, 2, 0, null] },
    { name: 'D', rootString: 3, offsets: [1, 3, 2, 0, null, null] },
  ],
  '7': [
    { name: 'E', rootString: 5, offsets: [0, 0, 1, 0, 2, 0] },
    { name: 'A', rootString: 4, offsets: [0, 2, 0, 2, 0, null] },
    { name: 'C', rootString: 4, offsets: [-3, -2, 0, -1, 0, null] },
    { name: 'G', rootString: 5, offsets: [-2, -3, -3, -3, -1, 0] },
    { name: 'D', rootString: 3, offsets: [2, 1, 2, 0, null, null] },
  ],
};

/** Afinação padrão de violão e guitarra, da corda mais aguda à mais grave (6 cordas). */
const STANDARD_6 = [64, 59, 55, 50, 45, 40];

/** Largura máxima da mão em trastes no gerador por busca. */
const SPAN = 3;

const cache = new Map<string, Voicing | null>();

function isStandardGuitar(strings: StringDef[]): boolean {
  return strings.length >= 6 && STANDARD_6.every((m, i) => strings[i].midi === m);
}

/**
 * Forma CAGED de menor traste que toca o acorde. Para cada forma e cada traste da fundamental, confere se
 * todas as cordas ficam dentro do braço.
 */
function cagedVoicing(strings: StringDef[], maxFret: number, rootIdx: number, type: 'maj' | 'min' | '7'): Voicing | null {
  let best: { r: number; shape: CagedShape; frets: (number | null)[] } | null = null;
  for (const shape of CAGED_SHAPES[type]) {
    const rootOpen = strings[shape.rootString].midi % 12;
    for (let r = 0; r <= maxFret; r++) {
      if ((rootOpen + r) % 12 !== rootIdx % 12) continue;
      const frets = shape.offsets.map((o) => (o === null ? null : r + o));
      if (frets.some((f) => f !== null && (f < 0 || f > maxFret))) continue;
      if (!best || r < best.r) best = { r, shape, frets };
      break;
    }
  }
  if (!best) return null;
  const notes: PlayNote[] = [];
  best.frets.forEach((f, i) => {
    if (f === null) return;
    const midi = strings[i].midi + f;
    notes.push({ string: i, fret: f, noteIdx: midi % 12, pitch: midiToFreq(midi), absPitch: midi });
  });
  notes.sort((a, b) => a.absPitch - b.absPitch);
  const fretted = notes.map((x) => x.fret).filter((f) => f > 0);
  const lo = fretted.length ? Math.min(...fretted) : 0;
  const hi = fretted.length ? Math.max(...fretted) : 0;
  const start = lo <= 3 ? 0 : lo - 1;
  return { notes, start, end: Math.max(hi, start + 2), shape: best.shape.name };
}

/**
 * Digitação do acorde no instrumento. Cordas ordenadas do topo (mais aguda) para a base.
 * Retorna null se nenhuma forma cobre a fundamental, a terça e a quinta.
 */
export function findVoicing(strings: StringDef[], maxFret: number, rootIdx: number, type: ChordTypeId): Voicing | null {
  const key = `${strings.map((s) => s.midi).join(',')}|${maxFret}|${rootIdx}|${type}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  if (isStandardGuitar(strings) && (type === 'maj' || type === 'min' || type === '7')) {
    const caged = cagedVoicing(strings, maxFret, rootIdx, type);
    if (caged) {
      cache.set(key, caged);
      return caged;
    }
  }

  const intervals = CHORD_TYPES[type];
  const pcs = new Set(intervals.map((i) => (rootIdx + i) % 12));
  const required = intervals.slice(0, 3).map((i) => (rootIdx + i) % 12);
  const root = rootIdx % 12;
  const n = strings.length;

  let best: { cost: number; picks: (number | null)[] } | null = null;
  const picks: (number | null)[] = new Array(n).fill(null);

  const evaluate = () => {
    const played = picks.map((f, i) => (f === null ? null : i)).filter((x): x is number => x !== null);
    if (played.length < 3) return;
    const tones = new Set(played.map((i) => (strings[i].midi + (picks[i] as number)) % 12));
    if (!required.every((pc) => tones.has(pc))) return;
    const fretted = played.map((i) => picks[i] as number).filter((f) => f > 0);
    const lo = fretted.length ? Math.min(...fretted) : 0;
    const hi = fretted.length ? Math.max(...fretted) : 0;
    const lowest = played[played.length - 1];
    const lowestPc = (strings[lowest].midi + (picks[lowest] as number)) % 12;
    const cost = (hi - lo) * 2 + lo * 0.5 - tones.size * 1.5 + (lowestPc === root ? 0 : 9);
    if (!best || cost < best.cost) best = { cost, picks: [...picks] };
  };

  for (let w = 0; w <= maxFret; w++) {
    // Opções por corda: solta (se a nota pertencer ao acorde) ou um traste na janela [w, w+SPAN].
    const options: number[][] = strings.map((s) => {
      const opts: number[] = [];
      for (let f = 0; f <= maxFret; f++) {
        if (!pcs.has((s.midi + f) % 12)) continue;
        if (f === 0 || (f >= w && f <= w + SPAN)) opts.push(f);
      }
      return opts;
    });

    // Fases: antes de tocar (pode mutar), tocando (toca ou para), depois (só muda).
    const walk = (i: number, phase: 'pre' | 'play' | 'post') => {
      if (i === n) {
        evaluate();
        return;
      }
      picks[i] = null;
      walk(i + 1, phase === 'pre' ? 'pre' : 'post');
      if (phase === 'post') return;
      for (const f of options[i]) {
        picks[i] = f;
        walk(i + 1, 'play');
      }
      picks[i] = null;
    };
    walk(0, 'pre');
  }

  if (!best) {
    cache.set(key, null);
    return null;
  }
  const chosen = (best as { picks: (number | null)[] }).picks;
  const notes: PlayNote[] = [];
  chosen.forEach((f, i) => {
    if (f === null) return;
    const midi = strings[i].midi + f;
    notes.push({ string: i, fret: f, noteIdx: midi % 12, pitch: midiToFreq(midi), absPitch: midi });
  });
  notes.sort((a, b) => a.absPitch - b.absPitch);

  const fretted = notes.map((x) => x.fret).filter((f) => f > 0);
  const lo = fretted.length ? Math.min(...fretted) : 0;
  const hi = fretted.length ? Math.max(...fretted) : 0;
  const start = lo <= 3 ? 0 : lo - 1;
  const end = Math.max(hi, start + 2);
  const voicing: Voicing = { notes, start, end };
  cache.set(key, voicing);
  return voicing;
}

/**
 * Acordes diatônicos da escala (tríades nos sete graus). Só vale para escalas de sete notas;
 * nas demais retorna lista vazia. Cada grau traz a qualidade reconhecida pela terça e quinta.
 */
export function diatonicChords(rootIdx: number, intervals: number[]): { degree: number; root: number; type: ChordTypeId }[] {
  const n = intervals.length;
  if (n !== 7) return [];
  const out: { degree: number; root: number; type: ChordTypeId }[] = [];
  for (let i = 0; i < n; i++) {
    const r = intervals[i];
    const third = (intervals[(i + 2) % n] - r + 12) % 12;
    const fifth = (intervals[(i + 4) % n] - r + 12) % 12;
    let type: ChordTypeId | null = null;
    if (third === 4 && fifth === 7) type = 'maj';
    else if (third === 3 && fifth === 7) type = 'min';
    else if (third === 3 && fifth === 6) type = 'dim';
    else if (third === 4 && fifth === 8) type = 'aug';
    if (type) out.push({ degree: i, root: (rootIdx + r) % 12, type });
  }
  return out;
}

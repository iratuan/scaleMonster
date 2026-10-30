import { midiToFreq } from './instruments';
import { NOTES } from './notes';
import { filterFor } from './instruments';
import type { ExerciseId, FretPair, PlayNote, ScaleContext, StringFilter } from './types';

/** Notas da escala dentro da janela, ordenadas por altura. */
export function candidateNotes(
  ctx: ScaleContext,
  start: number,
  end: number,
  filter: StringFilter,
  isMain: boolean,
): PlayNote[] {
  const inst = ctx.instrument;
  const keep = filterFor(inst, filter).test;
  const temp: PlayNote[] = [];

  for (let s = inst.strings.length - 1; s >= 0; s--) {
    const open = inst.strings[s].midi;
    for (let f = start; f <= end; f++) {
      const noteIdx = (open + f) % 12;
      if (!ctx.notes.has(NOTES[noteIdx])) continue;
      temp.push({
        string: s,
        fret: f,
        noteIdx,
        pitch: midiToFreq(open + f),
        absPitch: open + f,
      });
    }
  }

  // Filtro de cordas ANTES da remoção de repetidas: senão uma cópia fora do grupo escolhido
  // pode vencer a deduplicação e a nota some do grupo.
  const inGroup = temp.filter((n) => keep(n.string));
  let base = inGroup;
  if (!isMain) {
    // Nas posições, a mesma altura só aparece uma vez (prefere o traste mais baixo).
    const byPitch = new Map<number, PlayNote>();
    for (const n of inGroup) {
      const existing = byPitch.get(n.absPitch);
      if (!existing || n.fret < existing.fret) byPitch.set(n.absPitch, n);
    }
    base = [...byPitch.values()];
  }

  return base.sort((a, b) => a.pitch - b.pitch);
}

const upAndDown = (b: PlayNote[]): PlayNote[] => [...b, ...[...b].reverse().slice(1)];

/** Pares de notas separadas por `step` graus da escala: step 2 = terças, 3 = quartas, 4 = quintas. */
const leaps = (list: PlayNote[], step: number): PlayNote[] => {
  const out: PlayNote[] = [];
  for (let i = 0; i + step < list.length; i++) out.push(list[i], list[i + step]);
  return out;
};

/** Grupos de vai e volta: nota, vizinha de cima, nota de novo (1-2-1, 2-3-2...). */
const turns = (list: PlayNote[]): PlayNote[] => {
  const out: PlayNote[] = [];
  for (let i = 0; i + 1 < list.length; i++) out.push(list[i], list[i + 1], list[i]);
  return out;
};

/** Varredura corda a corda, da mais grave para a mais aguda; em cada corda, do traste mais baixo ao mais alto. */
const byString = (list: PlayNote[], stringCount: number): PlayNote[] => {
  const out: PlayNote[] = [];
  for (let s = stringCount - 1; s >= 0; s--) {
    out.push(...list.filter((n) => n.string === s).sort((a, b) => a.fret - b.fret));
  }
  return out;
};

/** Cada nota com a que está uma oitava acima (dir = 1) ou abaixo (dir = -1), quando a janela alcança. */
const octaves = (list: PlayNote[], dir: 1 | -1): PlayNote[] => {
  const out: PlayNote[] = [];
  for (const n of list) {
    const partner = list.find((m) => m.absPitch === n.absPitch + 12 * dir);
    if (partner) out.push(n, partner);
  }
  return out;
};

/** Janelas deslizantes de tamanho k, sobre a lista subindo e descendo. */
function slide(list: PlayNote[], k: number): PlayNote[] {
  const out: PlayNote[] = [];
  for (let i = 0; i <= list.length - k; i++) out.push(...list.slice(i, i + k));
  return out;
}

export function buildSequence(base: PlayNote[], exercise: ExerciseId, rootIdx: number, stringCount = 6): PlayNote[] {
  const rev = [...base].reverse();
  const inRoot = (n: PlayNote, degrees: number[]) => degrees.includes((n.noteIdx - rootIdx + 12) % 12);
  let seq: PlayNote[] = [];

  switch (exercise) {
    case 1:
      seq = upAndDown(base);
      break;
    case 2:
      seq = upAndDown(base).flatMap((n) => [n, n]);
      break;
    case 3:
      seq = upAndDown(base).flatMap((n) => [n, n, n]);
      break;
    case 4:
      seq = [...slide(base, 3), ...slide(rev, 3)];
      break;
    case 5:
      seq = [...slide(base, 4), ...slide(rev, 4)];
      break;
    case 6: {
      for (let i = 0; i <= base.length - 3; i++) seq.push(base[i], base[i + 2]);
      for (let i = 0; i <= rev.length - 3; i++) seq.push(rev[i], rev[i + 2]);
      break;
    }
    case 7:
      seq = upAndDown(base.filter((n) => inRoot(n, [0, 3, 4, 6, 7, 8])));
      break;
    case 8:
      seq = upAndDown(base.filter((n) => inRoot(n, [0, 3, 4, 6, 7, 8, 9, 10, 11])));
      break;
    case 10:
      seq = [...turns(base), ...turns(rev)];
      break;
    case 11:
      seq = [...leaps(base, 3), ...leaps(rev, 3)];
      break;
    case 12:
      seq = [...leaps(base, 4), ...leaps(rev, 4)];
      break;
    case 13: {
      // Três notas por corda: sobe corda a corda e volta pelo mesmo caminho.
      const sweep = byString(base, stringCount);
      seq = [...sweep, ...[...sweep].reverse()];
      break;
    }
    case 14:
      // Ordem de dedos 1-3-2-4 em grupos de quatro notas, subindo e descendo.
      for (let i = 0; i + 3 < base.length; i++) seq.push(base[i], base[i + 2], base[i + 1], base[i + 3]);
      for (let i = 0; i + 3 < rev.length; i++) seq.push(rev[i], rev[i + 2], rev[i + 1], rev[i + 3]);
      break;
    case 15:
      seq = [...octaves(base, 1), ...octaves(rev, -1)];
      break;
    case 9: {
      // Saltos de corda (6-4, 5-3, 4-2...): desce em pares e volta. Para 6 cordas
      // reproduz o padrão 5-3-4-2-3-1-2-0 do app legado.
      const down: number[] = [];
      for (let s = stringCount - 1; s >= 2; s--) down.push(s, s - 2);
      const up = [...down].reverse();
      for (const s of down) seq.push(...base.filter((n) => n.string === s));
      for (const s of up) seq.push(...base.filter((n) => n.string === s).reverse());
      break;
    }
  }

  // Exercícios 2 e 3 repetem cada nota de propósito. Os demais não podem repetir uma nota
  // seguida (nem na junção de janelas nem na virada do ciclo).
  const cleaned = exercise === 2 || exercise === 3 ? seq : cleanCycle(seq);
  return cleaned.length === 0 ? upAndDown(base) : cleaned;
}

/** Remove notas iguais consecutivas e a repetição da nota inicial na virada do ciclo. */
export function cleanCycle(seq: PlayNote[]): PlayNote[] {
  const out: PlayNote[] = [];
  for (const n of seq) if (out.length === 0 || out[out.length - 1].absPitch !== n.absPitch) out.push(n);
  if (out.length > 1 && out[out.length - 1].absPitch === out[0].absPitch) out.pop();
  return out;
}

export function activePairsOf(sequence: PlayNote[]): FretPair[] {
  const seen = new Map<string, FretPair>();
  for (const n of sequence) seen.set(`${n.string}-${n.fret}`, { string: n.string, fret: n.fret });
  return [...seen.values()];
}

export function generateDiagram(
  id: string,
  ctx: ScaleContext,
  start: number,
  end: number,
  exercise: ExerciseId,
  filter: StringFilter,
): { sequence: PlayNote[]; activePairs: FretPair[] } {
  const base = candidateNotes(ctx, start, end, filter, id === 'main');
  const sequence = buildSequence(base, exercise, ctx.rootIdx, ctx.instrument.strings.length);
  return { sequence, activePairs: activePairsOf(sequence) };
}

/**
 * Unidade do exercício: quantas notas formam um padrão completo. A rolagem automática do braço só
 * troca de posição no fim de uma unidade, para não cortar um grupo no meio.
 *  - 1, 2, 3 (sobe e desce / repetições) e 7, 8 (acordes): cada nota é uma unidade.
 *  - 4 (grupos de 3), 5 (grupos de 4), 6 (saltos de terça) e 9 (saltos de corda): o padrão tem 3, 4, 2 e 2 notas.
 *  - 10 (vai e volta): 3 notas. 11 (saltos de quarta) e 12 (saltos de quinta): 2 notas.
 *  - 13 (três notas por corda): 3 notas. 14 (1-3-2-4): 4 notas. 15 (oitavas): 2 notas.
 */
export function exerciseUnit(exercise: ExerciseId): number {
  switch (exercise) {
    case 4:
    case 10:
    case 13:
      return 3;
    case 14:
      return 4;
    case 5:
      return 4;
    case 6:
    case 9:
    case 11:
    case 12:
    case 15:
      return 2;
    default:
      return 1;
  }
}

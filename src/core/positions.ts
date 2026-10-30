import { activePairsOf, buildSequence, candidateNotes } from './exercise';
import { getPositionWindows } from './caged';
import type { DiagramData, ExerciseId, PlayNote, ScaleContext, StringFilter } from './types';

/**
 * Motor do braço.
 *
 *  - Cada posição é um ciclo do exercício dentro da sua janela de trastes.
 *  - A escala completa progride pelas posições: 1, 2, 3, 4 e 5 e depois 4, 3, 2 e 1. Cada posição toca
 *    o ciclo inteiro antes de passar à próxima. Assim o aluno pratica o braço todo, e volta pelo meio.
 *  - A última posição vai até o topo do braço, para nenhuma casa ficar de fora.
 *  - Entre dois ciclos, as notas de passagem (alturas vizinhas da escala) entram no ciclo seguinte.
 */

/** Trecho da escala completa que pertence a uma posição: índices [start, end) em main.sequence. */
export interface PositionSegment {
  pos: number;
  start: number;
  end: number;
  /** Primeira nota do ciclo da posição (depois das notas de ligação que vêm antes). */
  cycle: number;
}

export interface FretboardModel {
  main: DiagramData;
  positions: DiagramData[];
  segments: PositionSegment[];
}

/**
 * Percurso em zigue-zague do exercício 1: posição (índice, 0 = posição 1) e direção.
 * S = varre a posição corda por corda, da mais grave para a mais aguda (cada corda do traste mais baixo
 * ao mais alto). U = sobe, D = desce. Começa varrendo a 1, sobe a 2, desce a 3, sobe a 4, desce a 5;
 * volta pela 4 (sobe), 3 (desce), 2 (sobe) e fecha subindo pela 1.
 */
export const ZIGZAG: Array<[number, 'U' | 'D' | 'S']> = [
  [0, 'S'],
  [1, 'U'],
  [2, 'D'],
  [3, 'U'],
  [4, 'D'],
  [3, 'U'],
  [2, 'D'],
  [1, 'U'],
  [0, 'U'],
];

/** Ordem das posições (índices) numa volta completa: sobe de 1 a n e desce de n-1 a 2. */
export function progressionOrder(n: number): number[] {
  const up = Array.from({ length: n }, (_, i) => i);
  const down = Array.from({ length: Math.max(0, n - 2) }, (_, i) => n - 2 - i);
  return [...up, ...down];
}

/** Posição (índice) que está tocando no passo `step` da escala completa; 0 se não houver. */
export function positionAt(segments: PositionSegment[], step: number): number {
  return segments.find((s) => step >= s.start && step < s.end)?.pos ?? 0;
}

export function buildFretboard(ctx: ScaleContext, exercise: ExerciseId, filter: StringFilter): FretboardModel {
  const frets = ctx.instrument.frets;
  const count = ctx.instrument.strings.length;
  const windows = getPositionWindows(ctx.rootIdx, ctx.cagedOffset, frets);
  const lastWindow = windows.length - 1;

  const positions = windows.map(([start, winEnd], index) => {
    const id = `pos-${index}`;
    const end = index === lastWindow ? frets : winEnd;
    const cells = candidateNotes(ctx, start, end, filter, false);
    const seq = buildSequence(cells, exercise, ctx.rootIdx, count);
    if (seq.length === 0) return { id, start, end, sequence: [], activePairs: [] };

    // O cartão mostra só os trastes realmente usados (mínimo de 3 trastes para ler a forma).
    const used = seq.map((n) => n.fret);
    let lo = Math.min(...used);
    let hi = Math.max(...used);
    if (hi - lo < 2) hi = Math.min(lo + 2, frets);
    lo = Math.max(0, Math.min(lo, hi - 2));
    return { id, start: lo, end: hi, sequence: seq, activePairs: activePairsOf(seq) };
  });

  // Todas as alturas da escala no grupo de cordas, para preencher as passagens entre ciclos.
  const all = candidateNotes(ctx, 0, frets, filter, true);
  const nearest = (h: number, prevFret: number): PlayNote | undefined => {
    let best: PlayNote | undefined;
    for (const c of all) {
      if (c.absPitch !== h) continue;
      if (!best || Math.abs(c.fret - prevFret) < Math.abs(best.fret - prevFret)) best = c;
    }
    return best;
  };
  // Alturas da escala estritamente entre `from` e `to`, em ordem de caminho.
  const passing = (from: PlayNote, to: PlayNote): PlayNote[] => {
    const lo = Math.min(from.absPitch, to.absPitch);
    const hi = Math.max(from.absPitch, to.absPitch);
    const heights = [...new Set(all.map((n) => n.absPitch))]
      .filter((h) => h > lo && h < hi)
      .sort((a, b) => (to.absPitch > from.absPitch ? a - b : b - a));
    const out: PlayNote[] = [];
    let prev = from;
    for (const h of heights) {
      const c = nearest(h, prev.fret);
      if (!c) continue;
      out.push(c);
      prev = c;
    }
    return out;
  };

  // Varredura corda a corda: da corda mais grave para a mais aguda, cada corda do traste mais baixo ao mais alto.
  const stringSweep = (from: number, to: number): PlayNote[] => {
    const cellsAll = candidateNotes(ctx, from, to, filter, true);
    const out: PlayNote[] = [];
    for (let st = count - 1; st >= 0; st--) {
      out.push(...cellsAll.filter((c) => c.string === st).sort((a, b) => a.fret - b.fret));
    }
    return out;
  };

  // Exercício 1: zigue-zague. Cada posição é percorrida numa direção; a seguinte começa perto de onde a
  // anterior terminou, com notas de ligação entre elas. Nenhuma altura da escala fica de fora.
  if (exercise === 1) {
    const seq: PlayNote[] = [];
    const segs: PositionSegment[] = [];
    for (const [k, dir] of ZIGZAG.filter(([idx]) => idx < windows.length)) {
      // A primeira posição começa no traste 0, para que a nota mais grave do instrumento entre no percurso.
      const [ws, wEnd] = windows[k];
      const from = k === 0 ? 0 : ws;
      const to = k === lastWindow ? frets : wEnd;
      const sweep = dir === 'S';
      const cells = sweep ? [] : candidateNotes(ctx, from, to, filter, false);
      const pass = sweep ? stringSweep(from, to) : dir === 'U' ? cells : [...cells].reverse();
      if (pass.length === 0) continue;
      const start = seq.length;
      const last = seq[seq.length - 1];
      if (last) for (const n of passing(last, pass[0])) seq.push(n);
      const cycle = seq.length;
      pass.forEach((note, i) => {
        const prev = seq[seq.length - 1];
        if (i === 0 && prev && prev.absPitch === note.absPitch) return;
        // Alturas que a janela não alcança entre duas notas da passagem também são tocadas.
        if (!sweep && prev && prev.absPitch !== note.absPitch) for (const n of passing(prev, note)) seq.push(n);
        seq.push(note);
      });
      segs.push({ pos: k, start: segs.length === 0 ? 0 : start, end: seq.length, cycle });
    }
    // O percurso fecha na primeira altura do ciclo: a última nota não repete a primeira.
    while (seq.length > 1 && seq[seq.length - 1].absPitch === seq[0].absPitch) seq.pop();
    if (segs.length > 0) segs[segs.length - 1].end = seq.length;
    const zig: DiagramData = { id: 'main', start: 0, end: frets, sequence: seq, activePairs: activePairsOf(seq) };
    return { main: zig, positions, segments: segs };
  }

  // Começa e termina no grave da escala, para nenhuma altura abaixo da posição 1 ficar de fora.
  const lowest = all[0];
  const sequence: PlayNote[] = lowest ? [lowest] : [];
  const segments: PositionSegment[] = [];
  const order = progressionOrder(positions.length);
  for (const pos of order) {
    const seq = positions[pos].sequence;
    if (seq.length === 0) continue;
    const start = sequence.length;
    let cycleStart = start;
    seq.forEach((note, i) => {
      const prev = sequence[sequence.length - 1];
      if (prev && i === 0) {
        // Na junção, a primeira nota do ciclo não repete a última que já foi tocada.
        if (prev.absPitch === note.absPitch) return;
        // Entre posições, as alturas da escala que a janela não alcança são tocadas também.
        for (const n of passing(prev, note)) sequence.push(n);
      }
      // Dentro do ciclo, a escala completa toca o padrão do exercício (saltos, oitavas, grupos) sem notas extras.
      if (i === 0) cycleStart = sequence.length;
      sequence.push(note);
    });
    // O grave inicial (primeiro elemento) pertence ao primeiro ciclo.
    segments.push({ pos, start: segments.length === 0 ? 0 : start, end: sequence.length, cycle: cycleStart });
  }

  if (lowest && sequence.length > 0) {
    const tail = sequence[sequence.length - 1];
    for (const n of passing(tail, lowest)) sequence.push(n);
  }
  // Se a volta já termina no grave, a última nota repetiria a primeira na virada do ciclo.
  while (sequence.length > 1 && sequence[sequence.length - 1].absPitch === sequence[0].absPitch) sequence.pop();
  if (segments.length > 0) segments[segments.length - 1].end = sequence.length;

  const main: DiagramData = {
    id: 'main',
    start: 0,
    end: frets,
    sequence,
    activePairs: activePairsOf(sequence),
  };

  return { main, positions, segments };
}

import { activePairsOf, buildSequence, candidateNotes } from './exercise';
import { getPositionWindows } from './caged';
import type { DiagramData, ExerciseId, ScaleContext, StringFilter } from './types';

/**
 * Motor do braço. Uma única regra para tudo:
 *
 *  - Um conjunto de notas (a escala completa ou uma posição) é tocado pelo exercício escolhido,
 *    com cada altura aparecendo uma vez por passagem (sem repetir nota seguida).
 *  - Cada cartão de posição é um ciclo fechado: sobe até o topo da janela e volta à base.
 *    Nenhuma nota sai da janela da posição.
 *  - A escala completa é uma varredura contínua de todas as alturas do grupo de cordas.
 *    Ela não volta em cada limite de posição: as janelas se sobrepõem, então voltar em todo limite
 *    obrigaria a pular ou repetir notas.
 *  - Destaque = notas que realmente soam. As demais notas da escala aparecem como fantasma.
 */

export interface FretboardModel {
  main: DiagramData;
  positions: DiagramData[];
}

export function buildFretboard(ctx: ScaleContext, exercise: ExerciseId, filter: StringFilter): FretboardModel {
  const frets = ctx.instrument.frets;
  const count = ctx.instrument.strings.length;

  // Escala completa: uma nota por altura, no traste mais baixo de cada altura.
  const mainCells = candidateNotes(ctx, 0, frets, filter, false);
  const mainSeq = buildSequence(mainCells, exercise, ctx.rootIdx, count);
  const main: DiagramData = {
    id: 'main',
    start: 0,
    end: frets,
    sequence: mainSeq,
    activePairs: activePairsOf(mainSeq),
  };

  const positions = getPositionWindows(ctx.rootIdx, ctx.cagedOffset, frets).map(([start, end], index) => {
    const id = `pos-${index}`;
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

  return { main, positions };
}

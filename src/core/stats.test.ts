import { describe, expect, it } from 'vitest';
import {
  accuracyPct,
  compareWithPrevious,
  emptyStats,
  previousSession,
  recordSession,
  type HistoryItem,
} from './stats';

const item = (id: string, hits: number, misses: number): HistoryItem => ({
  id,
  duration: 60,
  hits,
  misses,
  date: '2026-10-30T10:00:00.000Z',
});

describe('accuracyPct', () => {
  it('calcula a taxa de acerto arredondada', () => {
    expect(accuracyPct(3, 1)).toBe(75);
    expect(accuracyPct(2, 1)).toBe(67);
  });

  it('sem notas avaliadas devolve 0 em vez de NaN', () => {
    expect(accuracyPct(0, 0)).toBe(0);
  });
});

describe('previousSession', () => {
  it('acha a rodada mais recente da mesma escala, ignorando as outras', () => {
    const data = {
      history: [item('Dó Maior', 9, 1), item('Lá Menor', 4, 4), item('Dó Maior', 5, 5)],
      scaleStats: {},
    };
    expect(previousSession(data, 'Dó Maior')).toEqual(item('Dó Maior', 9, 1));
  });

  it('é null quando a escala nunca foi praticada', () => {
    expect(previousSession(emptyStats(), 'Dó Maior')).toBeNull();
  });

  it('enxerga a rodada antes de ser gravada a atual', () => {
    const before = recordSession(emptyStats(), {
      scaleName: 'Dó Maior',
      durationSec: 30,
      hits: 6,
      misses: 2,
      missedNotes: [],
    });
    expect(previousSession(before, 'Dó Maior')?.hits).toBe(6);
  });
});

describe('compareWithPrevious', () => {
  it('primeira rodada não tem comparação', () => {
    expect(compareWithPrevious(80, null)).toEqual({ kind: 'first' });
  });

  it('subiu: diferença absoluta e taxa anterior', () => {
    // anterior: 6 de 10 = 60%; agora 80%
    expect(compareWithPrevious(80, item('Dó Maior', 6, 4))).toEqual({
      kind: 'up',
      diff: 20,
      previousPct: 60,
    });
  });

  it('caiu: diferença sempre positiva, com o sentido em kind', () => {
    // anterior: 9 de 10 = 90%; agora 70%
    expect(compareWithPrevious(70, item('Dó Maior', 9, 1))).toEqual({
      kind: 'down',
      diff: 20,
      previousPct: 90,
    });
  });

  it('manteve a taxa', () => {
    expect(compareWithPrevious(50, item('Dó Maior', 1, 1))).toEqual({
      kind: 'same',
      diff: 0,
      previousPct: 50,
    });
  });
});

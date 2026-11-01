export interface ScaleStat {
  timeSpent: number;
  hits: number;
  misses: number;
  /** Chave 'corda-traste' -> quantidade de erros. */
  weakNotes: Record<string, number>;
}

export interface HistoryItem {
  id: string;
  duration: number;
  hits: number;
  misses: number;
  date: string;
}

export interface StatsData {
  history: HistoryItem[];
  scaleStats: Record<string, ScaleStat>;
}

export interface SessionResult {
  scaleName: string;
  durationSec: number;
  hits: number;
  misses: number;
  /** Chaves 'corda-traste' erradas na sessão. */
  missedNotes: string[];
  now?: Date;
}

export interface Analysis {
  mostPlayed: string;
  recommendation: string;
  weakNotes: string[];
  totalTimeSec: number;
}

export const HISTORY_LIMIT = 50;

export function emptyStats(): StatsData {
  return { history: [], scaleStats: {} };
}

/** Acrescenta uma sessão (função pura: devolve um novo objeto). */
export function recordSession(data: StatsData, s: SessionResult): StatsData {
  const prev = data.scaleStats[s.scaleName] ?? { timeSpent: 0, hits: 0, misses: 0, weakNotes: {} };
  const weakNotes = { ...prev.weakNotes };
  for (const key of s.missedNotes) weakNotes[key] = (weakNotes[key] ?? 0) + 1;

  const scaleStat: ScaleStat = {
    timeSpent: prev.timeSpent + s.durationSec,
    hits: prev.hits + s.hits,
    misses: prev.misses + s.misses,
    weakNotes,
  };

  const item: HistoryItem = {
    id: s.scaleName,
    duration: s.durationSec,
    hits: s.hits,
    misses: s.misses,
    date: (s.now ?? new Date()).toISOString(),
  };

  return {
    history: [item, ...data.history].slice(0, HISTORY_LIMIT),
    scaleStats: { ...data.scaleStats, [s.scaleName]: scaleStat },
  };
}

/** Taxa de acerto em % (0 a 100) de uma rodada, arredondada. Sem notas avaliadas, devolve 0. */
export function accuracyPct(hits: number, misses: number): number {
  const total = hits + misses;
  return total > 0 ? Math.round((hits / total) * 100) : 0;
}

/** Última rodada registrada da mesma escala (antes da atual), ou null se for a primeira. */
export function previousSession(data: StatsData, scaleName: string): HistoryItem | null {
  return data.history.find((h) => h.id === scaleName) ?? null;
}

export type Progress =
  | { kind: 'first' }
  | { kind: 'up' | 'down' | 'same'; diff: number; previousPct: number };

/** Compara a taxa atual com a da rodada anterior da mesma escala. */
export function compareWithPrevious(currentPct: number, prev: HistoryItem | null): Progress {
  if (!prev) return { kind: 'first' };
  const previousPct = accuracyPct(prev.hits, prev.misses);
  const diff = currentPct - previousPct;
  if (diff === 0) return { kind: 'same', diff: 0, previousPct };
  return { kind: diff > 0 ? 'up' : 'down', diff: Math.abs(diff), previousPct };
}

export function analyze(data: StatsData): Analysis | null {
  const keys = Object.keys(data.scaleStats);
  if (keys.length === 0) return null;
  const st = data.scaleStats;

  const mostPlayed = keys.reduce((a, b) => (st[a].timeSpent > st[b].timeSpent ? a : b));
  const errorRate = (k: string) => st[k].misses / (st[k].hits || 1);
  const mostMissed = keys.reduce((a, b) => (errorRate(a) > errorRate(b) ? a : b));

  const weakNotes = Object.entries(st[mostMissed].weakNotes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  return {
    mostPlayed,
    recommendation: mostMissed,
    weakNotes,
    totalTimeSec: keys.reduce((acc, k) => acc + st[k].timeSpent, 0),
  };
}

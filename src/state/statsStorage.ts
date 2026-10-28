import { emptyStats, type StatsData } from '../core/stats';

/** Mesma chave do app legado: o histórico de treino é preservado no mesmo navegador. */
const KEY = 'tutor_escalas_stats';

export function loadStats(): StatsData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as Partial<StatsData>;
    return {
      history: Array.isArray(parsed.history) ? parsed.history : [],
      scaleStats: parsed.scaleStats && typeof parsed.scaleStats === 'object' ? parsed.scaleStats : {},
    };
  } catch {
    return emptyStats();
  }
}

export function saveStats(data: StatsData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* armazenamento indisponível: a sessão continua funcionando */
  }
}

export function clearStats(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
}

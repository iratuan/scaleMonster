import { accuracyPct } from './stats';

/**
 * Progresso do aluno: XP, sequência de dias, contadores acumulados e os cinco badges.
 * Função pura: não toca em storage nem em DOM. Os contadores são acumulados aqui,
 * e não recalculados do histórico, porque o histórico é cortado em 50 rodadas.
 */

export type BadgeId = 'riff_master' | 'speed_demon' | 'headbanger' | 'scale_collector' | 'monster_solo';

export interface BadgeDef {
  id: BadgeId;
  /** Nível 1 a 5, na ordem da progressão. */
  level: number;
  /** Nome exibido. Fica no original em todos os idiomas, como na arte. */
  name: string;
  /** Chave i18n do critério, exibida na tela de progresso. */
  requirementKey: string;
}

export const BADGES: readonly BadgeDef[] = [
  { id: 'riff_master', level: 1, name: 'RIFF MASTER', requirementKey: 'badge_req_riff_master' },
  { id: 'speed_demon', level: 2, name: 'SPEED DEMON', requirementKey: 'badge_req_speed_demon' },
  { id: 'headbanger', level: 3, name: 'HEAVY METAL HEADBANGER', requirementKey: 'badge_req_headbanger' },
  { id: 'scale_collector', level: 4, name: 'SCALE COLLECTOR', requirementKey: 'badge_req_scale_collector' },
  { id: 'monster_solo', level: 5, name: 'MONSTER SOLO', requirementKey: 'badge_req_monster_solo' },
];

/** Critérios, em números: mudar aqui muda a regra inteira. */
export const RULES = {
  /** Rodadas com pelo menos uma nota avaliada. */
  headbangerRounds: 10,
  /** Acerto mínimo, em %, para a escala contar como dominada. */
  collectorPct: 80,
  collectorScales: 5,
  /** Velocidade mínima e acerto mínimo para o Speed Demon. */
  speedBpm: 100,
  speedPct: 90,
  speedMinNotes: 8,
  /** Rodada perfeita: nenhum erro, com pelo menos estas notas. */
  perfectMinNotes: 12,
  xpPerHit: 10,
  xpPerfectBonus: 50,
} as const;

export interface RoundResult {
  scaleName: string;
  hits: number;
  misses: number;
  bpm: number;
  /** Data local da rodada (ISO). */
  date: string;
}

export interface Profile {
  version: 1;
  xp: number;
  rounds: number;
  perfectRounds: number;
  /** Dias seguidos de prática, contando hoje. */
  streak: number;
  /** Último dia com prática, 'AAAA-MM-DD' local. */
  lastDay: string | null;
  /** Melhor taxa (%) já atingida em cada escala. */
  bestByScale: Record<string, number>;
  /** Badge conquistado -> data (ISO) da conquista. */
  badges: Partial<Record<BadgeId, string>>;
}

export const PROGRESS_VERSION = 1 as const;

export function emptyProfile(): Profile {
  return {
    version: PROGRESS_VERSION,
    xp: 0,
    rounds: 0,
    perfectRounds: 0,
    streak: 0,
    lastDay: null,
    bestByScale: {},
    badges: {},
  };
}

const formatDay = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Dia local 'AAAA-MM-DD' de uma data ISO. */
export function localDay(iso: string): string {
  return formatDay(new Date(iso));
}

/** Dia anterior a um 'AAAA-MM-DD' (o construtor de Date trata a virada de mês e ano). */
function previousDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return formatDay(new Date(y, m - 1, d - 1));
}

export function isPerfect(r: RoundResult): boolean {
  return r.misses === 0 && r.hits >= RULES.perfectMinNotes;
}

export function roundXp(r: RoundResult): number {
  return r.hits * RULES.xpPerHit + (isPerfect(r) ? RULES.xpPerfectBonus : 0);
}

/** Nível atual: quantos badges já foram conquistados (0 a 5). */
export function currentLevel(p: Profile): number {
  return BADGES.filter((b) => p.badges[b.id]).length;
}

/** Aplica uma rodada ao perfil. Devolve o novo perfil e os badges conquistados nesta rodada. */
export function applyRound(profile: Profile, r: RoundResult): { profile: Profile; unlocked: BadgeId[] } {
  const evaluated = r.hits + r.misses;
  if (evaluated === 0) return { profile, unlocked: [] };

  const day = localDay(r.date);
  let streak = profile.streak;
  if (profile.lastDay === day) {
    // Segunda rodada no mesmo dia: a sequência não muda.
  } else if (profile.lastDay === previousDay(day)) {
    streak += 1;
  } else {
    streak = 1;
  }

  const pct = accuracyPct(r.hits, r.misses);
  const bestByScale = { ...profile.bestByScale };
  bestByScale[r.scaleName] = Math.max(bestByScale[r.scaleName] ?? 0, pct);

  const next: Profile = {
    ...profile,
    xp: profile.xp + roundXp(r),
    rounds: profile.rounds + 1,
    perfectRounds: profile.perfectRounds + (isPerfect(r) ? 1 : 0),
    streak,
    lastDay: day,
    bestByScale,
    badges: { ...profile.badges },
  };

  const earned: Partial<Record<BadgeId, boolean>> = {
    riff_master: next.rounds >= 1,
    speed_demon: r.bpm >= RULES.speedBpm && pct >= RULES.speedPct && evaluated >= RULES.speedMinNotes,
    headbanger: next.rounds >= RULES.headbangerRounds,
    scale_collector:
      Object.values(bestByScale).filter((v) => v >= RULES.collectorPct).length >= RULES.collectorScales,
    monster_solo: isPerfect(r),
  };

  const unlocked: BadgeId[] = [];
  for (const b of BADGES) {
    if (!next.badges[b.id] && earned[b.id]) {
      next.badges[b.id] = r.date;
      unlocked.push(b.id);
    }
  }
  return { profile: next, unlocked };
}

/** Confere se um objeto vindo de fora (arquivo importado ou storage) tem o formato do perfil. */
export function parseProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<Profile>;
  if (o.version !== PROGRESS_VERSION) return null;
  const nums = [o.xp, o.rounds, o.perfectRounds, o.streak];
  if (!nums.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0)) return null;
  if (o.lastDay !== null && typeof o.lastDay !== 'string') return null;
  if (!o.bestByScale || typeof o.bestByScale !== 'object') return null;
  if (!o.badges || typeof o.badges !== 'object') return null;
  const validIds = new Set<string>(BADGES.map((b) => b.id));
  const badges: Profile['badges'] = {};
  for (const [id, date] of Object.entries(o.badges)) {
    if (validIds.has(id) && typeof date === 'string') badges[id as BadgeId] = date;
  }
  return {
    version: PROGRESS_VERSION,
    xp: o.xp as number,
    rounds: o.rounds as number,
    perfectRounds: o.perfectRounds as number,
    streak: o.streak as number,
    lastDay: o.lastDay ?? null,
    bestByScale: o.bestByScale as Record<string, number>,
    badges,
  };
}

import { describe, expect, it } from 'vitest';
import { applyRound, emptyProfile, localDay, parseProfile, RULES, type RoundResult, type Profile } from './progress';
import { profileFromJson, profileToJson } from '../state/progressStorage';

/** Rodada num dia local fixo (meio-dia, para não depender do fuso). */
const round = (over: Partial<RoundResult> & { day?: string } = {}): RoundResult => {
  const day = over.day ?? '2026-10-30';
  return {
    scaleName: 'Dó Maior',
    hits: 6,
    misses: 2,
    bpm: 80,
    date: new Date(`${day}T12:00:00`).toISOString(),
    ...over,
  };
};

const play = (p: Profile, r: RoundResult) => applyRound(p, r);

describe('badges', () => {
  it('primeira rodada concluída conquista o Riff Master (nível 1)', () => {
    const { profile, unlocked } = play(emptyProfile(), round());
    expect(unlocked).toEqual(['riff_master']);
    expect(profile.badges.riff_master).toBeTruthy();
  });

  it('um badge só é conquistado uma vez', () => {
    const first = play(emptyProfile(), round());
    const second = play(first.profile, round({ day: '2026-10-31' }));
    expect(second.unlocked).not.toContain('riff_master');
    expect(second.profile.badges.riff_master).toBe(first.profile.badges.riff_master);
  });

  it('Speed Demon exige taxa alta, pelo menos 8 notas e BPM mínimo', () => {
    const fast = round({ hits: 9, misses: 1, bpm: RULES.speedBpm });
    expect(play(emptyProfile(), fast).unlocked).toContain('speed_demon');

    const slow = round({ hits: 9, misses: 1, bpm: RULES.speedBpm - 1 });
    expect(play(emptyProfile(), slow).unlocked).not.toContain('speed_demon');

    const few = round({ hits: 4, misses: 0, bpm: 140 });
    expect(play(emptyProfile(), few).unlocked).not.toContain('speed_demon');
  });

  it('Headbanger conta rodadas acumuladas (10)', () => {
    let p = emptyProfile();
    for (let i = 0; i < RULES.headbangerRounds - 1; i++) {
      p = play(p, round({ day: `2026-10-${String(i + 1).padStart(2, '0')}` })).profile;
    }
    expect(p.badges.headbanger).toBeUndefined();
    const last = play(p, round({ day: '2026-10-28' }));
    expect(last.unlocked).toContain('headbanger');
  });

  it('Scale Collector exige 80% ou mais em 5 escalas diferentes', () => {
    const scales = ['Dó Maior', 'Lá Menor', 'Sol Maior', 'Ré Maior', 'Mi Menor'];
    let p = emptyProfile();
    scales.slice(0, 4).forEach((scaleName, i) => {
      p = play(p, round({ scaleName, hits: 8, misses: 2, day: `2026-10-${10 + i}` })).profile;
    });
    expect(p.badges.scale_collector).toBeUndefined();
    const fifth = play(p, round({ scaleName: scales[4], hits: 8, misses: 2, day: '2026-10-20' }));
    expect(fifth.unlocked).toContain('scale_collector');
  });

  it('Monster Solo é a rodada perfeita com notas suficientes', () => {
    const perfect = play(emptyProfile(), round({ hits: RULES.perfectMinNotes, misses: 0 }));
    expect(perfect.unlocked).toContain('monster_solo');
    expect(perfect.profile.perfectRounds).toBe(1);

    const short = play(emptyProfile(), round({ hits: RULES.perfectMinNotes - 1, misses: 0 }));
    expect(short.unlocked).not.toContain('monster_solo');
  });
});

describe('XP e sequência', () => {
  it('soma XP por acerto e bônus na rodada perfeita', () => {
    const normal = play(emptyProfile(), round({ hits: 5, misses: 1 })).profile;
    expect(normal.xp).toBe(5 * RULES.xpPerHit);
    const perfect = play(emptyProfile(), round({ hits: 12, misses: 0 })).profile;
    expect(perfect.xp).toBe(12 * RULES.xpPerHit + RULES.xpPerfectBonus);
  });

  it('rodadas no mesmo dia não aumentam a sequência', () => {
    const a = play(emptyProfile(), round({ day: '2026-10-30' })).profile;
    const b = play(a, round({ day: '2026-10-30' })).profile;
    expect(b.streak).toBe(1);
    expect(b.rounds).toBe(2);
  });

  it('dias consecutivos somam, e um dia de folga zera', () => {
    let p = play(emptyProfile(), round({ day: '2026-10-30' })).profile;
    p = play(p, round({ day: '2026-10-31' })).profile;
    expect(p.streak).toBe(2);
    p = play(p, round({ day: '2026-11-02' })).profile;
    expect(p.streak).toBe(1);
  });

  it('a sequência atravessa a virada de mês', () => {
    let p = play(emptyProfile(), round({ day: '2026-10-31' })).profile;
    p = play(p, round({ day: '2026-11-01' })).profile;
    expect(p.streak).toBe(2);
  });

  it('rodada sem notas avaliadas não muda nada', () => {
    const p = emptyProfile();
    expect(play(p, round({ hits: 0, misses: 0 })).profile).toEqual(p);
  });
});

describe('melhor taxa por escala', () => {
  it('guarda sempre o maior valor atingido', () => {
    let p = play(emptyProfile(), round({ hits: 9, misses: 1, day: '2026-10-10' })).profile;
    p = play(p, round({ hits: 5, misses: 5, day: '2026-10-11' })).profile;
    expect(p.bestByScale['Dó Maior']).toBe(90);
  });
});

describe('dia local', () => {
  it('usa a data local, não a UTC', () => {
    expect(localDay(new Date(2026, 9, 31, 23, 30).toISOString())).toBe('2026-10-31');
  });
});

describe('validação e backup', () => {
  it('aceita um perfil válido e descarta badges desconhecidos', () => {
    const p = { ...emptyProfile(), badges: { riff_master: '2026-10-30T12:00:00.000Z', fake: 'x' } };
    const parsed = parseProfile(p);
    expect(parsed?.badges).toEqual({ riff_master: '2026-10-30T12:00:00.000Z' });
  });

  it('recusa versão diferente, números inválidos e lixo', () => {
    expect(parseProfile({ ...emptyProfile(), version: 2 })).toBeNull();
    expect(parseProfile({ ...emptyProfile(), xp: -1 })).toBeNull();
    expect(parseProfile({ ...emptyProfile(), xp: 'muito' })).toBeNull();
    expect(parseProfile(null)).toBeNull();
  });

  it('exporta e importa sem perder nada', () => {
    const { profile } = play(emptyProfile(), round({ hits: 12, misses: 0 }));
    expect(profileFromJson(profileToJson(profile))).toEqual(profile);
  });

  it('recusa um arquivo que não é do app', () => {
    expect(profileFromJson('{"algo":1}')).toBeNull();
    expect(profileFromJson('não é json')).toBeNull();
  });
});

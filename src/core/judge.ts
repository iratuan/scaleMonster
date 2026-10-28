export const TOLERANCE_CENTS = 60;
export const BASE_TOLERANCE_MS = 450;
/** Frames seguidos com a altura certa para aceitar a nota (evita ruído de passagem). */
export const STABLE_FRAMES = 2;
/** Quanto a energia precisa subir de um frame para o outro para contar como ataque (nova nota). */
export const ATTACK_RATIO = 1.25;

/** Janela para tocar a nota: até 450 ms, mas no máximo 90% da duração da nota. */
export function hitWindowMs(bpm: number): number {
  const msPerBeat = Math.round(60000 / bpm);
  return Math.min(BASE_TOLERANCE_MS, msPerBeat * 0.9);
}

export function centsBetween(detected: number, expected: number): number {
  return 1200 * Math.log2(detected / expected);
}

export function isMatch(detected: number, expected: number): boolean {
  if (!Number.isFinite(detected) || detected <= 0) return false;
  return Math.abs(centsBetween(detected, expected)) <= TOLERANCE_CENTS;
}

export type Verdict = 'hit' | 'miss';

interface Target<T> {
  id: T;
  pitch: number;
  deadline: number;
  /** Houve um ataque (energia subiu) depois que a nota foi esperada. */
  attacked: boolean;
  stable: number;
}

/**
 * Julga uma nota esperada. Acerto exige:
 *  1) um ATAQUE novo (a energia sobe). O som do app só decai, então o eco de uma nota anterior
 *     nunca conta como ataque, e uma nota repetida só conta quando é tocada de novo;
 *  2) a altura certa (dentro de 60 centavos) em frames seguidos, depois do ataque.
 * Erro: a janela expira sem acerto.
 */
export class NoteJudge<T> {
  private target: Target<T> | null = null;
  private prevRms = 0;

  expect(id: T, pitch: number, deadline: number): void {
    this.target = { id, pitch, deadline, attacked: false, stable: 0 };
  }

  /**
   * Avalia um frame. `rms` é a energia do frame (0 se não informada); `noiseFloor` o ruído de fundo.
   * Retorna o veredito quando a nota é resolvida.
   */
  feed(detected: number, now: number, rms = 0, noiseFloor = 0): { verdict: Verdict; id: T } | null {
    const attack = rms > noiseFloor && rms > this.prevRms * ATTACK_RATIO;
    this.prevRms = rms;
    const t = this.target;
    if (!t) return null;

    if (attack) t.attacked = true;
    if (t.attacked && isMatch(detected, t.pitch)) {
      t.stable += 1;
      if (t.stable >= STABLE_FRAMES) {
        this.target = null;
        return { verdict: 'hit', id: t.id };
      }
    } else {
      t.stable = 0;
    }

    if (now > t.deadline) {
      this.target = null;
      return { verdict: 'miss', id: t.id };
    }
    return null;
  }

  clear(): void {
    this.target = null;
    this.prevRms = 0;
  }
}

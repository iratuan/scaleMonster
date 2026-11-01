import { emptyProfile, parseProfile, PROGRESS_VERSION, type Profile } from '../core/progress';

/** Chave própria: não mistura com o histórico de rodadas (tutor_escalas_stats). */
const KEY = 'scalemonster_progresso';

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProfile();
    return parseProfile(JSON.parse(raw)) ?? emptyProfile();
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(p: Profile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* armazenamento indisponível: o progresso vale só nesta sessão */
  }
}

/** Arquivo de backup: o aluno leva o progresso para outro aparelho ou guarda uma cópia. */
export function profileToJson(p: Profile): string {
  return JSON.stringify({ app: 'ScaleMonster', ...p }, null, 2);
}

/** Lê um backup. Devolve null se o arquivo não for um progresso válido. */
export function profileFromJson(text: string): Profile | null {
  try {
    const { app: _app, ...rest } = JSON.parse(text) as Record<string, unknown>;
    if (rest.version !== PROGRESS_VERSION) return null;
    return parseProfile(rest);
  } catch {
    return null;
  }
}

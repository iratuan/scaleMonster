import { translate } from '../core/i18n';

/** Título do resumo conforme a taxa de acerto (mesmos limiares do legado). */
export function scoreTitle(lang: string, pct: number): string {
  if (pct >= 95) return translate(lang, 'score_amazing');
  if (pct >= 80) return translate(lang, 'score_great');
  if (pct >= 50) return translate(lang, 'score_good');
  return translate(lang, 'score_retry');
}

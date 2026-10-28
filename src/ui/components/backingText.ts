import type { BackingTrackInfo } from '../../core/backingTrack';

/**
 * Descrição da progressão: "Estilo: <descrição> (<números romanos>)".
 * A tradução cai para o texto padrão quando a chave não existe no idioma.
 */
export function backingTrackText(info: BackingTrackInfo, t: (key: string) => string): string {
  const prefix = t('bt_style');
  const desc = t(info.descKey);
  const description = desc !== info.descKey ? desc : info.fallbackDesc;
  return `${prefix} ${description}${info.suffix}`;
}

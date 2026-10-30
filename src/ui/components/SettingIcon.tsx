import type { ReactNode } from 'react';

/**
 * Ícones planos das configurações: um traço só, na grade de 24 px, com pontas arredondadas.
 * Monocromáticos, sem ladrilho colorido, para manter o app minimalista.
 */

export type SettingIconName =
  | 'fingering'
  | 'inverted'
  | 'autoBpm'
  | 'metronome'
  | 'debug'
  | 'ghost'
  | 'view'
  | 'clef'
  | 'challenge'
  | 'theme'
  | 'volume'
  | 'language'
  | 'backing'
  | 'help';

/** Cor do ladrilho por grupo de opção (cores fixas, legíveis em todos os temas). */
export type SettingTone = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal' | 'gray' | 'indigo';

export const TONE_COLOR: Record<SettingTone, string> = {
  blue: '#0a84ff',
  green: '#30d158',
  orange: '#ff9f0a',
  purple: '#bf5af2',
  red: '#ff453a',
  teal: '#64d2ff',
  gray: '#8e8e93',
  indigo: '#5e5ce6',
};

const GLYPHS: Record<SettingIconName, ReactNode> = {
  // Três pontos de dedilhado (1, 2, 3).
  fingering: (
    <>
      <circle cx="6" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
    </>
  ),
  // Setas que trocam de lado.
  inverted: (
    <>
      <path d="M7 4v14M4 15l3 3 3-3" />
      <path d="M17 20V6M14 9l3-3 3 3" />
    </>
  ),
  // Linha de tendência subindo.
  autoBpm: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  // Metrônomo.
  metronome: (
    <>
      <path d="M8 21l2.5-18h3L16 21z" />
      <path d="M12 14l4-6" />
    </>
  ),
  // Inseto (depuração).
  debug: (
    <>
      <rect x="8" y="8" width="8" height="11" rx="4" />
      <path d="M12 8V5M8 12H4M16 12h4M8.5 16H5M15.5 16H19M9 5l2 2M15 5l-2 2" />
    </>
  ),
  // Olho (notas de apoio).
  ghost: (
    <>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  // Pauta com uma nota.
  view: (
    <>
      <path d="M3 8h18M3 11h18M3 14h18M3 17h18" />
      <circle cx="9" cy="14.5" r="1.8" />
    </>
  ),
  // Nota musical (clave).
  clef: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  // Microfone.
  challenge: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  // Meia-lua e sol (tema).
  theme: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none" />
    </>
  ),
  // Alto-falante.
  volume: <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />,
  // Globo.
  language: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
    </>
  ),
  // Nota musical (play-along).
  backing: <path d="M9 18V5l11-2v13M9 18a2.5 2.5 0 1 1-2.5-2.5M20 16a2.5 2.5 0 1 1-2.5-2.5" />,
  // Interrogação em círculo.
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.6V14M12 17.5v.01" />
    </>
  ),
};

interface SettingIconProps {
  name: SettingIconName;
  tone: SettingTone;
}

/** Ícone de uma opção de configuração: traço monocromático (o grupo de cor não é mais mostrado). */
export function SettingIcon({ name }: SettingIconProps) {
  return (
    <span className="setting-tile" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {GLYPHS[name]}
      </svg>
    </span>
  );
}

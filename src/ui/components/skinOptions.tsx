import type { ReactNode, SVGProps } from 'react';
import type { Skin } from '../../core/types';
import { SKIN_LIST, skinLabelKey } from '../../core/skins';
import type { ComboOption } from './Combobox';
import { MoonIcon, SunIcon } from './Icons';

type P = SVGProps<SVGSVGElement>;

/** Traço de 24 px, como o resto dos ícones do app. */
const glyph = (children: ReactNode) => (p: P) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
    {children}
  </svg>
);

/** Disco de vinil: clássico. */
const VinylIcon = glyph(
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2.5" />
  </>,
);

/** Folha: madeira. */
const LeafIcon = glyph(<path d="M5 19C5 10 10 5 20 4c-1 10-6 15-15 15zM5 19l8-8" />);

/** Lápis: desenho. */
const PencilIcon = glyph(<path d="M4 20l4.5-1 10-10-3.5-3.5-10 10zM13.5 6.5l3.5 3.5" />);

const SKIN_ICON: Record<Skin, ReactNode> = {
  light: <SunIcon width={16} height={16} />,
  dark: <MoonIcon width={16} height={16} />,
  vintage: <VinylIcon />,
  madeira: <LeafIcon />,
  kindle: <PencilIcon />,
};

/** Opções dos seletores de tema (cabeçalho e ajustes), com ícone e nome. */
export function skinOptions(t: (key: string) => string): ComboOption[] {
  return SKIN_LIST.map((k) => ({ value: k, label: t(skinLabelKey(k)), icon: SKIN_ICON[k] }));
}

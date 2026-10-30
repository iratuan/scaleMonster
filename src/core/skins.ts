import type { Skin } from './types';

/** Temas na ordem em que aparecem nos seletores (cabeçalho e ajustes). */
export const SKIN_LIST: Skin[] = ['light', 'dark', 'vintage', 'madeira', 'kindle'];

/** Chave de tradução do nome de cada tema. */
export const skinLabelKey = (skin: Skin) => `skin_${skin}`;

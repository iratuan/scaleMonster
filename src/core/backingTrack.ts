import { NOTES, getModeDef } from './notes';

export interface BackingTrackInfo {
  chords: string[];
  /** Chave i18n da descrição e o texto padrão caso a tradução falte. */
  descKey: string;
  fallbackDesc: string;
  suffix: string;
}

const note = (rootIdx: number, interval: number) => NOTES[(rootIdx + interval) % 12];

/** Progressão sugerida para improvisar sobre a escala atual. */
export function getBackingTrack(rootIdx: number, category: string, mode: string): BackingTrackInfo {
  const n = (i: number) => note(rootIdx, i);
  const pick = (chords: string[], descKey: string, fallbackDesc: string, suffix = ''): BackingTrackInfo => ({
    chords,
    descKey,
    fallbackDesc,
    suffix,
  });

  if (category === 'Modos Gregos' || category === 'Pentatônica') {
    if (mode.includes('Jônio') || mode === 'Maior')
      return pick([n(0), `${n(9)}m`, n(5), n(7)], 'bt_desc_1', 'Progressão Pop/Rock Clássica', ' (I - vi - IV - V)');
    if (mode.includes('Dórico'))
      return pick([`${n(0)}m7`, `${n(5)}7`], 'bt_desc_2', 'Vamp Groove Dórico', ' (im7 - IV7)');
    if (mode.includes('Frígio')) return pick([`${n(0)}m`, n(1)], 'bt_desc_3', 'Vamp Frígio / Metal', ' (im - bII)');
    if (mode.includes('Lídio')) return pick([n(0), n(2)], 'bt_desc_4', 'Vamp Lídio / Sonhador', ' (I - II)');
    if (mode.includes('Mixolídio'))
      return pick([`${n(0)}7`, n(10), n(5)], 'bt_desc_5', 'Clássico Rock do Sul', ' (I7 - bVII - IV)');
    if (mode.includes('Eólio') || mode === 'Menor')
      return pick([`${n(0)}m`, n(8), n(10)], 'bt_desc_6', 'Rock Menor Épico', ' (im - VI - VII)');
    if (mode.includes('Lócrio'))
      return pick([`${n(0)}m7b5`, `${n(1)}m`], 'bt_desc_7', 'Tensão Sombria', ' (im7b5 - bIIm)');
  }
  if (category === 'Escala Blues') {
    if (mode === 'Maior')
      return pick([`${n(0)}7`, `${n(5)}7`, `${n(7)}7`], 'bt_desc_8', 'Blues Texas / Country', ' (I7 - IV7 - V7)');
    return pick([`${n(0)}m7`, `${n(5)}m7`, `${n(7)}m7`], 'bt_desc_9', 'Blues Menor Tradicional', ' (im7 - iv7 - vm7)');
  }
  if (category === 'Menor Harmônica')
    return pick([`${n(0)}m`, `${n(7)}7`], 'bt_desc_10', 'Tensão Neoclássica / Flamenco', ' (im - V7)');
  if (category === 'Menor Melódica')
    return pick([`${n(0)}m(maj7)`, `${n(5)}7`], 'bt_desc_11', 'Jazz Menor / Fusion', ' (im(maj7) - IV7)');
  if (category === 'Escalas Simétricas') {
    if (mode.includes('Diminuta'))
      return pick([`${n(0)}dim7`], 'bt_desc_12', 'Tensão Contínua (Acorde Diminuto Estático)');
    return pick([`${n(0)}aug`], 'bt_desc_13', 'Atmosfera Hexafônica (Acorde Aumentado Estático)');
  }
  return pick([n(0)], 'bt_desc_14', 'Vamp Estático / Drone');
}

export interface HarmonicRow {
  degree: number;
  roman: string;
  root: string;
  quality: '' | 'm' | '°' | '+' | '?';
  third: string;
  fifth: string;
}

/** Campo harmônico diatônico (7 notas). Retorna null para escalas não diatônicas. */
export function harmonicField(rootIdx: number, category: string, mode: string): HarmonicRow[] | null {
  const def = getModeDef(category, mode);
  if (!def || def.i.length !== 7) return null;

  const scaleNotes = def.i.map((i) => note(rootIdx, i));
  const upper = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const lower = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];

  return scaleNotes.map((root, d) => {
    const third = scaleNotes[(d + 2) % 7];
    const fifth = scaleNotes[(d + 4) % 7];
    const r = NOTES.indexOf(root);
    const dist3 = (NOTES.indexOf(third) - r + 12) % 12;
    const dist5 = (NOTES.indexOf(fifth) - r + 12) % 12;

    let quality: HarmonicRow['quality'] = '?';
    let roman = upper[d];
    if (dist3 === 4 && dist5 === 7) {
      quality = '';
    } else if (dist3 === 3 && dist5 === 7) {
      quality = 'm';
      roman = lower[d];
    } else if (dist3 === 3 && dist5 === 6) {
      quality = '°';
      roman = `${lower[d]}°`;
    } else if (dist3 === 4 && dist5 === 8) {
      quality = '+';
      roman = `${upper[d]}+`;
    }
    return { degree: d + 1, roman, root, quality, third, fifth };
  });
}

import { create } from 'zustand';
import { METRO_DEFAULT, clampBpm as clampMetroBpm, type MetroConfig } from '../core/metronome';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { CATEGORIES, modesOf } from '../core/notes';
import { clampBpm } from '../core/autoBpm';
import { LANGS } from '../core/i18n';
import { DEFAULT_INSTRUMENT, INSTRUMENTS, resolveInstrument, type InstrumentId } from '../core/instruments';
import type { ExerciseId, Skin, StringFilter } from '../core/types';
import { CLEF_CHOICES, type ClefChoice } from '../core/notation';

/** localStorage pode estar bloqueado (aba privada, cota, WebView); nunca deve quebrar o app. */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* ignora: o estado continua valendo na sessão */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignora */
    }
  },
};

function detectLang(): string {
  const code = (typeof navigator !== 'undefined' ? navigator.language : 'pt').split('-')[0].toLowerCase();
  return LANGS.some((l) => l.code === code) ? code : 'pt';
}

export interface Settings {
  lang: string;
  skin: Skin;
  instrument: InstrumentId;
  stringCount: number;
  showGhost: boolean;
  /** Referência de afinação (A4) usada pelo afinador. */
  a4: number;
  /** Registra no console cada nota tocada (diagrama, nota, corda, traste, frequência). */
  debug: boolean;
  /** Configuração da ferramenta metrônomo (independente da escala). */
  metro: MetroConfig;
  root: string;
  category: string;
  mode: string;
  exercise: ExerciseId;
  strings: StringFilter;
  bpm: number;
  autoBpm: boolean;
  autoCycles: number;
  fingering: boolean;
  /** Como mostrar a escala completa: no braço ou em partitura. */
  view: 'neck' | 'staff';
  /** Clave da partitura: 'auto' segue o padrão do instrumento. */
  clef: ClefChoice;
  inverted: boolean;
  challenge: boolean;
  metronome: boolean;
  volume: number;
}

export interface SettingsActions {
  setLang: (lang: string) => void;
  setSkin: (skin: Skin) => void;
  setInstrument: (id: InstrumentId) => void;
  setStringCount: (n: number) => void;
  setShowGhost: (on: boolean) => void;
  setA4: (hz: number) => void;
  setDebug: (on: boolean) => void;
  setMetro: (patch: Partial<MetroConfig>) => void;
  setRoot: (root: string) => void;
  setCategory: (category: string) => void;
  setMode: (mode: string) => void;
  setExercise: (exercise: ExerciseId) => void;
  setStrings: (strings: StringFilter) => void;
  setBpm: (bpm: number) => void;
  nudgeBpm: (delta: number) => void;
  setAutoBpm: (on: boolean) => void;
  setAutoCycles: (cycles: number) => void;
  setFingering: (on: boolean) => void;
  setView: (view: 'neck' | 'staff') => void;
  setClef: (clef: ClefChoice) => void;
  setInverted: (on: boolean) => void;
  setChallenge: (on: boolean) => void;
  setMetronome: (on: boolean) => void;
  setVolume: (volume: number) => void;
}

/** Filtro válido para o instrumento; cai para 'all' se não existir nele. */
export function validStrings(instrument: InstrumentId, filter: string, count?: number): StringFilter {
  return resolveInstrument(instrument, count).filters.some((f) => f.id === filter) ? filter : 'all';
}

export const useSettings = create<Settings & SettingsActions>()(
  persist(
    (set, get) => ({
      lang: detectLang(),
      skin: 'dark',
      instrument: DEFAULT_INSTRUMENT,
      stringCount: INSTRUMENTS[DEFAULT_INSTRUMENT].defaultCount,
      showGhost: true,
      a4: 440,
      debug: false,
      metro: METRO_DEFAULT,
      root: 'C',
      category: 'Pentatônica',
      mode: 'Maior',
      exercise: 1,
      strings: 'all',
      bpm: 80,
      autoBpm: false,
      autoCycles: 2,
      fingering: true,
      view: 'neck',
      clef: 'auto',
      inverted: false,
      challenge: false,
      metronome: false,
      volume: 0.8,

      setLang: (lang) => set({ lang }),
      setSkin: (skin) => set({ skin }),
      setInstrument: (instrument) => set({ instrument, stringCount: INSTRUMENTS[instrument].defaultCount, strings: 'all' }),
      setStringCount: (stringCount) => set({ stringCount, strings: 'all' }),
      setShowGhost: (showGhost) => set({ showGhost }),
      setMetro: (patch) => set({ metro: { ...get().metro, ...patch } }),
      setDebug: (debug) => set({ debug }),
      setA4: (a4) => set({ a4: Math.min(450, Math.max(430, Math.round(a4))) }),
      setRoot: (root) => set({ root }),
      setCategory: (category) => {
        const modes = modesOf(category);
        const current = get().mode;
        set({ category, mode: modes.includes(current) ? current : (modes[0] ?? current) });
      },
      setMode: (mode) => set({ mode }),
      setExercise: (exercise) => set({ exercise }),
      setStrings: (strings) => set({ strings }),
      setBpm: (bpm) => set({ bpm: clampBpm(bpm) }),
      nudgeBpm: (delta) => set({ bpm: clampBpm(get().bpm + delta) }),
      setAutoBpm: (autoBpm) => set({ autoBpm }),
      setAutoCycles: (autoCycles) => set({ autoCycles }),
      setFingering: (fingering) => set({ fingering }),
      setView: (view) => set({ view }),
      setClef: (clef) => set({ clef }),
      setInverted: (inverted) => set({ inverted }),
      setChallenge: (challenge) => set({ challenge }),
      setMetronome: (metronome) => set({ metronome }),
      setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
    }),
    {
      name: 'tutor_escalas_v3_settings',
      storage: createJSONStorage(() => safeStorage),
      version: 2,
      partialize: (s) => ({
        lang: s.lang,
        skin: s.skin,
        instrument: s.instrument,
        stringCount: s.stringCount,
        showGhost: s.showGhost,
        a4: s.a4,
        debug: s.debug,
        metro: s.metro,
        root: s.root,
        category: s.category,
        mode: s.mode,
        exercise: s.exercise,
        strings: s.strings,
        bpm: s.bpm,
        autoBpm: s.autoBpm,
        autoCycles: s.autoCycles,
        fingering: s.fingering,
        view: s.view,
        clef: s.clef,
        inverted: s.inverted,
        challenge: s.challenge,
        metronome: s.metronome,
        volume: s.volume,
      }),
      /** Protege contra valores antigos ou corrompidos. */
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Settings>;
        const instrument = p.instrument && INSTRUMENTS[p.instrument] ? p.instrument : current.instrument;
        const variants = INSTRUMENTS[instrument].variants;
        const stringCount = p.stringCount && variants.includes(p.stringCount) ? p.stringCount : INSTRUMENTS[instrument].defaultCount;
        const category = p.category && CATEGORIES.includes(p.category) ? p.category : current.category;
        const modes = modesOf(category);
        const mode = p.mode && modes.includes(p.mode) ? p.mode : (modes[0] ?? current.mode);
        return {
          ...current,
          ...p,
          instrument,
          lang: p.lang && LANGS.some((l) => l.code === p.lang) ? p.lang : current.lang,
          view: p.view === 'staff' ? 'staff' : 'neck',
          clef: CLEF_CHOICES.includes(p.clef as ClefChoice) ? (p.clef as ClefChoice) : 'auto',
          category,
          mode,
          stringCount,
          a4: Math.min(450, Math.max(430, Math.round(p.a4 ?? 440))),
          metro: { ...METRO_DEFAULT, ...(p.metro ?? {}), bpm: clampMetroBpm((p.metro ?? METRO_DEFAULT).bpm) },
          strings: validStrings(instrument, p.strings ?? 'all', stringCount),
          bpm: clampBpm(p.bpm ?? current.bpm),
        };
      },
    },
  ),
);

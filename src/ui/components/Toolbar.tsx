import { CATEGORIES, modesOf } from '../../core/notes';
import { exerciseParts, rootNames } from '../../core/i18n';
import { resolveInstrument } from '../../core/instruments';
import type { ExerciseId } from '../../core/types';
import { useSettings } from '../../state/store';
import { Combobox, type ComboOption } from './Combobox';
import { KeyPicker } from './KeyPicker';
import { BpmControl } from './BpmControl';

interface ToolbarProps {
  lang: string;
  t: (key: string) => string;
}

const EXERCISES: ExerciseId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

/**
 * Painel de escolhas musicais no topo: tom, escala, variação, cordas, exercício e velocidade.
 * Ordem de leitura: o que tocar (tom e escala) → como tocar (cordas e exercício) → quão rápido.
 */
export function Toolbar({ lang, t }: ToolbarProps) {
  const s = useSettings();
  const instrument = resolveInstrument(s.instrument, s.stringCount);

  const categories: ComboOption[] = CATEGORIES.map((c) => ({ value: c, label: t(c) }));
  const modes: ComboOption[] = modesOf(s.category).map((m) => ({ value: m, label: t(m) }));
  const strings: ComboOption[] = instrument.filters.map((f) => ({
    value: f.id,
    label: f.id === 'all' ? `${instrument.strings.length}` : f.label,
  }));
  const exercises: ComboOption[] = EXERCISES.map((n) => {
    const { num, name } = exerciseParts(t(`ex_${n}`));
    return { value: String(n), label: name, prefix: num };
  });

  return (
    <section className="toolbar" aria-label={t('lbl_settings')}>
      <KeyPicker label={t('lbl_root')} value={s.root} names={rootNames(lang)} onChange={s.setRoot} />
      <Combobox label={t('lbl_scale')} value={s.category} options={categories} onChange={s.setCategory} />
      <Combobox label={t('lbl_mode')} value={s.mode} options={modes} onChange={s.setMode} />
      <Combobox label={t('lbl_string_group')} value={s.strings} options={strings} onChange={s.setStrings} />
      <Combobox
        label={t('lbl_ex')}
        value={String(s.exercise)}
        options={exercises}
        onChange={(v) => s.setExercise(Number(v) as ExerciseId)}
        display={exerciseParts(t(`ex_${s.exercise}`)).name}
      />
      <BpmControl label={t('lbl_bpm')} bpm={s.bpm} onNudge={s.nudgeBpm} />
    </section>
  );
}

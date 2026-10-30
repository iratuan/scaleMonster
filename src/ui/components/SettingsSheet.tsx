import type { ReactNode } from 'react';
import { LANGS } from '../../core/i18n';
import type { Skin } from '../../core/types';
import { CLEF_CHOICES, type ClefChoice } from '../../core/notation';
import { useSettings } from '../../state/store';
import { Modal } from './Modal';
import { SettingIcon, type SettingIconName, type SettingTone } from './SettingIcon';
import { Combobox } from './Combobox';
import { skinOptions } from './skinOptions';

interface SheetProps {
  t: (key: string) => string;
  onClose: () => void;
  onHelp: () => void;
  onBackingTrack: () => void;
  micStatus: string;
}


interface ToggleProps {
  icon: SettingIconName;
  tone: SettingTone;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ icon, tone, label, hint, checked, onChange }: ToggleProps) {
  return (
    <label className="row">
      <span className="row__lead">
        <SettingIcon name={icon} tone={tone} />
        <span className="row__text">
          <span className="row__label">{label}</span>
          {hint && <span className="row__hint">{hint}</span>}
        </span>
      </span>
      <input type="checkbox" className="toggle" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

/** Linha com ícone e um controle (seletor, segmentado ou controle deslizante). */
function Field({ icon, tone, label, children, as = 'div' }: { icon: SettingIconName; tone: SettingTone; label: string; children: ReactNode; as?: 'div' | 'label' }) {
  const Tag = as;
  return (
    <Tag className="row">
      <span className="row__lead">
        <SettingIcon name={icon} tone={tone} />
        <span className="row__label">{label}</span>
      </span>
      {children}
    </Tag>
  );
}

/**
 * Ajustes que não são escolhas musicais do topo: digitação, prática, desafio,
 * aparência, idioma e atalhos para ajuda e progressão.
 */
export function SettingsSheet({ t, onClose, onHelp, onBackingTrack, micStatus }: SheetProps) {
  const s = useSettings();

  return (
    <Modal title={t('lbl_settings')} onClose={onClose} closeLabel={t('btn_close')} variant="sheet">
      <section className="group">
        <h3 className="group__label">{t('lbl_practice')}</h3>
        <div className="group__card">
          <Toggle icon="fingering" tone="blue" label={t('lbl_fingering')} checked={s.fingering} onChange={s.setFingering} />
          <Toggle icon="inverted" tone="blue" label={t('lbl_inverted')} checked={s.inverted} onChange={s.setInverted} />
          <Toggle icon="autoBpm" tone="green" label={t('lbl_auto_bpm')} checked={s.autoBpm} onChange={s.setAutoBpm} />
          <Toggle icon="metronome" tone="orange" label={t('lbl_metronome')} hint={t('metronome_hint')} checked={s.metronome} onChange={s.setMetronome} />
          <Toggle icon="debug" tone="gray" label={t('lbl_debug')} hint={t('debug_hint')} checked={s.debug} onChange={s.setDebug} />
          <Toggle icon="ghost" tone="teal" label={t('lbl_show_ghost')} hint={t('ghost_hint')} checked={s.showGhost} onChange={s.setShowGhost} />
          <Field icon="view" tone="indigo" label={t('lbl_view')}>
            <div className="seg" role="radiogroup" aria-label={t('lbl_view')}>
              {(['neck', 'staff'] as const).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={s.view === k} onClick={() => s.setView(k)}>
                  {t(k === 'neck' ? 'view_neck' : 'view_staff')}
                </button>
              ))}
            </div>
          </Field>
          {s.view === 'staff' && (
            <Field icon="clef" tone="indigo" label={t('lbl_clef')} as="label">
              <select value={s.clef} onChange={(e) => s.setClef(e.target.value as ClefChoice)}>
                {CLEF_CHOICES.map((c) => (
                  <option key={c} value={c}>
                    {t(c === 'auto' ? 'clef_auto' : `clef_${c}`)}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {s.autoBpm && (
            <Field icon="autoBpm" tone="green" label={t('lbl_auto_every')} as="label">
              <select value={s.autoCycles} onChange={(e) => s.setAutoCycles(Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}×
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </section>

      <section className="group">
        <h3 className="group__label">{t('lbl_challenge')}</h3>
        <div className="group__card">
          <Toggle
            icon="challenge"
            tone="red"
            label={t('lbl_challenge')}
            hint={micStatus === 'error' ? t('mic_unavailable') : t('chal_criterion')}
            checked={s.challenge}
            onChange={s.setChallenge}
          />
        </div>
      </section>

      <section className="group">
        <h3 className="group__label">{t('lbl_theme')}</h3>
        <div className="group__card">
          <Field icon="theme" tone="purple" label={t('lbl_theme')}>
            <Combobox
              variant="inline"
              value={s.skin}
              options={skinOptions(t)}
              onChange={(v) => s.setSkin(v as Skin)}
            />
          </Field>
          <Field icon="volume" tone="gray" label={t('lbl_volume')} as="label">
            <input
              type="range"
              className="slider"
              min={0}
              max={100}
              value={Math.round(s.volume * 100)}
              onChange={(e) => s.setVolume(Number(e.target.value) / 100)}
              aria-label={t('lbl_volume')}
            />
          </Field>
          <Field icon="language" tone="teal" label={t('lbl_language')} as="label">
            <select value={s.lang} onChange={(e) => s.setLang(e.target.value)}>
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <div className="btn-row">
        <button type="button" className="btn btn--ghost" onClick={onBackingTrack}>
          <SettingIcon name="backing" tone="green" />
          {t('lbl_backing_track')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onHelp}>
          <SettingIcon name="help" tone="gray" />
          {t('btn_help')}
        </button>
      </div>
    </Modal>
  );
}

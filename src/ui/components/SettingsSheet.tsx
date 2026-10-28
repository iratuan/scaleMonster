import { LANGS } from '../../core/i18n';
import type { Skin } from '../../core/types';
import { useSettings } from '../../state/store';
import { Modal } from './Modal';

interface SheetProps {
  t: (key: string) => string;
  onClose: () => void;
  onHelp: () => void;
  onBackingTrack: () => void;
  micStatus: string;
}

const SKINS: { value: Skin; key: string }[] = [
  { value: 'light', key: 'skin_light' },
  { value: 'dark', key: 'skin_dark' },
  { value: 'vintage', key: 'skin_vintage' },
  { value: 'madeira', key: 'skin_madeira' },
];

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="row">
      <span className="row__text">
        <span className="row__label">{label}</span>
        {hint && <span className="row__hint">{hint}</span>}
      </span>
      <input type="checkbox" className="toggle" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
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
          <Toggle label={t('lbl_fingering')} checked={s.fingering} onChange={s.setFingering} />
          <Toggle label={t('lbl_inverted')} checked={s.inverted} onChange={s.setInverted} />
          <Toggle label={t('lbl_auto_bpm')} checked={s.autoBpm} onChange={s.setAutoBpm} />
          <Toggle label={t('lbl_metronome')} hint={t('metronome_hint')} checked={s.metronome} onChange={s.setMetronome} />
          <Toggle label={t('lbl_debug')} hint={t('debug_hint')} checked={s.debug} onChange={s.setDebug} />
          <Toggle label={t('lbl_show_ghost')} hint={t('ghost_hint')} checked={s.showGhost} onChange={s.setShowGhost} />
          {s.autoBpm && (
            <label className="row">
              <span className="row__label">{t('lbl_auto_every')}</span>
              <select value={s.autoCycles} onChange={(e) => s.setAutoCycles(Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}×
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </section>

      <section className="group">
        <h3 className="group__label">{t('lbl_challenge')}</h3>
        <div className="group__card">
          <Toggle
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
          <div className="row">
            <span className="row__label">{t('lbl_theme')}</span>
            <div className="seg" role="radiogroup" aria-label={t('lbl_theme')}>
              {SKINS.map((k) => (
                <button key={k.value} type="button" role="radio" aria-checked={s.skin === k.value} onClick={() => s.setSkin(k.value)}>
                  {t(k.key)}
                </button>
              ))}
            </div>
          </div>
          <label className="row">
            <span className="row__label">{t('lbl_volume')}</span>
            <input
              type="range"
              className="slider"
              min={0}
              max={100}
              value={Math.round(s.volume * 100)}
              onChange={(e) => s.setVolume(Number(e.target.value) / 100)}
              aria-label={t('lbl_volume')}
            />
          </label>
          <label className="row">
            <span className="row__label">{t('lbl_language')}</span>
            <select value={s.lang} onChange={(e) => s.setLang(e.target.value)}>
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="btn-row">
        <button type="button" className="btn btn--ghost" onClick={onBackingTrack}>
          {t('lbl_backing_track')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onHelp}>
          {t('btn_help')}
        </button>
      </div>
    </Modal>
  );
}

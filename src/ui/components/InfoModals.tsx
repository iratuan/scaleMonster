import { backingTrackText } from './backingText';
import { getBackingTrack, harmonicField } from '../../core/backingTrack';
import { getScaleContext } from '../../core/notes';
import { useSettings } from '../../state/store';
import { Modal } from './Modal';

interface CommonProps {
  t: (key: string) => string;
  onClose: () => void;
}

const HELP_ITEMS: [string, string][] = [
  ['lbl_instrument', 'help_instrument'],
  ['lbl_root', 'help_root'],
  ['lbl_scale', 'help_scale'],
  ['lbl_mode', 'help_mode'],
  ['lbl_ex', 'help_ex'],
  ['lbl_strings', 'help_strings'],
  ['lbl_bpm', 'help_speed'],
  ['lbl_challenge', 'lbl_challenge_hint'],
];

export function HelpModal({ t, onClose }: CommonProps) {
  return (
    <Modal title={t('help_title')} onClose={onClose} closeLabel={t('btn_close')}>
      <p className="notice">{t('help_level_notice')}</p>

      <h3 className="h3">{t('help_how_to_start_title')}</h3>
      <p className="body">{t('help_how_to_start_text')}</p>

      <h3 className="h3">{t('help_intro')}</h3>
      <dl className="help-list">
        {HELP_ITEMS.map(([label, text]) => (
          <div key={label} className="help-list__item">
            <dt>{t(label)}</dt>
            <dd>{t(text)}</dd>
          </div>
        ))}
        <div className="help-list__item">
          <dt>{t('help_lbl_pos')}</dt>
          <dd>{t('help_positions')}</dd>
        </div>
        <div className="help-list__item">
          <dt>{t('help_lbl_full')}</dt>
          <dd>{t('help_full_scale')}</dd>
        </div>
      </dl>
    </Modal>
  );
}

export function BackingTrackModal({ t, onClose }: CommonProps) {
  const s = useSettings();
  const ctx = getScaleContext(s.root, s.category, s.mode, s.instrument);
  if (!ctx) return null;
  const info = getBackingTrack(ctx.rootIdx, s.category, s.mode);
  const rows = harmonicField(ctx.rootIdx, s.category, s.mode);

  return (
    <Modal title={t('bt_modal_title')} onClose={onClose} closeLabel={t('btn_close')}>
      <p className="body body--muted">{t('bt_modal_text')}</p>
      <div className="progression">{info.chords.join('   |   ')}</div>
      <p className="body body--muted">{backingTrackText(info, t)}</p>

      <h3 className="h3">{t('lbl_harmonic_field')}</h3>
      {rows ? (
        <ul className="hf">
          {rows.map((r) => (
            <li key={r.degree} className="hf__row">
              <span className="hf__roman">
                {r.roman} <small>({r.degree}º {t('lbl_degree')})</small>
              </span>
              <span className="hf__chord">
                {r.root}
                {r.quality}
              </span>
              <span className="hf__notes">
                {r.root}, {r.third}, {r.fifth}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="body body--muted">{t('hf_not_applicable')}</p>
      )}
    </Modal>
  );
}

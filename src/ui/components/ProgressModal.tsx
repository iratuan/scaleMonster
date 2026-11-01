import { useRef, useState } from 'react';
import { BADGES, currentLevel, type BadgeId, type Profile } from '../../core/progress';
import { loadProfile, profileFromJson, profileToJson, saveProfile } from '../../state/progressStorage';
import { Modal } from './Modal';
import { BADGE_IMAGES } from '../badgeArt';
import '../../styles/progress.css';

interface ProgressProps {
  t: (key: string, vars?: Record<string, string | number>) => string;
  onClose: () => void;
}

export function ProgressModal({ t, onClose }: ProgressProps) {
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const level = currentLevel(profile);

  const exportBackup = () => {
    const blob = new Blob([profileToJson(profile)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const day = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `scalemonster-progresso-${day}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setNotice({ kind: 'ok', text: t('progress_export_done') });
  };

  const importBackup = async (file: File) => {
    const imported = profileFromJson(await file.text());
    if (!imported) {
      setNotice({ kind: 'error', text: t('progress_import_invalid') });
      return;
    }
    saveProfile(imported);
    setProfile(imported);
    setNotice({ kind: 'ok', text: t('progress_import_done') });
  };

  return (
    <Modal title={t('progress_title')} onClose={onClose} closeLabel={t('btn_close')}>
      <div className="progress">
        <div className="progress__summary">
          <div className="progress__level">
            {t('progress_level', { n: level, total: BADGES.length })}
          </div>
          <div className="progress__stats">
            <div className="stat">
              <span className="stat__value stat__value--sm">{profile.xp}</span>
              <span className="stat__label">{t('progress_xp')}</span>
            </div>
            <div className="stat">
              <span className="stat__value stat__value--sm">{profile.rounds}</span>
              <span className="stat__label">{t('progress_rounds')}</span>
            </div>
            <div className="stat">
              <span className="stat__value stat__value--sm">{profile.streak}</span>
              <span className="stat__label">{t('progress_streak')}</span>
            </div>
          </div>
        </div>

        <ul className="badges" aria-label={t('progress_badges')}>
          {BADGES.map((b) => {
            const earned = profile.badges[b.id as BadgeId];
            return (
              <li key={b.id} className={`badge${earned ? '' : ' badge--locked'}`}>
                <img className="badge__img" src={BADGE_IMAGES[b.level]} alt={earned ? b.name : t('progress_locked')} />
                <span className="badge__name">{b.name}</span>
                <span className="badge__req">{t(b.requirementKey)}</span>
                {earned && (
                  <span className="badge__date">
                    {t('progress_earned_on', { date: new Date(earned).toLocaleDateString() })}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <div className="progress__backup">
          <p className="body body--muted">{t('progress_backup_hint')}</p>
          <div className="progress__actions">
            <button type="button" className="btn" onClick={exportBackup}>
              {t('progress_export')}
            </button>
            <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
              {t('progress_import')}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void importBackup(file);
              }}
            />
          </div>
          {notice && (
            <p className={`body ${notice.kind === 'error' ? 'progress__error' : 'body--muted'}`} role="status">
              {notice.text}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

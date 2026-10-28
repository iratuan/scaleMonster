import type { ScoreSummary } from '../usePlayback';
import { Modal } from './Modal';

interface ScoreProps {
  score: ScoreSummary;
  t: (key: string, vars?: Record<string, string | number>) => string;
  cleared: boolean;
  onClose: () => void;
  onClear: () => void;
}

const formatTime = (sec: number) => `${Math.floor(sec / 60)}m ${sec % 60}s`;

/** 'corda-traste' -> texto localizado, ex.: "Corda 3 · Traste 5". */
const formatWeak = (key: string, t: ScoreProps['t']) => {
  const [s, f] = key.split('-');
  return t('note_at', { s: Number(s) + 1, f });
};

/** Resumo do desafio: taxa de acerto, tendências e foco sugerido. */
export function ScoreModal({ score, t, cleared, onClose, onClear }: ScoreProps) {
  const tone = score.pct >= 80 ? 'good' : score.pct >= 50 ? 'mid' : 'low';
  const a = score.analysis;

  return (
    <Modal title={t('score_summary')} onClose={onClose} closeLabel={t('btn_close')}>
      <div className="score">
        <div className="score__title">{score.title}</div>
        <div className={`score__pct score__pct--${tone}`}>{score.pct}%</div>
        <div className="score__label">{t('score_accuracy')}</div>

        <div className="stats">
          <div className="stat">
            <span className="stat__value score__pct--good">{score.hits}</span>
            <span className="stat__label">{t('score_hits')}</span>
          </div>
          <div className="stat">
            <span className="stat__value score__pct--low">{score.misses}</span>
            <span className="stat__label">{t('score_misses')}</span>
          </div>
        </div>

        {a && !cleared && (
          <div className="trends">
            <div className="trends__head">
              <span className="section__label">{t('trends_title')}</span>
              <button type="button" className="danger" onClick={onClear}>
                {t('btn_clear')}
              </button>
            </div>
            <div className="stats">
              <div className="stat">
                <span className="stat__value stat__value--sm">{formatTime(a.totalTimeSec)}</span>
                <span className="stat__label">{t('trend_time')}</span>
              </div>
              <div className="stat">
                <span className="stat__value stat__value--sm stat__value--ellipsis" title={a.mostPlayed}>
                  {a.mostPlayed}
                </span>
                <span className="stat__label">{t('trend_favorite')}</span>
              </div>
            </div>
            <div className="focus">
              <p className="focus__title">{t('trend_focus')}</p>
              <p className="focus__scale">{a.recommendation}</p>
              <p className="body body--muted">
                {a.weakNotes.length > 0
                  ? t('trend_focus_weak', { notes: a.weakNotes.map((k) => formatWeak(k, t)).join(', ') })
                  : t('trend_focus_ok')}
              </p>
            </div>
          </div>
        )}
        {cleared && <p className="body body--muted">{t('history_reset')}</p>}

        <button type="button" className="btn btn--primary" onClick={onClose} style={{ marginTop: 20 }}>
          {t('btn_continue')}
        </button>
      </div>
    </Modal>
  );
}

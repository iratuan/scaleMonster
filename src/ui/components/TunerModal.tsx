import { useEffect, useRef, useState } from 'react';
import { TunerEngine } from '../../audio/tunerEngine';
import { centsFromTarget, clampA4, isInTune, median, nearestString, readNote } from '../../core/tuner';
import type { StringDef } from '../../core/instruments';
import { useSettings } from '../../state/store';
import { Modal } from './Modal';
import { MinusIcon, PlusIcon, PlayIcon, StopIcon } from './Icons';

interface TunerProps {
  t: (key: string) => string;
  strings: StringDef[];
  onClose: () => void;
}

/** Leituras recentes usadas na mediana, para não oscilar a cada quadro. */
const SMOOTHING = 9;

/**
 * Afinador. Toque uma corda: o app mostra a nota mais próxima e o desvio em centavos.
 * Tocar numa corda da lista fixa o alvo (útil quando o som é ambíguo).
 */
export function TunerModal({ t, strings, onClose }: TunerProps) {
  const a4 = useSettings((s) => s.a4);
  const setA4 = useSettings((s) => s.setA4);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(false);
  const [freq, setFreq] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const history = useRef<number[]>([]);
  const engine = useRef<TunerEngine | null>(null);

  if (!engine.current) {
    engine.current = new TunerEngine((f) => {
      history.current.push(f);
      if (history.current.length > SMOOTHING) history.current.shift();
      setFreq(median(history.current));
    });
  }

  useEffect(() => () => engine.current?.stop(), []);

  const start = () => {
    setError(false);
    engine
      .current!.start()
      .then(() => setListening(true))
      .catch(() => setError(true));
  };
  const stop = () => {
    engine.current?.stop();
    setListening(false);
    setFreq(0);
    history.current = [];
  };

  const hasSignal = freq > 0;
  const nearIdx = hasSignal ? nearestString(freq, strings, a4) : null;
  const idx = selected ?? nearIdx;
  const target = idx !== null ? strings[idx] : null;
  const reading = hasSignal ? readNote(freq, a4) : null;
  const cents = target && hasSignal ? centsFromTarget(freq, target.midi, a4) : null;
  const clamped = cents === null ? 0 : Math.max(-50, Math.min(50, cents));
  const tuned = cents !== null && isInTune(cents);

  const noteName = selected !== null && target ? target.name : reading?.name ?? '–';
  const octave = selected === null && reading ? reading.octave : null;
  const status =
    cents === null
      ? t('tuner_listen')
      : tuned
        ? t('tuner_in_tune')
        : cents < 0
          ? t('tuner_low')
          : t('tuner_high');

  return (
    <Modal title={t('tuner_title')} onClose={() => { stop(); onClose(); }} closeLabel={t('btn_close')}>
      <div className={`tuner${tuned ? ' is-tuned' : ''}`}>
        <div className="tuner__note" aria-live="polite">
          <span className="tuner__name">{noteName}</span>
          {octave !== null && <span className="tuner__octave">{octave}</span>}
        </div>
        <p className="tuner__status">{status}</p>

        <div className="meter" role="img" aria-label={`${cents ?? 0} ${t('tuner_cents')}`}>
          <div className="meter__scale">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="meter__needle" style={{ left: `${50 + clamped}%` }} />
        </div>
        <div className="meter__labels">
          <span>−50</span>
          <span className="meter__zero">0</span>
          <span>+50</span>
        </div>
        <p className="tuner__freq num">{hasSignal ? `${freq.toFixed(1)} Hz` : '—'}</p>

        <div className="tuner__strings" role="group" aria-label={t('tuner_strings')}>
          {strings.map((s, i) => (
            <button
              key={`${s.name}-${i}`}
              type="button"
              aria-pressed={selected === i}
              className={`tuner__string${idx === i ? ' is-target' : ''}${tuned && idx === i ? ' is-tuned' : ''}`}
              onClick={() => setSelected(selected === i ? null : i)}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="tuner__ref">
          <span className="row__label">{t('tuner_ref')}</span>
          <div className="stepper">
            <button type="button" className="step" onClick={() => setA4(clampA4(a4 - 1))} disabled={a4 <= 430} aria-label="-1 Hz">
              <MinusIcon width={14} height={14} />
            </button>
            <span className="num">{a4} Hz</span>
            <button type="button" className="step" onClick={() => setA4(clampA4(a4 + 1))} disabled={a4 >= 450} aria-label="+1 Hz">
              <PlusIcon width={14} height={14} />
            </button>
          </div>
        </div>

        {error && <p className="notice notice--error">{t('mic_unavailable')}</p>}

        <button type="button" className={`btn ${listening ? 'btn--ghost' : 'btn--primary'}`} onClick={listening ? stop : start}>
          {listening ? <StopIcon width={16} height={16} /> : <PlayIcon width={16} height={16} />}
          <span>{listening ? t('tuner_stop') : t('tuner_start')}</span>
        </button>
        <p className="caption">{t('tuner_hint')}</p>
      </div>
    </Modal>
  );
}

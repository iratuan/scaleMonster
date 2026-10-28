import { useEffect, useRef, useState } from 'react';
import { MetronomeEngine } from '../../audio/metronomeEngine';
import {
  METERS,
  SUBDIVISIONS,
  clampBpm,
  meterOf,
  tapBpm,
  ticksPerBar,
  type MetroConfig,
  type SubId,
  type TickInfo,
} from '../../core/metronome';
import { MAX_BPM, MIN_BPM } from '../../core/autoBpm';
import { useSettings } from '../../state/store';
import { Combobox, type ComboOption } from './Combobox';
import { Modal } from './Modal';
import { MinusIcon, PlayIcon, PlusIcon, StopIcon } from './Icons';

interface MetronomeModalProps {
  t: (key: string, vars?: Record<string, string | number>) => string;
  onClose: () => void;
}

/** Janela de toques: depois desse intervalo sem toque, o próximo começa um novo cálculo. */
const TAP_RESET_MS = 2500;

/**
 * Metrônomo como ferramenta: andamento, compasso, divisão rítmica, acento,
 * modo treino (rampa) e compasso mudo. A tela é a mesma de celular a computador:
 * o conteúdo se reorganiza em uma ou duas colunas.
 */
export function MetronomeModal({ t, onClose }: MetronomeModalProps) {
  const cfg = useSettings((s) => s.metro);
  const setMetro = useSettings((s) => s.setMetro);
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState<TickInfo | null>(null);
  const [liveBpm, setLiveBpm] = useState(cfg.bpm);
  const taps = useRef<number[]>([]);
  const engine = useRef<MetronomeEngine | null>(null);

  if (!engine.current) {
    engine.current = new MetronomeEngine(
      () => useSettings.getState().metro,
      () => useSettings.getState().volume,
      (info, bpm, at) => {
        // Sincroniza a tela com o áudio: o desenho acontece no instante do clique.
        const delay = engine.current?.delayUntil(at) ?? 0;
        setTimeout(() => {
          setNow(info);
          setLiveBpm(bpm);
        }, delay);
      },
    );
  }

  useEffect(() => () => engine.current?.close(), []);

  useEffect(() => {
    if (!playing) setLiveBpm(cfg.bpm);
  }, [cfg.bpm, playing]);

  const meter = meterOf(cfg.meter);
  const perBeat = cfg.sub;

  const toggle = () => {
    if (engine.current!.isRunning) {
      engine.current!.stop();
      setPlaying(false);
      setNow(null);
    } else {
      engine.current!.start();
      setPlaying(true);
    }
  };

  const tap = () => {
    const at = performance.now();
    const last = taps.current[taps.current.length - 1];
    if (last !== undefined && at - last > TAP_RESET_MS) taps.current = [];
    taps.current.push(at);
    if (taps.current.length > 5) taps.current.shift();
    const intervals = taps.current.slice(1).map((v, i) => v - taps.current[i]);
    const bpm = tapBpm(intervals);
    if (bpm !== null) setMetro({ bpm });
  };

  const meters: ComboOption[] = METERS.map((m) => ({ value: m.id, label: m.id }));
  const subs: ComboOption[] = SUBDIVISIONS.map((n) => ({ value: String(n), label: t(`metro_sub_${n}`) }));
  const shownBpm = playing ? liveBpm : cfg.bpm;

  // Pulsos em grade: um bloco por tempo, com as divisões embaixo.
  const beats = Array.from({ length: meter.beats }, (_, b) => b);

  return (
    <Modal title={t('metro_title')} onClose={onClose} closeLabel={t('btn_close')}>
      <div className="metro">
        <section className="metro__tempo" aria-label={t('lbl_bpm')}>
          <div className="metro__bpm num" aria-live="polite">
            {shownBpm}
            <small>BPM</small>
          </div>
          <input
            type="range"
            className="slider metro__slider"
            min={MIN_BPM}
            max={MAX_BPM}
            value={cfg.bpm}
            onChange={(e) => setMetro({ bpm: clampBpm(Number(e.target.value)) })}
            aria-label={t('lbl_bpm')}
          />
          <div className="metro__tempo-actions">
            <div className="stepper">
              <button type="button" className="step" onClick={() => setMetro({ bpm: clampBpm(cfg.bpm - 1) })} aria-label="-1 BPM" disabled={cfg.bpm <= MIN_BPM}>
                <MinusIcon width={14} height={14} />
              </button>
              <button type="button" className="step" onClick={() => setMetro({ bpm: clampBpm(cfg.bpm + 1) })} aria-label="+1 BPM" disabled={cfg.bpm >= MAX_BPM}>
                <PlusIcon width={14} height={14} />
              </button>
            </div>
            <button type="button" className="btn btn--ghost metro__tap" onClick={tap}>
              {t('metro_tap')}
            </button>
          </div>
          <p className="caption">{t('metro_tap_hint')}</p>
        </section>

        <section className="metro__pattern" aria-label={t('metro_meter')}>
          {beats.map((b) => {
            const onBeat = now !== null && now.beat === b && !now.silent;
            const silentNow = now !== null && now.silent && now.beat === b;
            return (
              <div key={b} className="metro__beat">
                <span className={`metro__pulse${b === 0 && cfg.accent ? ' is-accent' : ''}${onBeat && now?.sub === 0 ? ' is-on' : ''}${silentNow ? ' is-silent' : ''}`} />
                <div className="metro__subs" aria-hidden>
                  {Array.from({ length: perBeat - 1 }, (_, k) => (
                    <span key={k} className={`metro__sub${onBeat && now?.sub === k + 1 ? ' is-on' : ''}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
        <p className="caption metro__count">
          {meter.id} · {ticksPerBar(meter, cfg.sub)} {t('metro_ticks')}
        </p>

        <section className="metro__options">
          <div className="metro__pair">
            <Combobox label={t('metro_meter')} value={cfg.meter} options={meters} onChange={(v) => setMetro({ meter: v })} />
            <Combobox
              label={t('metro_sub')}
              value={String(cfg.sub)}
              options={subs}
              onChange={(v) => setMetro({ sub: Number(v) as SubId })}
              display={t(`metro_sub_${cfg.sub}`)}
            />
          </div>

          <div className="group__card">
            <label className="row">
              <span className="row__label">{t('metro_accent')}</span>
              <input type="checkbox" className="toggle" checked={cfg.accent} onChange={(e) => setMetro({ accent: e.target.checked })} />
            </label>
            <label className="row">
              <span className="row__label">{t('metro_ramp')}</span>
              <input
                type="checkbox"
                className="toggle"
                checked={cfg.ramp.on}
                onChange={(e) => setMetro({ ramp: { ...cfg.ramp, on: e.target.checked } })}
              />
            </label>
            {cfg.ramp.on && <RampFields cfg={cfg} setMetro={setMetro} t={t} />}
            <label className="row">
              <span className="row__text">
                <span className="row__label">{t('metro_silent')}</span>
                <span className="row__hint">{t('metro_explain')}</span>
              </span>
              <select value={cfg.silentEvery} onChange={(e) => setMetro({ silentEvery: Number(e.target.value) })} aria-label={t('metro_silent')}>
                <option value={0}>{t('metro_silent_off')}</option>
                {[2, 3, 4, 5, 8].map((n) => (
                  <option key={n} value={n}>
                    {t('metro_silent_every', { n })}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <button type="button" className={`btn ${playing ? 'btn--ghost' : 'btn--primary'} metro__start`} onClick={toggle}>
          {playing ? <StopIcon width={16} height={16} /> : <PlayIcon width={16} height={16} />}
          <span>{playing ? t('metro_stop') : t('metro_start')}</span>
        </button>
      </div>
    </Modal>
  );
}

/** Campos do modo treino: variação, intervalo em compassos e andamento final. */
function RampFields({
  cfg,
  setMetro,
  t,
}: {
  cfg: MetroConfig;
  setMetro: (p: Partial<MetroConfig>) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const ramp = cfg.ramp;
  const set = (patch: Partial<MetroConfig['ramp']>) => setMetro({ ramp: { ...ramp, ...patch } });
  const bump = (key: 'step' | 'target', delta: number) => {
    if (key === 'target') set({ target: clampBpm(ramp.target + delta) });
    else set({ step: ramp.step + delta });
  };
  return (
    <div className="metro__ramp">
      <div className="metro__ramp-item">
        <span className="row__label">{t('metro_ramp_step')}</span>
        <div className="stepper">
          <button type="button" className="step" onClick={() => bump('step', -1)} aria-label={`${t('metro_ramp_step')} -1`}>
            <MinusIcon width={14} height={14} />
          </button>
          <span className="num">{ramp.step > 0 ? `+${ramp.step}` : ramp.step} BPM</span>
          <button type="button" className="step" onClick={() => bump('step', 1)} aria-label={`${t('metro_ramp_step')} +1`}>
            <PlusIcon width={14} height={14} />
          </button>
        </div>
      </div>
      <div className="metro__ramp-item">
        <span className="row__label">
          {t('metro_ramp_every')} {ramp.everyBars} {t('metro_bars')}
        </span>
        <div className="stepper">
          <button type="button" className="step" onClick={() => set({ everyBars: Math.max(1, ramp.everyBars - 1) })} aria-label="-1">
            <MinusIcon width={14} height={14} />
          </button>
          <button type="button" className="step" onClick={() => set({ everyBars: Math.min(16, ramp.everyBars + 1) })} aria-label="+1">
            <PlusIcon width={14} height={14} />
          </button>
        </div>
      </div>
      <div className="metro__ramp-item">
        <span className="row__label">
          {t('metro_ramp_target')} {ramp.target} BPM
        </span>
        <div className="stepper">
          <button type="button" className="step" onClick={() => bump('target', -5)} aria-label="-5 BPM">
            <MinusIcon width={14} height={14} />
          </button>
          <button type="button" className="step" onClick={() => bump('target', 5)} aria-label="+5 BPM">
            <PlusIcon width={14} height={14} />
          </button>
        </div>
      </div>
    </div>
  );
}


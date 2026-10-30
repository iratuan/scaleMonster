import { useEffect, useMemo, useRef, useState } from 'react';
import { buildFretboard, positionAt } from '../core/positions';
import { clefShift, resolveClef, staffKey } from '../core/notation';
import { Staff } from './components/Staff';
import { getScaleContext, NOTES } from '../core/notes';
import { fingerFor } from '../core/fingering';
import { displayFinger, mainFingerMap } from '../core/hints';
import { RTL_LANGS, exerciseParts, rootNames, translate } from '../core/i18n';
import { INSTRUMENT_LIST, resolveInstrument, type InstrumentId } from '../core/instruments';
import type { Skin } from '../core/types';
import { useSettings } from '../state/store';
import { clearStats } from '../state/statsStorage';
import { diagramName, usePlayback } from './usePlayback';
import { Fretboard } from './components/Fretboard';
import { PositionGrid } from './components/PositionGrid';
import { Footer } from './components/Footer';
import { SpaceBackdrop } from './components/SpaceBackdrop';
import { SettingsSheet } from './components/SettingsSheet';
import { Toolbar } from './components/Toolbar';
import { ChallengeBar } from './components/ChallengeBar';
import { BackingTrackModal, HelpModal } from './components/InfoModals';
import { ScoreModal } from './components/ScoreModal';
import { Splash } from './components/Splash';
import { ToolsMenu } from './components/ToolsMenu';
import { TunerModal } from './components/TunerModal';
import { MetronomeModal } from './components/MetronomeModal';
import { Modal } from './components/Modal';
import { MenuIcon, GearIcon, HelpIcon, LogoIcon, PlayIcon, StopIcon } from './components/Icons';
import { Combobox } from './components/Combobox';
import { skinOptions } from './components/skinOptions';

export default function App() {
  const s = useSettings();
  const t = (key: string, vars?: Record<string, string | number>) => translate(s.lang, key, vars);

  // Tema no <html>: menus e diálogos do Radix são montados em <body>, fora do div.app.
  useEffect(() => {
    document.documentElement.dataset.skin = s.skin;
  }, [s.skin]);

  const instrument = useMemo(() => resolveInstrument(s.instrument, s.stringCount), [s.instrument, s.stringCount]);
  const spec = INSTRUMENT_LIST.find((i) => i.id === s.instrument) ?? INSTRUMENT_LIST[0];
  const ctx = useMemo(() => getScaleContext(s.root, s.category, s.mode, instrument), [s.root, s.category, s.mode, instrument]);
  const model = useMemo(() => (ctx ? buildFretboard(ctx, s.exercise, s.strings) : null), [ctx, s.exercise, s.strings]);
  const pb = usePlayback(`${t(s.category)} ${t(s.mode)}`);

  const [sheet, setSheet] = useState(false);
  const [escolhas, setEscolhas] = useState(false);
  const [help, setHelp] = useState(false);
  const [backing, setBacking] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [tuner, setTuner] = useState(false);
  const [metronome, setMetronome] = useState(false);
  const toggleMain = useRef<() => void>(() => {});

  // O tema vale também para html/body (o fundo da página), não só para .app.
  useEffect(() => {
    document.documentElement.setAttribute('data-skin', s.skin);
  }, [s.skin]);

  useEffect(() => {
    document.documentElement.lang = s.lang;
    document.documentElement.dir = RTL_LANGS.has(s.lang) ? 'rtl' : 'ltr';
  }, [s.lang]);

  useEffect(() => {
    if (pb.score) setCleared(false);
  }, [pb.score]);

  // Acompanhar a execução: o braço rola para a posição que toca. Na escala completa, só troca de posição
  // no fim de um padrão do exercício (a unidade), para não cortar um grupo de notas.
  // Posição do ciclo que está tocando na escala completa (0 quando não toca).
  const curPos = model && pb.activeId === 'main' ? positionAt(model.segments, pb.step) : 0;

  // Log de depuração do lado gráfico: a casa que está destacada na tela (lida do DOM).
  // Compare com a linha [exec] (lógica): se as duas coincidem, o erro não é de desenho.
  useEffect(() => {
    if (!s.debug || !pb.playingKey || !pb.activeId) return;
    const cell = document.querySelector(`[data-diagram="${pb.activeId}"] .note--play`)?.closest('.fb__cell') as HTMLElement | null;
    console.log(`[ui] ${diagramName(pb.activeId)} destaque corda=${cell ? Number(cell.dataset.string) + 1 : '-'} traste=${cell?.dataset.fret ?? '-'} chave=${pb.playingKey}`);
  }, [pb.playingKey, pb.activeId, s.debug]);

  const mainFingers = useMemo(() => (model ? mainFingerMap(model.positions) : new Map()), [model]);
  // Partitura: a mesma sequência da escala completa, na clave escolhida (ou a padrão do instrumento).
  const clefId = resolveClef(s.clef, s.instrument);
  const staffKeys = useMemo(
    () => (model ? model.main.sequence.map((n) => staffKey(n.absPitch, n.noteIdx, clefShift(clefId))) : []),
    [model, clefId],
  );
  // Cada posição começa numa linha nova (a primeira já começa a partitura).
  const staffBreaks = useMemo(() => model?.segments.slice(1).map((g) => g.cycle) ?? [], [model]);
  const staffLabels = useMemo(() => {
    const m = new Map<number, string>();
    model?.segments.forEach((g) => m.set(g.cycle, `P${g.pos + 1}`));
    return m;
  }, [model]);

  toggleMain.current = () => {
    if (model) pb.toggle('main', model.main.sequence);
  };

  // Barra de espaço toca e para a escala completa, quando nenhum campo ou janela está em uso.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, button, [role="listbox"]') || document.querySelector('.overlay:not(.overlay--count)')) return;
      e.preventDefault();
      toggleMain.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!ctx || !model) return null;

  const mainFingerOf = (str: number, fret: number) => {
    const fromPos = displayFinger(mainFingers.get(`${str}-${fret}`), curPos);
    return fromPos !== '' ? fromPos : fingerFor(fret, str, model.main.activePairs);
  };
  // Ciclo atual da escala completa: marca só as notas que serão tocadas nele.
  const curSeg = pb.activeId === 'main' ? model.segments.find((g) => pb.step >= g.start && pb.step < g.end) : undefined;
  // Durante a execução nunca mostra o percurso inteiro: só o ciclo atual.
  const mainKeys = new Set(
    (pb.activeId === 'main' ? (curSeg ? model.main.sequence.slice(curSeg.start, curSeg.end) : []) : model.main.activePairs).map((p) => `${p.string}-${p.fret}`),
  );
  const feedbackMain = pb.feedback && pb.feedback.diagramId === 'main' ? pb.feedback : null;
  const rootName = rootNames(s.lang)[NOTES.indexOf(s.root)] ?? s.root;

  return (
    <div className="app" data-skin={s.skin} lang={s.lang}>
      <SpaceBackdrop />
      <Splash title={t('title')} />
      <header className="header">
        <h1 className="header__title">
          <LogoIcon width={20} height={20} />
          {t('title')}
        </h1>
          <select
            className="instrumento-compacto"
            aria-label={t('lbl_instrument')}
            value={s.instrument}
            onChange={(e) => s.setInstrument(e.target.value as InstrumentId)}
          >
            {INSTRUMENT_LIST.map((i) => (
              <option key={i.id} value={i.id}>
                {t(i.nameKey)}
              </option>
            ))}
          </select>

        <div className="header__actions">
          <Combobox
            variant="inline"
            value={s.skin}
            options={skinOptions(t)}
            onChange={(v) => s.setSkin(v as Skin)}
          />
          <ToolsMenu t={t} onMetronome={() => setMetronome(true)} onTuner={() => setTuner(true)} />
          <button type="button" className="icon-btn" onClick={() => setHelp(true)} aria-label={t('btn_help')} title={t('btn_help')}>
            <HelpIcon width={18} height={18} />
          </button>
          <button type="button" className="icon-btn" onClick={() => setSheet(true)} aria-label={t('lbl_settings')} title={t('lbl_settings')}>
            <GearIcon width={18} height={18} />
          </button>
        </div>
      </header>

      <main className="page">
        <div className="instrumento-linha">
          <div className="chips" role="radiogroup" aria-label={t('lbl_instrument')}>
            {INSTRUMENT_LIST.map((i) => (
              <button
                key={i.id}
                type="button"
                role="radio"
                aria-checked={s.instrument === i.id}
                className="chip"
                onClick={() => s.setInstrument(i.id as InstrumentId)}
              >
                {t(i.nameKey)}
              </button>
            ))}
          </div>

          {spec.variants.length > 1 && (
            <div className="variants">
              <span className="variants__label">{t('lbl_string_count')}</span>
              <div className="seg" role="radiogroup" aria-label={t('lbl_string_count')}>
                {spec.variants.map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={s.stringCount === n} onClick={() => s.setStringCount(n)}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Toolbar lang={s.lang} t={t} />

        <button type="button" className="fab-escolhas" onClick={() => setEscolhas(true)} aria-label={t('lbl_choices')} title={t('lbl_choices')}>
          <MenuIcon width={20} height={20} />
        </button>
        {escolhas && (
          <Modal title={t('lbl_choices')} onClose={() => setEscolhas(false)} closeLabel={t('btn_close')} variant="sheet">
            <Toolbar lang={s.lang} t={t} />
          </Modal>
        )}

        {s.challenge && <ChallengeBar t={t} micStatus={pb.micStatus} />}

        <section className="summary">
          <div>
            <h2 className="summary__title">
              {rootName} {t(s.mode)}
            </h2>
            <p className="summary__desc">
              {t(s.category)} · {instrument.strings.length} {t('lbl_strings').toLowerCase()} · {exerciseParts(t(`ex_${s.exercise}`)).name}
            </p>
          </div>
          <button type="button" className="link" onClick={() => setBacking(true)}>
            {t('lbl_backing_track')} →
          </button>
        </section>

        <section className="section">
          <div className="section__head">
            <h2 className="section__label">{t('lbl_full_scale')}</h2>
            <button
              type="button"
              className={`play${pb.activeId === 'main' ? ' is-on' : ''}`}
              onClick={() => pb.toggle('main', model.main.sequence)}
              aria-label={pb.activeId === 'main' ? t('btn_stop') : t('btn_play_full')}
            >
              {pb.activeId === 'main' ? <StopIcon width={16} height={16} /> : <PlayIcon width={16} height={16} />}
            </button>
          </div>
          <div className="surface">
            {s.view === 'staff' ? (
              <Staff
                keys={staffKeys}
                clef={clefId}
                breaks={staffBreaks}
                labels={staffLabels}
                from={curSeg?.start ?? 0}
                to={curSeg?.end ?? 0}
                active={pb.activeId === 'main' ? pb.step : null}
                playing={pb.activeId === 'main'}
              />
            ) : (
            <Fretboard
              id="main"
              start={model.main.start}
              end={model.main.end}
              ctx={ctx}
              activeKeys={mainKeys}
              fingerOf={mainFingerOf}
              hints={s.fingering}
              inverted={s.inverted}
              showGhost={s.showGhost}
              playing={pb.activeId === 'main' ? pb.playingKey : null}
              next={pb.activeId === 'main' ? pb.nextKey : null}
              feedback={feedbackMain ? { key: feedbackMain.key, kind: feedbackMain.kind, seq: feedbackMain.seq } : null}
              labels={{ hit: t('hit_label'), miss: t('miss_label') }}
            />
            )}
            <p className="caption">
              {t('position')} {curPos + 1} / {model.positions.length}
              {pb.activeId === 'main' && ` · ${t('cycle_label')} ${pb.cycle}`}
            </p>
          </div>
        </section>

        {s.view === 'neck' && (
        <PositionGrid
          t={t}
          ctx={ctx}
          positions={model.positions}
          activeId={pb.activeId}
          playingKey={pb.playingKey}
          nextKey={pb.nextKey}
          feedback={pb.feedback}
          cycle={pb.cycle}
          hints={s.fingering}
          inverted={s.inverted}
          showGhost={s.showGhost}
          onToggle={(d) => pb.toggle(d.id, d.sequence)}
        />
        )}
      </main>

      <Footer t={t} lang={s.lang} />

      {pb.countdown !== null && (
        <div className="overlay overlay--count" aria-live="assertive">
          <div className="countdown">
            <span className="countdown__num">{pb.countdown}</span>
            <span className="countdown__text">{pb.micStatus === 'calibrating' ? t('mic_calibrating') : t('starting_in')}</span>
          </div>
        </div>
      )}

      {sheet && (
        <SettingsSheet
          t={t}
          onClose={() => setSheet(false)}
          onHelp={() => {
            setSheet(false);
            setHelp(true);
          }}
          onBackingTrack={() => {
            setSheet(false);
            setBacking(true);
          }}
          micStatus={pb.micStatus}
        />
      )}
      {metronome && <MetronomeModal t={t} onClose={() => setMetronome(false)} />}
      {tuner && <TunerModal t={t} strings={instrument.strings} onClose={() => setTuner(false)} />}
      {help && <HelpModal t={t} onClose={() => setHelp(false)} />}
      {backing && <BackingTrackModal t={t} onClose={() => setBacking(false)} />}
      {pb.score && (
        <ScoreModal
          score={pb.score}
          t={t}
          cleared={cleared}
          onClose={pb.closeScore}
          onClear={() => {
            if (window.confirm(t('confirm_clear'))) {
              clearStats();
              setCleared(true);
            }
          }}
        />
      )}
    </div>
  );
}


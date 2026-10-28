import { useCallback, useEffect, useRef, useState } from 'react';
import { MicEngine } from '../audio/micEngine';
import { detectHeadset } from '../audio/headset';
import { playClick, playPluck } from '../audio/synth';
import { Sequencer } from '../audio/sequencer';
import { clampBpm, nextLoopState } from '../core/autoBpm';
import { hitWindowMs } from '../core/judge';
import { analyze, recordSession, type Analysis } from '../core/stats';
import { nextWindowIndex } from '../core/hints';
import type { DiagramData, FretWindow, PlayNote } from '../core/types';
import { useSettings } from '../state/store';
import { loadStats, saveStats } from '../state/statsStorage';
import { scoreTitle } from './scoreText';
import { NOTES } from '../core/notes';

export type MicStatus = 'off' | 'calibrating' | 'ready' | 'error';

export interface Feedback {
  diagramId: string;
  key: string;
  kind: 'hit' | 'miss';
  seq: number;
}

export interface ScoreSummary {
  hits: number;
  misses: number;
  total: number;
  pct: number;
  title: string;
  analysis: Analysis | null;
}

interface MicTarget {
  diagramId: string;
  key: string;
}

interface Counters {
  hits: number;
  misses: number;
  total: number;
  missed: string[];
}

const emptyCounters = (): Counters => ({ hits: 0, misses: 0, total: 0, missed: [] });

/** Nome do diagrama como aparece na tela: 'pos-1' vira 'posição 2' (ids começam em zero). */
export function diagramName(id: string): string {
  if (id === 'main') return 'escala completa';
  const n = Number(id.split('-')[1]);
  return Number.isFinite(n) ? `posição ${n + 1}` : id;
}

/** Chave da nota dentro do diagrama: 'corda-traste'. */
const noteKey = (n: PlayNote) => `${n.string}-${n.fret}`;

/** Orquestra reprodução, contagem regressiva, microfone (desafio) e pontuação. */
export function usePlayback(positions: DiagramData[], scaleName: string) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [posIndex, setPosIndex] = useState(0);
  /** Índice da nota dentro da sequência atual (para respeitar a unidade do exercício). */
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [score, setScore] = useState<ScoreSummary | null>(null);
  const [micStatus, setMicStatus] = useState<MicStatus>('off');
  /** Chave da próxima nota a tocar (destaque no braço). */
  const [nextKey, setNextKey] = useState<string | null>(null);
  /** Ciclo atual (1 = primeira passada da sequência) e se a nota em execução fecha o ciclo. */
  const [cycle, setCycle] = useState(1);
  const [cycleEnd, setCycleEnd] = useState(false);
  const seqRef2 = useRef<PlayNote[]>([]);

  const seqRef = useRef(0);
  const countdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStart = useRef<number | null>(null);
  const counters = useRef<Counters>(emptyCounters());
  const loopCount = useRef(0);
  const posRef = useRef(0);
  const windowsRef = useRef<FretWindow[]>([]);
  const activeRef = useRef<string | null>(null);
  const scaleNameRef = useRef(scaleName);
  scaleNameRef.current = scaleName;

  const showFeedback = useCallback((diagramId: string, key: string, kind: 'hit' | 'miss') => {
    seqRef.current += 1;
    setFeedback({ diagramId, key, kind, seq: seqRef.current });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 800);
  }, []);

  const mic = useRef<MicEngine<MicTarget> | null>(null);
  if (!mic.current) {
    mic.current = new MicEngine<MicTarget>(({ verdict, id }) => {
      const c = counters.current;
      if (verdict === 'hit') {
        c.hits++;
      } else {
        c.misses++;
        c.missed.push(id.key);
      }
      showFeedback(id.diagramId, id.key, verdict);
    });
  }

  const sequencer = useRef<Sequencer | null>(null);
  if (!sequencer.current) sequencer.current = new Sequencer(() => clampBpm(useSettings.getState().bpm));

  const audio = useRef<AudioContext | null>(null);
  /** Null onde não há Web Audio (ex.: ambiente de testes): a reprodução segue sem som. */
  const getAudio = (): AudioContext | null => {
    if (!audio.current) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      audio.current = new AC();
    }
    if (audio.current.state === 'suspended') void audio.current.resume();
    return audio.current;
  };

  useEffect(() => {
    windowsRef.current = positions.map((p) => [p.start, p.end] as FretWindow);
  }, [positions]);

  /** Encerra a reprodução. Com `withScore`, mostra o resumo do desafio se houve notas. */
  const stop = useCallback((withScore: boolean) => {
    sequencer.current?.stop();
    if (countdownTimer.current) clearTimeout(countdownTimer.current);
    countdownTimer.current = null;
    setCountdown(null);
    setActiveId(null);
    activeRef.current = null;
    setPlayingKey(null);
    setNextKey(null);
    setCycleEnd(false);
    mic.current?.stop();
    setMicStatus('off');

    const c = counters.current;
    if (withScore && useSettings.getState().challenge && c.total > 0) {
      const pct = Math.round((c.hits / c.total) * 100);
      const durationSec = sessionStart.current ? Math.round((Date.now() - sessionStart.current) / 1000) : 0;
      const next = recordSession(loadStats(), {
        scaleName: scaleNameRef.current,
        durationSec,
        hits: c.hits,
        misses: c.misses,
        missedNotes: c.missed,
      });
      saveStats(next);
      setScore({
        hits: c.hits,
        misses: c.misses,
        total: c.total,
        pct,
        title: scoreTitle(useSettings.getState().lang, pct),
        analysis: analyze(next),
      });
    }
    sessionStart.current = null;
    counters.current = emptyCounters();
  }, []);

  const onNote = useCallback((note: PlayNote, index: number) => {
    const diagramId = activeRef.current ?? 'main';
    const key = noteKey(note);
    setPlayingKey(key);
    if (useSettings.getState().debug) {
      // Registro da execução: confere, nota a nota, casa, corda e frequência tocadas.
      console.log(`[exec] ${diagramName(diagramId)} nota ${index + 1} ${NOTES[note.noteIdx]} corda=${note.string + 1} traste=${note.fret} hz=${note.pitch.toFixed(2)}`);
    }
    const seq = seqRef2.current;
    if (seq.length > 0) setNextKey(noteKey(seq[(index + 1) % seq.length]));
    setStep(index);
    setCycleEnd(index === seq.length - 1);

    if (diagramId === 'main' && windowsRef.current.length > 0) {
      const next = nextWindowIndex(posRef.current, note.fret, windowsRef.current);
      if (next !== posRef.current) {
        posRef.current = next;
        setPosIndex(next);
      }
    }

    const s = useSettings.getState();
    const headsetMissing = s.challenge && detectHeadset() === false;
    const ac = getAudio();
    if (!headsetMissing && ac) playPluck(ac, note.pitch, s.volume);
    // Metrônomo: um clique por nota; a primeira do ciclo é a mais forte.
    if (s.metronome && ac) playClick(ac, index === 0, s.volume);

    if (s.challenge && mic.current?.isRunning) {
      const accepted = mic.current.expect({ diagramId, key }, note.pitch, performance.now() + hitWindowMs(s.bpm));
      if (accepted) counters.current.total++;
    }
  }, []);

  const onLoop = useCallback(() => {
    setCycle((c) => c + 1);
    const s = useSettings.getState();
    const next = nextLoopState(loopCount.current, s.bpm, { enabled: s.autoBpm, cycles: s.autoCycles });
    loopCount.current = next.loopCount;
    if (next.bpm !== s.bpm) s.setBpm(next.bpm);
  }, []);

  /** Inicia a sequência, ou para se este diagrama já está ativo (contagem ou reprodução). */
  const toggle = useCallback(
    (diagramId: string, sequence: PlayNote[]) => {
      getAudio();
      if (activeRef.current === diagramId) {
        stop(true);
        return;
      }
      stop(false);
      if (sequence.length === 0) return;

      const my = ++seqRef.current;
      seqRef2.current = sequence;
      activeRef.current = diagramId;
      setActiveId(diagramId);
      counters.current = emptyCounters();
      loopCount.current = 0;
      posRef.current = 0;
      setPosIndex(0);
      setCycle(1);
      setStep(0);
      setCycleEnd(false);

      if (useSettings.getState().challenge) {
        setMicStatus('calibrating');
        mic.current!
          .start()
          .then(() => setMicStatus('ready'))
          .catch(() => setMicStatus('error'));
      }

      let n = 3;
      setCountdown(n);
      const step = () => {
        if (seqRef.current !== my) return;
        n--;
        if (n > 0) {
          // Contagem regressiva também marca o tempo, se o metrônomo estiver ligado.
          const ac = getAudio();
          if (useSettings.getState().metronome && ac) playClick(ac, false, useSettings.getState().volume);
          setCountdown(n);
          countdownTimer.current = setTimeout(step, 1000);
          return;
        }
        setCountdown(null);
        countdownTimer.current = null;
        sessionStart.current = Date.now();
        sequencer.current!.start(sequence, { onNote, onLoop });
      };
      countdownTimer.current = setTimeout(step, 1000);
    },
    [stop, onNote, onLoop],
  );

  /** Mudar qualquer configuração que altera o braço para a reprodução, sem pontuar. */
  const armKey = useSettings((s) => `${s.instrument}|${s.root}|${s.category}|${s.mode}|${s.exercise}|${s.strings}|${s.inverted}`);
  const challenge = useSettings((s) => s.challenge);
  useEffect(() => {
    stop(false);
  }, [armKey, stop]);

  useEffect(() => {
    if (!challenge) mic.current?.stop();
  }, [challenge]);

  useEffect(
    () => () => {
      sequencer.current?.stop();
      mic.current?.stop();
      if (countdownTimer.current) clearTimeout(countdownTimer.current);
      void audio.current?.close();
    },
    [],
  );

  return {
    activeId,
    playingKey,
    nextKey,
    step,
    cycle,
    cycleEnd,
    countdown,
    posIndex,
    feedback,
    score,
    closeScore: () => setScore(null),
    micStatus,
    toggle,
    stop,
  };
}

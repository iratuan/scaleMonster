import type { PlayNote } from '../core/types';

export interface SequencerHooks {
  /** Chamado antes de cada nota. `bpm` é lido no momento da nota (permite mudar a velocidade ao vivo). */
  onNote: (note: PlayNote, index: number) => void;
  /** Chamado ao concluir a sequência completa (um ciclo). */
  onLoop: () => void;
}

/** Reproduz uma sequência de notas em loop, com tempo lido a cada nota. */
export class Sequencer {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private index = 0;
  private running = false;

  constructor(private readonly getBpm: () => number) {}

  get isRunning(): boolean {
    return this.running;
  }

  start(sequence: PlayNote[], hooks: SequencerHooks): void {
    this.stop();
    if (sequence.length === 0) return;
    this.running = true;
    this.index = 0;

    const tick = () => {
      if (!this.running) return;
      if (this.index >= sequence.length) {
        this.index = 0;
        hooks.onLoop();
      }
      const note = sequence[this.index];
      hooks.onNote(note, this.index);
      this.index++;
      const msPerBeat = Math.round(60000 / this.getBpm());
      this.timer = setTimeout(tick, msPerBeat);
    };
    tick();
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}

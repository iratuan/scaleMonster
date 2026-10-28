import { autoCorrelate } from '../core/pitch';
import { NoteJudge, type Verdict } from '../core/judge';

export interface MicResult<T> {
  verdict: Verdict;
  id: T;
}

/**
 * Captura o microfone, calibra o ruído de fundo e avalia cada nota esperada.
 * Não toca em DOM: quem consome os resultados decide o que mostrar.
 */
export class MicEngine<T> {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private frame = 0;
  private noiseFloor = 0.02;
  private running = false;
  private readonly judge = new NoteJudge<T>();

  constructor(private readonly onResult: (r: MicResult<T>) => void) {}

  get isRunning(): boolean {
    return this.running;
  }

  /** Abre o microfone e calibra (≈150 frames em silêncio). Rejeita se o acesso for negado. */
  async start(): Promise<void> {
    this.stop();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.ctx.createMediaStreamSource(this.stream).connect(this.analyser);

    const buffer = new Float32Array(this.analyser.fftSize);
    let maxRms = 0;
    let frames = 0;
    const calibrate = () => {
      if (!this.analyser) return;
      this.analyser.getFloatTimeDomainData(buffer);
      let sum = 0;
      for (const v of buffer) sum += v * v;
      maxRms = Math.max(maxRms, Math.sqrt(sum / buffer.length));
      frames++;
      if (frames < 150) {
        this.frame = requestAnimationFrame(calibrate);
      } else {
        this.noiseFloor = Math.max(maxRms * 1.5, 0.01);
        this.running = true;
        this.loop();
      }
    };
    calibrate();
  }

  /** Registra a nota esperada. Só conta se o motor já estiver calibrado. */
  expect(id: T, pitch: number, deadline: number): boolean {
    if (!this.running) return false;
    this.judge.expect(id, pitch, deadline);
    return true;
  }

  private loop = (): void => {
    if (!this.running || !this.analyser || !this.ctx) return;
    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);
    const pitch = autoCorrelate(buffer, this.ctx.sampleRate, this.noiseFloor);
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
    const rms = Math.sqrt(sum / buffer.length);
    const result = this.judge.feed(pitch, performance.now(), rms, this.noiseFloor);
    if (result) this.onResult(result);
    this.frame = requestAnimationFrame(this.loop);
  };

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.judge.clear();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.ctx && this.ctx.state !== 'closed') void this.ctx.close();
    this.ctx = null;
    this.analyser = null;
  }
}

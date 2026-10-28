import { autoCorrelate } from '../core/pitch';

/** Captura o microfone e envia a frequência detectada a cada quadro (0 = sem sinal). */
export class TunerEngine {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private frame = 0;
  private running = false;

  constructor(private readonly onFrame: (freq: number) => void) {}

  get isRunning(): boolean {
    return this.running;
  }

  async start(): Promise<void> {
    this.stop();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    this.analyser = this.ctx.createAnalyser();
    // Janela maior: frequências graves (E1, E2) precisam de mais amostras para estabilizar.
    this.analyser.fftSize = 4096;
    this.ctx.createMediaStreamSource(this.stream).connect(this.analyser);
    this.running = true;
    this.loop();
  }

  private loop = (): void => {
    if (!this.running || !this.analyser || !this.ctx) return;
    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);
    const freq = autoCorrelate(buffer, this.ctx.sampleRate, 0.01);
    this.onFrame(freq > 0 && Number.isFinite(freq) ? freq : 0);
    this.frame = requestAnimationFrame(this.loop);
  };

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.ctx && this.ctx.state !== 'closed') void this.ctx.close();
    this.ctx = null;
    this.analyser = null;
  }
}

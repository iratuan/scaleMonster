/**
 * Detecção de frequência fundamental por autocorrelação no domínio do tempo.
 * Retorna a frequência em Hz, ou -1 quando não há sinal acima do ruído de fundo.
 */
export function autoCorrelate(input: Float32Array, sampleRate: number, noiseFloor: number): number {
  let rms = 0;
  for (let i = 0; i < input.length; i++) rms += input[i] * input[i];
  rms = Math.sqrt(rms / input.length);
  if (rms < noiseFloor) return -1;

  const threshold = 0.2;
  let r1 = 0;
  let r2 = input.length - 1;
  for (let i = 0; i < input.length / 2; i++) {
    if (Math.abs(input[i]) < threshold) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < input.length / 2; i++) {
    if (Math.abs(input[input.length - i]) < threshold) {
      r2 = input.length - i;
      break;
    }
  }

  const buf = input.subarray(r1, r2);
  const size = buf.length;
  const corr = new Float32Array(size);
  for (let lag = 0; lag < size; lag++) {
    let sum = 0;
    for (let j = 0; j < size - lag; j++) sum += buf[j] * buf[j + lag];
    corr[lag] = sum;
  }

  let d = 0;
  while (d < size - 1 && corr[d] > corr[d + 1]) d++;

  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < size; i++) {
    if (corr[i] > maxVal) {
      maxVal = corr[i];
      maxPos = i;
    }
  }
  if (maxPos <= 0) return -1;
  return sampleRate / maxPos;
}

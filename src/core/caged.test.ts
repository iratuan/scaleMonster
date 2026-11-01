import { describe, expect, it } from 'vitest';
import { fretWidths, fretWidthsOn } from './caged';

describe('fretWidthsOn: posições na mesma escala do braço completo', () => {
  it('cada trecho reproduz exatamente a largura dos mesmos trastes no braço inteiro', () => {
    const full = fretWidths(0, 12);
    // O trecho 3 a 6 deve ter as mesmas larguras que os trastes 3 a 6 do braço inteiro.
    const piece = fretWidthsOn(3, 6, 0, 12);
    expect(piece).toHaveLength(4);
    piece.forEach((w, i) => expect(w).toBeCloseTo(full[3 + i], 6));
  });

  it('a soma dos trechos de um braço dividido é a largura do braço inteiro', () => {
    const left = fretWidthsOn(0, 6, 0, 12).reduce((a, b) => a + b, 0);
    const right = fretWidthsOn(7, 12, 0, 12).reduce((a, b) => a + b, 0);
    const whole = fretWidths(0, 12).reduce((a, b) => a + b, 0);
    expect(left + right).toBeCloseTo(whole, 6);
  });

  it('um trecho menor que o braço fica proporcionalmente menor', () => {
    const narrow = fretWidthsOn(5, 7, 0, 12).reduce((a, b) => a + b, 0);
    const wide = fretWidthsOn(5, 10, 0, 12).reduce((a, b) => a + b, 0);
    expect(narrow).toBeLessThan(wide);
    expect(wide).toBeLessThan(100);
  });
});

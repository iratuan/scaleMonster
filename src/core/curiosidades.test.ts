import { describe, expect, it } from 'vitest';
import { CURIOSIDADES, pickCuriosidade } from './curiosidades';

describe('curiosidades do rodapé', () => {
  it('sorteia dentro da lista do idioma', () => {
    expect(CURIOSIDADES.pt).toContain(pickCuriosidade('pt', () => 0.5));
    expect(CURIOSIDADES.en).toContain(pickCuriosidade('en', () => 0.5));
  });

  it('idiomas sem tradução usam inglês', () => {
    expect(CURIOSIDADES.en).toContain(pickCuriosidade('fr', () => 0.5));
  });

  it('o sorteio cobre a lista inteira e nunca passa do fim', () => {
    const n = CURIOSIDADES.pt.length;
    const seen = new Set<string>();
    for (let i = 0; i < n; i++) seen.add(pickCuriosidade('pt', () => i / n));
    expect(seen.size).toBe(n);
    expect(pickCuriosidade('pt', () => 0.9999999)).toBe(CURIOSIDADES.pt[n - 1]);
  });

  it('todas as curiosidades têm texto não vazio', () => {
    for (const list of Object.values(CURIOSIDADES)) for (const f of list) expect(f.trim().length).toBeGreaterThan(20);
  });

  it('cada idioma tem pelo menos 30 curiosidades', () => {
    expect(CURIOSIDADES.pt.length).toBeGreaterThanOrEqual(30);
    expect(CURIOSIDADES.en.length).toBeGreaterThanOrEqual(30);
  });
});

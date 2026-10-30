import { describe, expect, it } from 'vitest';
import { clefShift, defaultClef, resolveClef, staffKey, vexClef } from './notation';

describe('pauta: claves e grafia', () => {
  it('guitarra e violão usam sol com 8 embaixo; baixo, fá com 8 embaixo; ukulele, sol', () => {
    expect(defaultClef('guitarra')).toBe('treble8');
    expect(defaultClef('violao')).toBe('treble8');
    expect(defaultClef('baixo')).toBe('bass8');
    expect(defaultClef('ukulele')).toBe('treble');
    expect(defaultClef('cavaco')).toBe('treble');
  });

  it('escolha manual sobrepõe o padrão do instrumento', () => {
    expect(resolveClef('auto', 'guitarra')).toBe('treble8');
    expect(resolveClef('bass', 'guitarra')).toBe('bass');
  });

  it('clave com 8 embaixo desloca a nota uma oitava acima do som', () => {
    expect(clefShift('treble8')).toBe(12);
    expect(clefShift('bass8')).toBe(12);
    expect(clefShift('treble')).toBe(0);
  });

  it('a clave com 8 embaixo recebe a anotação 8vb no VexFlow', () => {
    expect(vexClef('treble8')).toEqual({ name: 'treble', annotation: '8vb' });
    expect(vexClef('alto')).toEqual({ name: 'alto' });
  });

  it('converte a altura MIDI para a chave da pauta (C4 = c/4)', () => {
    expect(staffKey(60, 0).key).toBe('c/4');
    expect(staffKey(61, 1)).toEqual({ key: 'c#/4', accidental: '#' });
    expect(staffKey(64, 4).key).toBe('e/4');
  });

  it('o deslocamento da clave sobe a nota uma oitava (E2 do baixo com 8vb fica E3)', () => {
    expect(staffKey(40, 4, 0).key).toBe('e/2');
    expect(staffKey(40, 4, clefShift('bass8')).key).toBe('e/3');
  });
});

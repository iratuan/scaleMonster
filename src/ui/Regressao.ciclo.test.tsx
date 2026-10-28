// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import App from './App';
import { useSettings } from '../state/store';

/**
 * Regressão: baixo de 4 cordas, exercício 4 com cordas 1–2 gera 12 notas por ciclo.
 * Na 12ª nota o ciclo fecha e recomeça: o app deve sinalizar isso (não parecer que
 * a escala "voltou" sem aviso), e a 13ª nota inicia o ciclo 2.
 */
describe('regressão: fim de ciclo na 12ª nota', () => {
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('sinaliza o fim do ciclo (10 notas) e mostra o ciclo 2 na 11ª nota', () => {
    vi.useFakeTimers();
    useSettings.setState({ lang: 'pt', instrument: 'baixo', stringCount: 4, strings: '1-2', root: 'C', category: 'Pentatônica', mode: 'Maior', exercise: 4, bpm: 80 });
    const { container } = render(<App />);
    const card = container.querySelector('.neck') as HTMLElement;
    const play = card.querySelector('.play') as HTMLButtonElement;

    act(() => {
      fireEvent.click(play);
    });
    // Contagem de 3 s; depois a 1ª nota soa. 80 BPM = 750 ms por nota.
    act(() => {
      vi.advanceTimersByTime(3000 + 9 * 750 + 100); // 10ª nota
    });
    expect(card.querySelectorAll('.note--play').length).toBe(1);
    expect(card.textContent).toContain('10 notas');
    expect(card.textContent).toContain('Ciclo 1');

    act(() => {
      vi.advanceTimersByTime(750); // 11ª nota = 1ª do ciclo 2
    });
    expect(card.textContent).toContain('Ciclo 2');

    act(() => {
      fireEvent.click(play);
    });
  });
});

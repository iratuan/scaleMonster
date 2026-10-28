// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import App from './App';

describe('reprodução na interface', () => {
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('a nota em execução aparece destacada no braço principal e a próxima fica marcada', () => {
    vi.useFakeTimers();
    const { container } = render(<App />);
    const play = container.querySelector('.section .play') as HTMLButtonElement;

    act(() => {
      fireEvent.click(play);
    });
    // Contagem regressiva de 3 s, depois a primeira nota.
    act(() => {
      vi.advanceTimersByTime(3100);
    });

    const main = container.querySelector('[data-diagram="main"]') as HTMLElement;
    const playing = main.querySelectorAll('.note--play');
    expect(playing.length).toBe(1);
    // A nota em execução é uma nota do exercício, então está visível (preenchida).
    expect(playing[0].classList.contains('note--on')).toBe(true);
    expect(main.querySelectorAll('.note--next').length).toBeLessThanOrEqual(1);

    // Avança para a próxima nota: o destaque acompanha a execução.
    const first = playing[0].closest('.fb__cell');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const later = main.querySelectorAll('.note--play')[0]?.closest('.fb__cell');
    expect(later).toBeDefined();
    expect(later).not.toBe(first); // a nota em execução muda de casa a cada tempo

    act(() => {
      fireEvent.click(play); // parar
    });
    expect(main.querySelectorAll('.note--play').length).toBe(0);
  });

  it('a barra de espaço toca e para a escala completa', () => {
    vi.useFakeTimers();
    const { container } = render(<App />);
    act(() => {
      fireEvent.keyDown(document.body, { code: 'Space', key: ' ' });
    });
    expect(container.querySelector('.countdown__num')?.textContent).toBe('3');
    act(() => {
      fireEvent.keyDown(document.body, { code: 'Space', key: ' ' });
    });
    expect(container.querySelector('.countdown__num')).toBeNull();
  });
});

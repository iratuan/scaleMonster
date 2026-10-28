// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('monta o braço da escala completa e as 5 posições (violão padrão, 6 cordas)', () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll('.fb__board').length).toBe(6);
    expect(container.querySelectorAll('.neck__slide').length).toBe(5);
    expect(container.querySelector('.fb__tuning')?.children.length).toBe(6);
    cleanup();
  });

  it('barra do topo tem tom, escala, variação, cordas, exercício e velocidade', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.toolbar')?.querySelectorAll('.cb').length).toBe(6);
    cleanup();
  });

  it('troca de instrumento: baixo tem 4 cordas e o braço é refeito', () => {
    const { container } = render(<App />);
    const instrumentChips = container.querySelector('.chips')!.querySelectorAll('.chip');
    expect(instrumentChips.length).toBe(5);
    // Índice 2 = baixo (ordem: guitarra, violão, baixo, ukulele, cavaco), independe do idioma.
    fireEvent.click(instrumentChips[2] as HTMLElement);
    expect(container.querySelector('.fb__tuning')?.children.length).toBe(4);
    cleanup();
  });

  it('Tocar inicia a contagem regressiva e tocar de novo para', () => {
    const { container } = render(<App />);
    const playMain = container.querySelector('.section .play') as HTMLButtonElement;
    fireEvent.click(playMain);
    expect(container.querySelector('.countdown__num')?.textContent).toBe('3');
    fireEvent.click(playMain);
    expect(container.querySelector('.countdown__num')).toBeNull();
    cleanup();
  });

  it('abre a folha de ajustes pelo ícone de engrenagem do cabeçalho', () => {
    const { container } = render(<App />);
    fireEvent.click(container.querySelector('.header__actions .icon-btn:last-child') as HTMLButtonElement);
    expect(document.querySelector('.panel--sheet')).not.toBeNull();
    cleanup();
  });
});

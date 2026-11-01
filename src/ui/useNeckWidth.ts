import { useLayoutEffect } from 'react';

/**
 * Publica a largura real do braço principal na variável CSS `--neck-w` (do elemento `.page`).
 * Todos os trastes, o braço completo e as posições, leem essa variável: cada trasto tem
 * a mesma largura em todos os cartões, e a posição é um recorte fiel da escala.
 */
export function useNeckWidth(deps: unknown[]): void {
  useLayoutEffect(() => {
    const board = document.querySelector<HTMLElement>('.fb[data-diagram="main"] .fb__board');
    const page = board?.closest<HTMLElement>('.page');
    if (!board || !page || typeof ResizeObserver === 'undefined') return;
    const apply = () => page.style.setProperty('--neck-w', `${board.getBoundingClientRect().width}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(board);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

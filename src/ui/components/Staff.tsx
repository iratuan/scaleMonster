import { useEffect, useRef } from 'react';
import { Accidental, Annotation, Beam, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import { vexClef, type ClefId, type StaffKey } from '../../core/notation';

/** Notas por compasso (4/4 com colcheias) e compassos por linha. */
const PER_BAR = 8;
const BARS_PER_LINE = 4;
const LINE_HEIGHT = 150;

/**
 * Quebra a sequência em linhas: cada bloco (posição) começa numa linha nova, e um bloco longo
 * continua nas linhas seguintes. Retorna, por linha, os compassos como intervalos [início, fim).
 */
export function layoutLines(total: number, breaks: number[]): Array<Array<[number, number]>> {
  const starts = [...new Set([0, ...breaks.filter((b) => b > 0 && b < total)])].sort((a, b) => a - b);
  const lines: Array<Array<[number, number]>> = [];
  starts.forEach((s, i) => {
    const e = i + 1 < starts.length ? starts[i + 1] : total;
    const bars: Array<[number, number]> = [];
    for (let b = s; b < e; b += PER_BAR) bars.push([b, Math.min(b + PER_BAR, e)]);
    // Linhas equilibradas: 5 compassos viram 3 + 2 (nunca 4 + 1, que deixaria uma linha com uma nota só).
    const count = Math.ceil(bars.length / BARS_PER_LINE);
    const per = Math.ceil(bars.length / count);
    for (let j = 0; j < bars.length; j += per) lines.push(bars.slice(j, j + per));
  });
  return lines;
}

interface StaffProps {
  keys: StaffKey[];
  clef: ClefId;
  /** Índices em que começa uma posição (cada uma vai para uma linha nova). */
  breaks: number[];
  /** Rótulo por índice (ex.: "P1" na primeira nota de cada posição). */
  labels: Map<number, string>;
  /** Trecho do ciclo atual (índices [from, to)). Fora dele, as notas ficam apagadas durante a execução. */
  from: number;
  to: number;
  /** Índice da nota que está tocando, ou null. */
  active: number | null;
  playing: boolean;
}

/** Cores do tema lidas do próprio elemento, porque o SVG não usa variáveis CSS. */
function palette(el: HTMLElement) {
  const css = getComputedStyle(el);
  const pick = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    ink: pick('--text', '#e8e8ea'),
    faint: pick('--faint', '#808089'),
    accent: pick('--accent', '#4ade80'),
  };
}

/** Partitura da escala tocada: cada posição numa linha (ou mais, se for longa), com o destaque da nota atual. */
export function Staff({ keys, clef, breaks, labels, from, to, active, playing }: StaffProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || keys.length === 0) return;
    el.innerHTML = '';
    const colors = palette(el);
    const width = Math.max(320, el.clientWidth || 640);
    const lines = layoutLines(keys.length, breaks);
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, lines.length * LINE_HEIGHT + 20);
    const ctx = renderer.getContext();
    const { name, annotation } = vexClef(clef);
    const padding = 16;
    const measureWidth = (width - padding * 2) / BARS_PER_LINE;

    lines.forEach((bars, li) => {
      const y = 20 + li * LINE_HEIGHT;
      bars.forEach(([bs, be], bi) => {
        const x = padding + bi * measureWidth;
        const stave = new Stave(x, y, measureWidth);
        if (bi === 0) stave.addClef(name, undefined, annotation);
        if (bi === 0 && li === 0) stave.addTimeSignature('4/4');
        stave.setContext(ctx).draw();

        const notes = keys.slice(bs, be).map((k, j) => {
          const index = bs + j;
          const note = new StaveNote({ keys: [k.key], duration: '8', clef: name });
          if (k.accidental) note.addModifier(new Accidental(k.accidental), 0);
          const label = labels.get(index);
          if (label) {
            const ann = new Annotation(label).setVerticalJustification(Annotation.VerticalJustify.TOP);
            note.addModifier(ann, 0);
          }
          const inCycle = !playing || (index >= from && index < to);
          const color = index === active ? colors.accent : inCycle ? colors.ink : colors.faint;
          note.setStyle({ fillStyle: color, strokeStyle: color });
          return note;
        });

        const voice = new Voice({ numBeats: 4, beatValue: 4 }).setStrict(false);
        voice.addTickables(notes);
        new Formatter().joinVoices([voice]).format([voice], measureWidth - 24);
        voice.draw(ctx, stave);
        Beam.generateBeams(notes).forEach((b) => b.setContext(ctx).draw());
      });
    });
  }, [keys, clef, breaks, labels, from, to, active, playing]);

  return <div ref={ref} className="staff" role="img" aria-label="Partitura" />;
}

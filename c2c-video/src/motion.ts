import type {CSSProperties} from 'react';
import {interpolate, useVideoConfig} from 'remotion';
import {DISTANCE, DURATION, EASE, SAFE, STAGGER, TYPE} from './tokens';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Progreso 0→1 entre `start` y `start + duration`, con easing. */
export const progress = (
  frame: number,
  start: number,
  duration: number,
  easing: (t: number) => number = EASE.out,
): number => interpolate(frame, [start, start + duration], [0, 1], {...CLAMP, easing});

const blur = (px: number): string => (px < 0.05 ? 'none' : `blur(${px.toFixed(2)}px)`);

/** Títulos hero: opacity 0→1, y 24→0, blur 8→0, 18 frames. */
export const blurIn = (frame: number, delay = 0): CSSProperties => {
  const p = progress(frame, delay, DURATION.slow);
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * DISTANCE.md}px)`,
    filter: blur((1 - p) * 8),
  };
};

/** Bloques: y 12→0, 11 frames. */
export const fadeUp = (frame: number, delay = 0, distance: number = DISTANCE.sm): CSSProperties => {
  const p = progress(frame, delay, DURATION.base);
  return {opacity: p, transform: `translateY(${(1 - p) * distance}px)`};
};

/** Cards / badges: scale 0.96→1. */
export const scaleIn = (frame: number, delay = 0, duration: number = DURATION.slow): CSSProperties => {
  const p = progress(frame, delay, duration);
  return {opacity: p, transform: `scale(${0.96 + 0.04 * p})`};
};

/** Delay del ítem `index` en una lista escalonada. */
export const stagger = (index: number, step: number = STAGGER.base, base = 0): number =>
  base + index * step;

/** Layout por composición: vertical (9:16) u horizontal (16:9). */
export const useLayout = () => {
  const {width, height} = useVideoConfig();
  const vertical = height > width;
  return {
    vertical,
    width,
    height,
    type: vertical ? TYPE.vertical : TYPE.horizontal,
    safe: vertical ? SAFE.vertical : SAFE.horizontal,
  };
};

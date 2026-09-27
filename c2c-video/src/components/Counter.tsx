import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {progress} from '../motion';
import {COLORS, DURATION, EASE} from '../tokens';

export type CounterStep = {at: number; value: number; color?: string};

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/**
 * Número grande que cambia de valor en frames dados.
 * El valor saliente sube y se desvanece; el entrante entra desde abajo.
 */
export const Counter: React.FC<{steps: CounterStep[]; fontSize: number; shakeAt?: number}> = ({
  steps,
  fontSize,
  shakeAt,
}) => {
  const frame = useCurrentFrame();
  let current = 0;
  for (let i = 0; i < steps.length; i++) if (frame >= steps[i].at) current = i;
  const prev = current > 0 ? steps[current - 1] : null;
  const cur = steps[current];
  const p = progress(frame, cur.at, DURATION.base, EASE.out);

  // shake sutil (solo transform), decae en ~0.5s
  let shake = 0;
  if (shakeAt !== undefined && frame >= shakeAt) {
    const t = frame - shakeAt;
    const decay = interpolate(t, [0, 16], [1, 0], CLAMP);
    shake = Math.sin(t * 1.9) * 12 * decay;
  }

  const glyph = (step: CounterStep, style: React.CSSProperties) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: step.color ?? COLORS.primary,
        ...style,
      }}
    >
      {step.value}
    </div>
  );

  return (
    <div
      style={{
        position: 'relative',
        width: fontSize * 1.3,
        height: fontSize * 1.15,
        fontSize,
        fontWeight: 800,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        transform: `translateX(${shake}px)`,
        overflow: 'hidden',
      }}
    >
      {prev && p < 1 ? glyph(prev, {opacity: 1 - p, transform: `translateY(${-p * 40}%)`}) : null}
      {glyph(cur, {opacity: prev ? p : 1, transform: `translateY(${prev ? (1 - p) * 40 : 0}%)`})}
    </div>
  );
};

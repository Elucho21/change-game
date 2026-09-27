import React from 'react';
import {COLORS, RADIUS} from '../tokens';
import {GlassCard} from './GlassCard';

export const Badge: React.FC<{children: React.ReactNode; fontSize: number; style?: React.CSSProperties}> = ({
  children,
  fontSize,
  style,
}) => (
  <GlassCard
    variant="default"
    radius={RADIUS.pill}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: fontSize * 0.5,
      padding: `${fontSize * 0.45}px ${fontSize * 1.1}px`,
      fontSize,
      fontWeight: 500,
      color: COLORS.foreground,
      letterSpacing: '0.02em',
      ...style,
    }}
  >
    <span
      style={{
        width: fontSize * 0.42,
        height: fontSize * 0.42,
        borderRadius: RADIUS.pill,
        background: COLORS.primary,
        boxShadow: `0 0 ${fontSize * 0.6}px ${COLORS.primary}`,
      }}
    />
    {children}
  </GlassCard>
);

/** Etiqueta pequeña en mayúsculas sobre los títulos. */
export const Eyebrow: React.FC<{children: React.ReactNode; fontSize: number; style?: React.CSSProperties}> = ({
  children,
  fontSize,
  style,
}) => (
  <div
    style={{
      fontSize,
      fontWeight: 600,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: COLORS.accent,
      ...style,
    }}
  >
    {children}
  </div>
);

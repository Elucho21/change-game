import React from 'react';
import {COLORS, RADIUS} from '../tokens';

/** Button "default" del sistema: bg primary, rounded-xl, sombra primary. */
export const Button: React.FC<{children: React.ReactNode; fontSize: number; style?: React.CSSProperties}> = ({
  children,
  fontSize,
  style,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: fontSize * 0.5,
      padding: `${fontSize * 0.7}px ${fontSize * 1.5}px`,
      borderRadius: RADIUS.xl,
      background: COLORS.primary,
      color: COLORS.primaryForeground,
      fontSize,
      fontWeight: 600,
      boxShadow: '0 10px 30px hsl(213 100% 53% / 0.40), inset 0 1px 0 hsl(213 100% 80% / 0.35)',
      ...style,
    }}
  >
    {children}
    <svg width={fontSize * 0.8} height={fontSize * 0.8} viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" stroke={COLORS.primaryForeground} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

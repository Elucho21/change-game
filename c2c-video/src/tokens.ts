import type {CSSProperties} from 'react';
import {Easing} from 'remotion';

// ── Impulse World · Liquid Glass (DARK) ─────────────────────────────
export const COLORS = {
  background: '#0B0E13', // hsl(220 25% 6%)
  foreground: '#E5E7EB',
  card: '#12161F',
  primary: '#0F82FF', // hsl(213 100% 53%)
  primaryForeground: '#F5F9FF',
  secondary: '#0B1E3C',
  accent: '#8FC4FF',
  mutedForeground: '#9AA1AC',
  border: '#20293B',
  destructive: '#EF4444',
  chart4: 'hsl(190 80% 60%)',
} as const;

export const GRADIENT_TEXT: CSSProperties = {
  backgroundImage: `linear-gradient(100deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

export const RADIUS = {
  base: 20, // --radius 1.25rem
  lg: 28, // cards grandes
  xl: 16, // botones (rounded-xl)
  pill: 9999,
} as const;

// ── Glass ───────────────────────────────────────────────────────────
export const GLASS: Record<'default' | 'strong' | 'subtle', CSSProperties> = {
  default: {
    background: 'hsl(220 30% 12% / 0.6)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid hsl(220 30% 25% / 0.4)',
    boxShadow:
      '0 8px 32px hsl(213 100% 53% / 0.15), inset 0 1px 0 hsl(220 30% 30% / 0.3), inset 0 -1px 0 hsl(0 0% 0% / 0.05)',
  },
  strong: {
    background: 'hsl(220 30% 12% / 0.65)',
    backdropFilter: 'blur(32px) saturate(1.2)',
    WebkitBackdropFilter: 'blur(32px) saturate(1.2)',
    border: '1px solid hsl(220 30% 30% / 0.5)',
    boxShadow:
      '0 12px 40px hsl(213 100% 53% / 0.22), inset 0 1px 0 hsl(220 30% 35% / 0.35), inset 0 -1px 0 hsl(0 0% 0% / 0.05)',
  },
  subtle: {
    background: 'hsl(220 30% 12% / 0.45)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid hsl(220 30% 25% / 0.35)',
  },
};

// ── Motion (segundos → frames @30fps) ───────────────────────────────
export const FPS = 30;

export const DURATION = {
  fast: 6, // 0.2s
  base: 11, // 0.35s
  slow: 18, // 0.6s
  slower: 27, // 0.9s
} as const;

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  spring: Easing.bezier(0.34, 1.56, 0.64, 1),
} as const;

export const STAGGER = {
  tight: 1, // 0.04s
  base: 2, // 0.07s
  loose: 4, // 0.12s
} as const;

export const DISTANCE = {xs: 6, sm: 12, md: 24, lg: 48} as const;

// Transiciones entre escenas (fade + slide corto)
export const TRANSITION_FRAMES = 14;

// ── Tipografía por formato ──────────────────────────────────────────
export type TypeScale = {
  hero: number;
  h1: number;
  h2: number;
  h3: number;
  body: number;
  small: number;
};

export const TYPE: Record<'vertical' | 'horizontal', TypeScale> = {
  vertical: {hero: 116, h1: 86, h2: 58, h3: 46, body: 41, small: 32},
  horizontal: {hero: 104, h1: 76, h2: 54, h3: 40, body: 34, small: 27},
};

// Safe areas (vertical: UI de Reels/TikTok arriba 120, abajo 220)
export const SAFE = {
  vertical: {top: 150, bottom: 250, x: 72},
  horizontal: {top: 90, bottom: 90, x: 130},
} as const;

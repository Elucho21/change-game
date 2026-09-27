import React from 'react';
import {GLASS, RADIUS} from '../tokens';

type Props = {
  variant?: 'default' | 'strong' | 'subtle';
  radius?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

/** Superficie Liquid Glass. Nunca anidar glass dentro de glass. */
export const GlassCard: React.FC<Props> = ({variant = 'default', radius = RADIUS.base, style, children}) => (
  <div style={{...GLASS[variant], borderRadius: radius, position: 'relative', ...style}}>{children}</div>
);

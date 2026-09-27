import React from 'react';
import {useCurrentFrame} from 'remotion';
import {fadeUp, useLayout} from '../motion';
import {COLORS} from '../tokens';

/** Letra chica: 400, muted-foreground, ≥32px en vertical. */
export const FinePrint: React.FC<{lines: string[] | string; delay: number; style?: React.CSSProperties}> = ({
  lines,
  delay,
  style,
}) => {
  const frame = useCurrentFrame();
  const {type} = useLayout();
  const list = Array.isArray(lines) ? lines : [lines];
  return (
    <div
      style={{
        ...fadeUp(frame, delay),
        fontSize: type.small,
        fontWeight: 400,
        lineHeight: 1.38,
        color: COLORS.mutedForeground,
        display: 'flex',
        flexDirection: 'column',
        gap: type.small * 0.35,
        ...style,
      }}
    >
      {list.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
};

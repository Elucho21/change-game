import React from 'react';
import {COLORS, GRADIENT_TEXT} from '../tokens';

export type Emphasis = 'gradient' | 'primary' | 'destructive' | 'accent';

const EMPHASIS_STYLE: Record<Emphasis, React.CSSProperties> = {
  gradient: GRADIENT_TEXT,
  primary: {color: COLORS.primary},
  destructive: {color: COLORS.destructive},
  accent: {color: COLORS.accent},
};

/** Renderiza texto con **énfasis** (sintaxis de content.ts). */
export const Rich: React.FC<{text: string; emphasis?: Emphasis; weight?: number}> = ({
  text,
  emphasis = 'primary',
  weight = 600,
}) => {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} style={{...EMPHASIS_STYLE[emphasis], fontWeight: weight}}>
            {part}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
};

/** Texto plano sin marcas ** (para medir o para aria). */
export const plain = (text: string): string => text.replace(/\*\*/g, '');

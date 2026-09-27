import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useLayout} from '../motion';
import {COLORS} from '../tokens';

/** Contenedor de escena: respeta safe areas y centra el contenido. */
export const Scene: React.FC<{children: React.ReactNode; justify?: React.CSSProperties['justifyContent']; gap?: number}> = ({
  children,
  justify = 'center',
  gap,
}) => {
  const {safe, vertical} = useLayout();
  return (
    <AbsoluteFill
      style={{
        paddingTop: safe.top,
        paddingBottom: safe.bottom,
        paddingLeft: safe.x,
        paddingRight: safe.x,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: justify,
        alignItems: vertical ? 'flex-start' : 'center',
        gap: gap ?? (vertical ? 40 : 32),
        color: COLORS.foreground,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

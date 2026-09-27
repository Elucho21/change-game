import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../tokens';

type Orb = {x: number; y: number; size: number; color: string; drift: number; phase: number};

/** 3 orbes con blur grande. Solo se trasladan: el blur nunca se anima. */
export const AmbientOrbs: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const base = Math.max(width, height);
  const orbs: Orb[] = [
    {x: 0.82, y: 0.14, size: base * 0.5, color: 'hsl(213 100% 53% / 0.20)', drift: 40, phase: 0},
    {x: 0.12, y: 0.86, size: base * 0.5, color: 'hsl(212 100% 78% / 0.20)', drift: 50, phase: 2},
    {x: 0.5, y: 0.5, size: base * 0.42, color: 'hsl(213 100% 53% / 0.10)', drift: 30, phase: 4},
  ];
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.background, overflow: 'hidden'}}>
      {orbs.map((o, i) => {
        const t = frame / 150 + o.phase;
        const dx = Math.sin(t) * o.drift;
        const dy = Math.cos(t * 0.8) * o.drift;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: o.x * width - o.size / 2,
              top: o.y * height - o.size / 2,
              width: o.size,
              height: o.size,
              borderRadius: '50%',
              background: o.color,
              filter: 'blur(120px)',
              transform: `translate(${dx}px, ${dy}px)`,
            }}
          />
        );
      })}
      {/* viñeta suave para dar profundidad */}
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at center, transparent 55%, hsl(220 25% 4% / 0.55) 100%)'}}
      />
    </AbsoluteFill>
  );
};

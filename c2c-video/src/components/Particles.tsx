import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';

const LINK_DISTANCE = 110;
const COLOR = '56,189,248';

const wrap = (v: number, max: number): number => ((v % max) + max) % max;

/** Partículas conectadas, determinísticas (random() con seed). */
export const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const count = Math.round((width * height) / 21000);

  const seeds = useMemo(
    () =>
      Array.from({length: count}, (_, i) => {
        const angle = random(`angle-${i}`) * Math.PI * 2;
        const speed = 0.12 + random(`speed-${i}`) * 0.28;
        return {
          x: random(`x-${i}`) * width,
          y: random(`y-${i}`) * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        };
      }),
    [count, width, height],
  );

  const pts = seeds.map((s) => ({x: wrap(s.x + s.vx * frame, width), y: wrap(s.y + s.vy * frame, height)}));

  const lines: React.ReactNode[] = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x;
      const dy = pts[i].y - pts[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < LINK_DISTANCE) {
        lines.push(
          <line
            key={`${i}-${j}`}
            x1={pts[i].x}
            y1={pts[i].y}
            x2={pts[j].x}
            y2={pts[j].y}
            stroke={`rgba(${COLOR},${((1 - d / LINK_DISTANCE) * 0.4).toFixed(3)})`}
            strokeWidth={0.8}
          />,
        );
      }
    }
  }

  return (
    <AbsoluteFill style={{opacity: 0.55}}>
      <svg width={width} height={height}>
        {lines}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={1.4} fill={`rgba(${COLOR},0.6)`} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

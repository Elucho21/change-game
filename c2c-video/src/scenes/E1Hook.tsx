import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Badge} from '../components/Badge';
import {Rich} from '../components/Rich';
import {hook} from '../content';
import {blurIn, fadeUp, progress, scaleIn, useLayout} from '../motion';
import {COLORS, DURATION, GRADIENT_TEXT} from '../tokens';

export const E1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {type, vertical, safe} = useLayout();
  const hero = vertical ? type.hero * 1.05 : type.hero * 1.2;
  const underline = progress(frame, 44, DURATION.slower);

  return (
    <AbsoluteFill
      style={{
        padding: `${safe.top}px ${safe.x}px ${safe.bottom}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: vertical ? 56 : 44,
        color: COLORS.foreground,
      }}
    >
      <div style={scaleIn(frame, 4)}>
        <Badge fontSize={type.small + 2}>{hook.badge}</Badge>
      </div>

      <div style={{fontSize: hero, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.04}}>
        <div style={blurIn(frame, 12)}>{hook.heroLine1}</div>
        <div style={{...blurIn(frame, 28), position: 'relative', display: 'inline-block', marginTop: 8}}>
          <Rich text={hook.heroLine2} emphasis="gradient" weight={800} />
          <div
            style={{
              position: 'absolute',
              left: '4%',
              right: '4%',
              bottom: -hero * 0.08,
              height: Math.max(6, hero * 0.07),
              borderRadius: 999,
              ...GRADIENT_TEXT,
              backgroundImage: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})`,
              transformOrigin: 'left',
              transform: `scaleX(${underline})`,
              boxShadow: `0 0 24px hsl(213 100% 53% / 0.5)`,
            }}
          />
        </div>
      </div>

      <div style={{...fadeUp(frame, 58), fontSize: type.body, fontWeight: 500, color: COLORS.mutedForeground, letterSpacing: '0.01em'}}>
        {hook.sub}
      </div>
    </AbsoluteFill>
  );
};

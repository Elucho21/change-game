import React from 'react';
import {useCurrentFrame} from 'remotion';
import {fadeUp, progress, useLayout} from '../motion';
import {COLORS, EASE, DURATION, RADIUS} from '../tokens';
import {GlassCard} from './GlassCard';
import {CheckIcon} from './Icons';
import {Rich} from './Rich';

/** Lista con ✓ en primary. Cada ítem entra en `delays[i]`. */
export const Checklist: React.FC<{items: string[]; delays: number[]}> = ({items, delays}) => {
  const frame = useCurrentFrame();
  const {type, vertical} = useLayout();
  const icon = vertical ? 60 : 52;
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: vertical ? 22 : 18, width: '100%'}}>
      {items.map((item, i) => {
        const pop = progress(frame, delays[i] + 4, DURATION.slow, EASE.spring);
        return (
          <GlassCard
            key={i}
            variant="subtle"
            radius={RADIUS.base}
            style={{
              ...fadeUp(frame, delays[i], 24),
              display: 'flex',
              alignItems: 'center',
              gap: vertical ? 28 : 24,
              padding: vertical ? '30px 34px' : '24px 32px',
            }}
          >
            <div style={{transform: `scale(${pop})`, flexShrink: 0, display: 'flex'}}>
              <CheckIcon size={icon} />
            </div>
            <div style={{fontSize: type.body, fontWeight: 400, lineHeight: 1.3, color: COLORS.foreground}}>
              <Rich text={item} />
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};

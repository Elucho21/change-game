import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Eyebrow} from '../components/Badge';
import {GlassCard} from '../components/GlassCard';
import {GiftIcon, LinkIcon} from '../components/Icons';
import {Rich} from '../components/Rich';
import {Scene} from '../components/Scene';
import {queEs} from '../content';
import {blurIn, fadeUp, scaleIn, useLayout} from '../motion';
import {COLORS, RADIUS} from '../tokens';

export const E2QueEs: React.FC = () => {
  const frame = useCurrentFrame();
  const {type, vertical} = useLayout();
  const icons = [LinkIcon, GiftIcon];
  const lineDelays = [80, 150];

  return (
    <Scene gap={vertical ? 56 : 44}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 24, maxWidth: vertical ? undefined : 1640, textAlign: vertical ? 'left' : 'center'}}>
        <div style={fadeUp(frame, 4)}>
          <Eyebrow fontSize={type.small}>{queEs.eyebrow}</Eyebrow>
        </div>
        <div style={{...blurIn(frame, 10), fontSize: vertical ? type.h1 * 0.9 : type.h1 * 0.9, fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.025em'}}>
          <Rich text={queEs.statement} emphasis="gradient" weight={700} />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: vertical ? 'column' : 'row',
          gap: vertical ? 22 : 28,
          width: '100%',
          maxWidth: vertical ? undefined : 1560,
        }}
      >
        {queEs.lines.map((line, i) => {
          const Icon = icons[i % icons.length];
          return (
            <GlassCard
              key={i}
              variant="default"
              radius={RADIUS.lg}
              style={{
                ...scaleIn(frame, lineDelays[i]),
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                padding: vertical ? '34px 36px' : '30px 36px',
              }}
            >
              <div
                style={{
                  width: vertical ? 84 : 76,
                  height: vertical ? 84 : 76,
                  flexShrink: 0,
                  borderRadius: RADIUS.base,
                  background: 'hsl(213 100% 53% / 0.14)',
                  border: '1px solid hsl(213 100% 53% / 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={vertical ? 44 : 40} />
              </div>
              <div style={{fontSize: type.body, lineHeight: 1.32, color: COLORS.foreground}}>
                <Rich text={line} />
              </div>
            </GlassCard>
          );
        })}
      </div>
    </Scene>
  );
};

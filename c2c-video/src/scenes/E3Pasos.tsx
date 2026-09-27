import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Eyebrow} from '../components/Badge';
import {GlassCard} from '../components/GlassCard';
import {Rich} from '../components/Rich';
import {Scene} from '../components/Scene';
import {pasos} from '../content';
import {blurIn, fadeUp, scaleIn, stagger, useLayout} from '../motion';
import {COLORS, GRADIENT_TEXT, RADIUS, STAGGER} from '../tokens';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const E3Pasos: React.FC = () => {
  const frame = useCurrentFrame();
  const {type, vertical} = useLayout();
  // Las cards entran escalonadas; después un foco recorre cada paso para guiar la lectura.
  const enter = (i: number) => stagger(i, STAGGER.loose * 3, 26);
  const focusAt = [60, 150, 245];

  return (
    <Scene gap={vertical ? 52 : 48}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 16, alignItems: vertical ? 'flex-start' : 'center'}}>
        <div style={fadeUp(frame, 4)}>
          <Eyebrow fontSize={type.small}>{pasos.eyebrow}</Eyebrow>
        </div>
        <div style={{...blurIn(frame, 10), fontSize: type.h1, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05}}>
          {pasos.title}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: vertical ? 'column' : 'row',
          gap: vertical ? 26 : 32,
          width: '100%',
        }}
      >
        {pasos.steps.map((step, i) => {
          const focus = interpolate(
            frame,
            [focusAt[i], focusAt[i] + 12, (focusAt[i + 1] ?? 9999) - 4, (focusAt[i + 1] ?? 9999) + 8],
            [0, 1, 1, 0.0],
            CLAMP,
          );
          const reached = frame >= focusAt[i] ? 1 : 0.55;
          return (
            <GlassCard
              key={i}
              variant="default"
              radius={RADIUS.lg}
              style={{
                ...scaleIn(frame, enter(i)),
                flex: 1,
                display: 'flex',
                flexDirection: vertical ? 'row' : 'column',
                alignItems: vertical ? 'center' : 'flex-start',
                gap: vertical ? 34 : 28,
                padding: vertical ? '40px 40px' : '44px 40px',
                minHeight: vertical ? 220 : 380,
              }}
            >
              {/* foco del paso activo (opacity de un borde/halo) */}
              <div
                style={{
                  position: 'absolute',
                  inset: -1,
                  borderRadius: RADIUS.lg,
                  border: `1.5px solid ${COLORS.primary}`,
                  boxShadow: '0 0 48px hsl(213 100% 53% / 0.35)',
                  opacity: focus,
                }}
              />
              <div
                style={{
                  fontSize: vertical ? 120 : 132,
                  fontWeight: 800,
                  lineHeight: 0.9,
                  letterSpacing: '-0.05em',
                  ...GRADIENT_TEXT,
                  opacity: reached,
                  flexShrink: 0,
                  width: vertical ? 96 : undefined,
                }}
              >
                {i + 1}
              </div>
              <div style={{fontSize: type.body, lineHeight: 1.32, color: COLORS.foreground, opacity: 0.6 + 0.4 * reached}}>
                <Rich text={step} />
              </div>
            </GlassCard>
          );
        })}
      </div>
    </Scene>
  );
};

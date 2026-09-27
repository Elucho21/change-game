import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FinePrint} from '../components/FinePrint';
import {Rich} from '../components/Rich';
import {Scene} from '../components/Scene';
import {partner} from '../content';
import {blurIn, fadeUp, progress, scaleIn, stagger, useLayout} from '../motion';
import {COLORS, DURATION, GRADIENT_TEXT, STAGGER} from '../tokens';

export const E7Partner: React.FC = () => {
  const frame = useCurrentFrame();
  const {type, vertical} = useLayout();
  const R = vertical ? 230 : 190;
  const DOT = vertical ? 34 : 28;
  const size = R * 2 + DOT * 2;
  const rotate = frame * 0.15;

  const ring = (
    <div style={{...scaleIn(frame, 2), position: 'relative', width: size, height: size, flexShrink: 0}}>
      {/* halo */}
      <div
        style={{
          position: 'absolute',
          inset: size * 0.18,
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(213 100% 53% / 0.35), transparent 70%)',
          opacity: progress(frame, 50, DURATION.slower),
        }}
      />
      <div style={{position: 'absolute', inset: 0, transform: `rotate(${rotate}deg)`}}>
        {Array.from({length: 10}, (_, i) => {
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
          const lit = progress(frame, stagger(i, STAGGER.loose, 12), DURATION.base);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: size / 2 + Math.cos(a) * R - DOT / 2,
                top: size / 2 + Math.sin(a) * R - DOT / 2,
                width: DOT,
                height: DOT,
                borderRadius: '50%',
                background: COLORS.primary,
                boxShadow: `0 0 ${DOT}px hsl(213 100% 53% / 0.8)`,
                opacity: 0.2 + 0.8 * lit,
                transform: `scale(${0.6 + 0.4 * lit})`,
              }}
            />
          );
        })}
      </div>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6}}>
        <div style={{...fadeUp(frame, 40), fontSize: type.small, fontWeight: 600, letterSpacing: '0.16em', color: COLORS.mutedForeground}}>
          {partner.ringLabel}
        </div>
        <div style={{...blurIn(frame, 50), fontSize: vertical ? 96 : 80, fontWeight: 800, letterSpacing: '-0.035em', ...GRADIENT_TEXT}}>
          {partner.badge}
        </div>
      </div>
    </div>
  );

  return (
    <Scene gap={vertical ? 56 : 40} justify="center">
      <div
        style={{
          display: 'flex',
          flexDirection: vertical ? 'column' : 'row',
          alignItems: 'center',
          gap: vertical ? 56 : 80,
          width: '100%',
        }}
      >
        <div style={{alignSelf: 'center'}}>{ring}</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: vertical ? 40 : 32, flex: 1}}>
          <div style={{...blurIn(frame, 70), fontSize: vertical ? type.h1 * 0.78 : type.h1 * 0.78, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.025em'}}>
            <Rich text={partner.statement} emphasis="gradient" weight={800} />
          </div>
          <FinePrint lines={partner.finePrint} delay={120} />
        </div>
      </div>
    </Scene>
  );
};

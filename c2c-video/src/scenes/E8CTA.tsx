import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {Button} from '../components/Button';
import {GlassCard} from '../components/GlassCard';
import {LinkIcon} from '../components/Icons';
import {Rich} from '../components/Rich';
import {WORDMARK, cta} from '../content';
import {blurIn, fadeUp, progress, scaleIn, useLayout} from '../motion';
import {COLORS, DURATION, EASE, RADIUS} from '../tokens';

export const E8CTA: React.FC<{hasLogo: boolean}> = ({hasLogo}) => {
  const frame = useCurrentFrame();
  const {type, vertical, safe} = useLayout();

  // halo que pulsa suave: se animan opacity y scale, nunca el blur
  const pulse = (Math.sin((frame / 30) * Math.PI * 0.9) + 1) / 2;
  const haloIn = progress(frame, 6, DURATION.slower);
  const press = progress(frame, 150, DURATION.fast, EASE.inOut) - progress(frame, 156, DURATION.base, EASE.spring);

  const cardW = vertical ? 936 : 1180;

  return (
    <AbsoluteFill
      style={{
        padding: `${safe.top}px ${safe.x}px ${safe.bottom}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.foreground,
      }}
    >
      <div style={{position: 'relative', width: cardW}}>
        <div
          style={{
            position: 'absolute',
            inset: '-12%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, hsl(213 100% 53% / 0.42), transparent 65%)',
            filter: 'blur(40px)',
            opacity: haloIn * (0.55 + 0.45 * pulse),
            transform: `scale(${0.95 + 0.06 * pulse})`,
          }}
        />
        <GlassCard
          variant="strong"
          radius={RADIUS.lg + 8}
          style={{
            ...scaleIn(frame, 4, DURATION.slower),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: vertical ? 44 : 34,
            padding: vertical ? '84px 64px' : '64px 80px',
          }}
        >
          <div style={fadeUp(frame, 12)}>
            {hasLogo ? (
              <Img src={staticFile('logo.png')} style={{height: vertical ? 72 : 60, objectFit: 'contain'}} />
            ) : (
              <div style={{fontSize: vertical ? 34 : 30, fontWeight: 800, letterSpacing: '0.32em', color: COLORS.foreground, paddingLeft: '0.32em'}}>
                {WORDMARK}
              </div>
            )}
          </div>

          <div style={{...blurIn(frame, 22), fontSize: type.hero, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.02}}>
            <Rich text={cta.hero} emphasis="gradient" weight={800} />
          </div>

          <div style={{...fadeUp(frame, 44), fontSize: type.body, lineHeight: 1.35, color: COLORS.mutedForeground, maxWidth: vertical ? 780 : 900}}>
            <Rich text={cta.sub} emphasis="accent" weight={600} />
          </div>

          <div style={{...scaleIn(frame, 66), display: 'flex'}}>
            <div style={{transform: `scale(${1 - 0.04 * press})`}}>
              <Button fontSize={vertical ? 40 : 34}>{cta.button}</Button>
            </div>
          </div>

          <div
            style={{
              ...fadeUp(frame, 84),
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: type.body,
              fontWeight: 500,
              color: COLORS.accent,
              letterSpacing: '0.01em',
            }}
          >
            <LinkIcon size={type.body} />
            {cta.url}
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Eyebrow} from '../components/Badge';
import {FinePrint} from '../components/FinePrint';
import {Ladder, ladderLitFrames} from '../components/Ladder';
import {Rich} from '../components/Rich';
import {escalera} from '../content';
import {blurIn, fadeUp, useLayout} from '../motion';
import {COLORS, EASE} from '../tokens';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Frame (relativo a la escena) en que aparece la letra chica. */
export const escaleraFinePrintAt = (): number => {
  const lit = ladderLitFrames(escalera.milestones, escalera.timing);
  return lit[lit.length - 1] + escalera.timing.prizeGap * 0.5 + escalera.timing.finePrintDelay;
};

export const E5Escalera: React.FC = () => {
  const frame = useCurrentFrame();
  const {type, vertical, safe} = useLayout();
  const litAt = ladderLitFrames(escalera.milestones, escalera.timing);
  const fineAt = escaleraFinePrintAt();

  // En vertical la escalera se achica (solo transform) para dejar lugar a la letra chica.
  const shrink = interpolate(frame, [fineAt - 14, fineAt + 10], [0, 1], {...CLAMP, easing: EASE.inOut});
  const ladderScale = vertical ? 1 - 0.22 * shrink : 1;
  const ladderDim = vertical ? 1 - 0.35 * shrink : 1;

  return (
    <AbsoluteFill
      style={{
        padding: `${safe.top}px ${safe.x}px ${safe.bottom}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: vertical ? 36 : 30,
        color: COLORS.foreground,
      }}
    >
      <div style={{display: 'flex', flexDirection: 'column', gap: 12, alignItems: vertical ? 'flex-start' : 'center'}}>
        <div style={fadeUp(frame, 4)}>
          <Eyebrow fontSize={type.small}>{escalera.eyebrow}</Eyebrow>
        </div>
        <div style={{...blurIn(frame, 10), fontSize: type.h2, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.12}}>
          <Rich text={escalera.title} emphasis="gradient" weight={700} />
        </div>
      </div>

      <div
        style={{
          ...fadeUp(frame, 16, 24),
          width: '100%',
        }}
      >
        <div
          style={{
            transformOrigin: 'top center',
            transform: `scale(${ladderScale})`,
            opacity: ladderDim,
          }}
        >
          <Ladder milestones={escalera.milestones} litAt={litAt} fillerLabel={escalera.fillerLabel} />
        </div>
      </div>

      <FinePrint
        lines={escalera.finePrint}
        delay={fineAt}
        style={{
          position: 'absolute',
          left: safe.x,
          right: safe.x,
          bottom: safe.bottom,
          textAlign: vertical ? 'left' : 'center',
          ...(vertical
            ? {
                padding: '28px 0 0',
                borderTop: `1px solid ${COLORS.border}`,
              }
            : {}),
        }}
      />
    </AbsoluteFill>
  );
};

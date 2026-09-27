import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Counter, type CounterStep} from '../components/Counter';
import {GlassCard} from '../components/GlassCard';
import {CheckIcon, CrossIcon} from '../components/Icons';
import {Rich} from '../components/Rich';
import {Scene} from '../components/Scene';
import {ritmo} from '../content';
import {blurIn, fadeUp, progress, scaleIn, useLayout} from '../motion';
import {COLORS, DURATION, EASE, RADIUS} from '../tokens';

export const E6Ritmo: React.FC = () => {
  const frame = useCurrentFrame();
  const {type, vertical} = useLayout();

  const WIDGET_AT = 60;
  const MONTH_AT = [80, 110, 140, 175];
  const RESET_AT = MONTH_AT[3] + 16;
  const RESET_TEXT_AT = RESET_AT + 20;
  const KEEP_AT = RESET_TEXT_AT + 48;

  // contador: acumula ventas por mes y cae a 0 cuando un mes cierra en cero
  const steps: CounterStep[] = [{at: 0, value: 0}];
  let total = 0;
  ritmo.months.forEach((m, i) => {
    if (m.sales > 0) {
      total += m.sales;
      steps.push({at: MONTH_AT[i] + 6, value: total});
    }
  });
  steps.push({at: RESET_AT, value: 0, color: COLORS.destructive});

  const counterSize = vertical ? 200 : 170;

  return (
    <Scene gap={vertical ? 44 : 34}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 18, alignItems: vertical ? 'flex-start' : 'center', textAlign: vertical ? 'left' : 'center'}}>
        <div style={{...blurIn(frame, 6), fontSize: type.h1, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05}}>
          {ritmo.title}
        </div>
        <div style={{...fadeUp(frame, 24), fontSize: type.body, lineHeight: 1.32, color: COLORS.foreground}}>
          <Rich text={ritmo.rule} />
        </div>
      </div>

      <GlassCard
        variant="default"
        radius={RADIUS.lg}
        style={{
          ...scaleIn(frame, WIDGET_AT),
          width: '100%',
          maxWidth: vertical ? undefined : 1300,
          display: 'flex',
          flexDirection: vertical ? 'column' : 'row',
          alignItems: 'center',
          gap: vertical ? 28 : 48,
          padding: vertical ? '36px 36px' : '36px 48px',
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0}}>
          <div style={{fontSize: type.small, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.mutedForeground}}>
            {ritmo.counterLabel}
          </div>
          <Counter steps={steps} fontSize={counterSize} shakeAt={RESET_AT} />
        </div>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, flex: 1, width: '100%'}}>
          {ritmo.months.map((m, i) => {
            const zero = m.sales === 0;
            const pop = progress(frame, MONTH_AT[i] + 4, DURATION.slow, EASE.spring);
            return (
              <div
                key={m.label}
                style={{
                  ...fadeUp(frame, MONTH_AT[i], 24),
                  borderRadius: RADIUS.base,
                  border: `1.5px solid ${zero ? 'hsl(0 84% 60% / 0.55)' : 'hsl(220 30% 25% / 0.5)'}`,
                  background: zero ? 'hsl(0 84% 60% / 0.10)' : 'hsl(220 30% 16% / 0.5)',
                  padding: vertical ? '22px 8px' : '22px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{fontSize: type.small, fontWeight: 600, color: COLORS.foreground}}>{m.label}</div>
                <div style={{transform: `scale(${pop})`, display: 'flex'}}>
                  {zero ? <CrossIcon size={vertical ? 52 : 46} /> : <CheckIcon size={vertical ? 52 : 46} />}
                </div>
                <div style={{fontSize: type.small * 0.95, color: zero ? COLORS.destructive : COLORS.mutedForeground, fontWeight: zero ? 600 : 400}}>
                  {ritmo.salesLabel(m.sales)}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <div style={{display: 'flex', flexDirection: 'column', gap: 22, width: '100%', alignItems: vertical ? 'flex-start' : 'center', textAlign: vertical ? 'left' : 'center'}}>
        <div style={{...fadeUp(frame, RESET_TEXT_AT), fontSize: type.body, lineHeight: 1.3, color: COLORS.foreground}}>
          {ritmo.reset}
        </div>
        <div style={{...fadeUp(frame, KEEP_AT), display: 'flex', alignItems: 'center', gap: 18, fontSize: type.body * 1.05, fontWeight: 500, lineHeight: 1.3}}>
          <CheckIcon size={type.body * 1.4} />
          <span>
            <Rich text={ritmo.keep} weight={700} />
          </span>
        </div>
      </div>
    </Scene>
  );
};

import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import type {Milestone} from '../content';
import {progress, scaleIn, useLayout} from '../motion';
import {COLORS, DURATION, EASE, RADIUS} from '../tokens';
import {GlassCard} from './GlassCard';
import {ArrowUpIcon} from './Icons';
import {Rich} from './Rich';

type Timing = {start: number; prizeGap: number; fillerGap: number};

/** Frame en que se ilumina cada hito. Los premios reciben más tiempo de lectura. */
export const ladderLitFrames = (milestones: Milestone[], t: Timing): number[] => {
  const out: number[] = [];
  let cursor = t.start;
  milestones.forEach((m) => {
    out.push(cursor);
    cursor += m.prize ? t.prizeGap : t.fillerGap;
  });
  return out;
};

type Props = {milestones: Milestone[]; litAt: number[]; fillerLabel: string};

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Nodo circular "H1"… con capa iluminada (solo opacity). */
const Node: React.FC<{id: string; size: number; lit: number; flash: number}> = ({id, size, lit, flash}) => (
  <div style={{position: 'relative', width: size, height: size, flexShrink: 0}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: RADIUS.pill,
        background: COLORS.card,
        border: `2px solid ${COLORS.border}`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: RADIUS.pill,
        background: `linear-gradient(135deg, ${COLORS.primary}, hsl(213 100% 62%))`,
        boxShadow: `0 0 ${size * 0.5}px hsl(213 100% 53% / 0.55)`,
        opacity: lit,
        transform: `scale(${0.85 + 0.15 * lit + flash * 0.08})`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 700,
        color: lit > 0.5 ? COLORS.primaryForeground : COLORS.mutedForeground,
      }}
    >
      {id}
    </div>
  </div>
);

/** Contenido de un escalón (premio en glass, o "Seguís subiendo" tenue). */
const StepCard: React.FC<{
  m: Milestone;
  litFrame: number;
  fillerLabel: string;
  height: number;
  titleSize: number;
  detailSize: number;
  padding: string;
  style?: React.CSSProperties;
}> = ({m, litFrame, fillerLabel, height, titleSize, detailSize, padding, style}) => {
  const frame = useCurrentFrame();
  const lit = progress(frame, litFrame, DURATION.slow);
  const flash = interpolate(frame, [litFrame, litFrame + 8, litFrame + 40], [0, 1, 0], CLAMP);

  // Placeholder tenue antes de iluminarse
  const placeholder = (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: RADIUS.base,
        border: `1.5px dashed hsl(220 30% 30% / 0.55)`,
        opacity: 1 - lit,
      }}
    />
  );

  if (!m.prize) {
    return (
      <div style={{position: 'relative', height, ...style}}>
        {placeholder}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: RADIUS.base,
            border: `1.5px dashed hsl(213 100% 70% / 0.35)`,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding,
            opacity: lit * 0.75,
            color: COLORS.mutedForeground,
            fontSize: detailSize,
            fontWeight: 400,
          }}
        >
          <ArrowUpIcon size={detailSize * 1.1} />
          {fillerLabel}
        </div>
      </div>
    );
  }

  return (
    <div style={{position: 'relative', height, ...style}}>
      {placeholder}
      <GlassCard
        variant="subtle"
        radius={RADIUS.base}
        style={{
          ...scaleIn(frame, litFrame),
          transformOrigin: 'left center',
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 4,
          padding,
        }}
      >
        {/* glow del escalón recién iluminado */}
        <div
          style={{
            position: 'absolute',
            inset: -1,
            borderRadius: RADIUS.base,
            border: `1.5px solid ${COLORS.primary}`,
            boxShadow: `0 0 36px hsl(213 100% 53% / 0.45)`,
            opacity: flash,
          }}
        />
        <div style={{fontSize: titleSize, fontWeight: 500, lineHeight: 1.2, color: COLORS.foreground}}>
          <Rich text={m.title} emphasis="gradient" weight={700} />
        </div>
        {m.detail ? (
          <div style={{fontSize: detailSize, fontWeight: 400, lineHeight: 1.25, color: COLORS.mutedForeground}}>
            <Rich text={m.detail} emphasis="accent" weight={600} />
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
};

// ── 9:16 · escalera vertical (H1 abajo, H10 arriba) ────────────────
const VerticalLadder: React.FC<Props> = ({milestones, litAt, fillerLabel}) => {
  const frame = useCurrentFrame();
  const NODE = 72;
  const PRIZE_H = 128;
  const FILLER_H = 74;
  const GAP = 12;
  const STEP_X = 12;

  const heights = milestones.map((m) => (m.prize ? PRIZE_H : FILLER_H));
  // centro de cada fila medido desde abajo
  const centers: number[] = [];
  let acc = 0;
  heights.forEach((h, i) => {
    centers.push(acc + h / 2);
    acc += h + (i < heights.length - 1 ? GAP : 0);
  });
  const total = acc;
  const railStart = centers[0];
  const railEnd = centers[centers.length - 1];
  const railLen = railEnd - railStart;
  const fill = interpolate(
    frame,
    litAt,
    centers.map((c) => (c - railStart) / railLen),
    {...CLAMP, easing: EASE.inOut},
  );

  return (
    <div style={{position: 'relative', width: '100%', height: total}}>
      {/* riel */}
      <div
        style={{
          position: 'absolute',
          left: NODE / 2 - 2,
          bottom: railStart,
          height: railLen,
          width: 4,
          borderRadius: 4,
          background: COLORS.border,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: NODE / 2 - 2,
          bottom: railStart,
          height: railLen,
          width: 4,
          borderRadius: 4,
          background: `linear-gradient(0deg, ${COLORS.primary}, ${COLORS.accent})`,
          transformOrigin: 'bottom',
          transform: `scaleY(${fill})`,
          boxShadow: `0 0 16px hsl(213 100% 53% / 0.6)`,
        }}
      />
      {milestones.map((m, i) => {
        const lit = progress(frame, litAt[i], DURATION.base);
        const flash = interpolate(frame, [litAt[i], litAt[i] + 6, litAt[i] + 24], [0, 1, 0], CLAMP);
        const bottom = centers[i] - heights[i] / 2;
        return (
          <div
            key={m.id}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom,
              height: heights[i],
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Node id={m.id} size={m.prize ? NODE : NODE * 0.78} lit={lit} flash={flash} />
            <StepCard
              m={m}
              litFrame={litAt[i]}
              fillerLabel={fillerLabel}
              height={heights[i] - 6}
              titleSize={36}
              detailSize={32}
              padding="0 30px"
              style={{
                flex: 1,
                marginLeft: (m.prize ? 22 : 22 + NODE * 0.22) + i * STEP_X,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// ── 16:9 · timeline 2 filas × 5 ─────────────────────────────────────
const HorizontalLadder: React.FC<Props> = ({milestones, litAt, fillerLabel}) => {
  const frame = useCurrentFrame();
  const NODE = 60;
  const CARD_H = 190;
  const COLS = 5;
  const rows = [milestones.slice(0, COLS), milestones.slice(COLS)];

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 36, width: '100%'}}>
      {rows.map((row, r) => {
        const idx0 = r * COLS;
        const frames = litAt.slice(idx0, idx0 + COLS);
        const fill = interpolate(frame, frames, [0, 0.25, 0.5, 0.75, 1], {...CLAMP, easing: EASE.inOut});
        const colPct = 100 / COLS;
        return (
          <div key={r} style={{position: 'relative'}}>
            {/* riel de la fila, de centro a centro del primer y último nodo */}
            <div
              style={{
                position: 'absolute',
                top: NODE / 2 - 2,
                left: `${colPct / 2}%`,
                width: `${100 - colPct}%`,
                height: 4,
                borderRadius: 4,
                background: COLORS.border,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: NODE / 2 - 2,
                left: `${colPct / 2}%`,
                width: `${100 - colPct}%`,
                height: 4,
                borderRadius: 4,
                background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})`,
                transformOrigin: 'left',
                transform: `scaleX(${fill})`,
                boxShadow: `0 0 16px hsl(213 100% 53% / 0.6)`,
              }}
            />
            <div style={{display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 24}}>
              {row.map((m, c) => {
                const i = idx0 + c;
                const lit = progress(frame, litAt[i], DURATION.base);
                const flash = interpolate(frame, [litAt[i], litAt[i] + 6, litAt[i] + 24], [0, 1, 0], CLAMP);
                return (
                  <div key={m.id} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
                    <Node id={m.id} size={NODE} lit={lit} flash={flash} />
                    <StepCard
                      m={m}
                      litFrame={litAt[i]}
                      fillerLabel={fillerLabel}
                      height={CARD_H}
                      titleSize={29}
                      detailSize={25}
                      padding="0 24px"
                      style={{width: '100%', opacity: m.prize ? 1 : 0.85}}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const Ladder: React.FC<Props> = (props) => {
  const {vertical} = useLayout();
  return vertical ? <VerticalLadder {...props} /> : <HorizontalLadder {...props} />;
};

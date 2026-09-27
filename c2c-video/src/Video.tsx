import React from 'react';
import {AbsoluteFill, Html5Audio, interpolate, staticFile, useVideoConfig} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {AmbientOrbs} from './components/AmbientOrbs';
import {Particles} from './components/Particles';
import {SCENE_DURATIONS} from './content';
import {fontFamily} from './fonts';
import {E1Hook} from './scenes/E1Hook';
import {E2QueEs} from './scenes/E2QueEs';
import {E3Pasos} from './scenes/E3Pasos';
import {E4CompraValida} from './scenes/E4CompraValida';
import {E5Escalera} from './scenes/E5Escalera';
import {E6Ritmo} from './scenes/E6Ritmo';
import {E7Partner} from './scenes/E7Partner';
import {E8CTA} from './scenes/E8CTA';
import {fadeSlide} from './transitions';
import {COLORS, EASE, FPS, TRANSITION_FRAMES} from './tokens';

export type VideoProps = {hasMusic: boolean; hasLogo: boolean};

const SCENE_ORDER = ['hook', 'queEs', 'pasos', 'compraValida', 'escalera', 'ritmo', 'partner', 'cta'] as const;

/** Duración total = suma de escenas − solapamiento de transiciones. */
export const totalDuration = (): number =>
  SCENE_ORDER.reduce((acc, k) => acc + SCENE_DURATIONS[k], 0) - TRANSITION_FRAMES * (SCENE_ORDER.length - 1);

const MUSIC_VOLUME = 0.35;
const MUSIC_FADE = FPS; // 1s

export const C2CVideo: React.FC<VideoProps> = ({hasMusic, hasLogo}) => {
  const {durationInFrames} = useVideoConfig();

  const scenes: Record<(typeof SCENE_ORDER)[number], React.ReactNode> = {
    hook: <E1Hook />,
    queEs: <E2QueEs />,
    pasos: <E3Pasos />,
    compraValida: <E4CompraValida />,
    escalera: <E5Escalera />,
    ritmo: <E6Ritmo />,
    partner: <E7Partner />,
    cta: <E8CTA hasLogo={hasLogo} />,
  };

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.background, fontFamily, color: COLORS.foreground}}>
      {/* Fondo ambiental persistente */}
      <AmbientOrbs />
      <Particles />

      <TransitionSeries>
        {SCENE_ORDER.flatMap((key, i) => {
          const seq = (
            <TransitionSeries.Sequence key={key} durationInFrames={SCENE_DURATIONS[key]} name={key}>
              {scenes[key]}
            </TransitionSeries.Sequence>
          );
          if (i === 0) return [seq];
          return [
            <TransitionSeries.Transition
              key={`t-${key}`}
              presentation={fadeSlide()}
              timing={linearTiming({durationInFrames: TRANSITION_FRAMES, easing: EASE.inOut})}
            />,
            seq,
          ];
        })}
      </TransitionSeries>

      {hasMusic ? (
        <Html5Audio
          src={staticFile('music.mp3')}
          volume={(f) =>
            interpolate(
              f,
              [0, MUSIC_FADE, durationInFrames - MUSIC_FADE, durationInFrames],
              [0, MUSIC_VOLUME, MUSIC_VOLUME, 0],
              {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
            )
          }
        />
      ) : null}
    </AbsoluteFill>
  );
};

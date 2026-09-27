import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {DISTANCE} from './tokens';

type Empty = Record<string, never>;

/** Fade + slide corto (48px) entre escenas. Solo opacity y transform. */
const FadeSlide: React.FC<TransitionPresentationComponentProps<Empty>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  const entering = presentationDirection === 'entering';
  const opacity = entering ? p : 1 - p;
  const y = entering ? (1 - p) * DISTANCE.lg : -p * DISTANCE.md;
  return <AbsoluteFill style={{opacity, transform: `translateY(${y}px)`}}>{children}</AbsoluteFill>;
};

export const fadeSlide = (): TransitionPresentation<Empty> => ({component: FadeSlide, props: {}});

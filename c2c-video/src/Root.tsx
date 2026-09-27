import React from 'react';
import {Composition, staticFile, type CalculateMetadataFunction} from 'remotion';
import {C2CVideo, totalDuration, type VideoProps} from './Video';
import {FPS} from './tokens';

/** true si el archivo existe en /public (así el video renderiza igual sin música ni logo). */
const exists = async (file: string): Promise<boolean> => {
  try {
    const res = await fetch(staticFile(file), {method: 'HEAD'});
    return res.ok;
  } catch {
    return false;
  }
};

const calculateMetadata: CalculateMetadataFunction<VideoProps> = async ({props}) => {
  const [hasMusic, hasLogo] = await Promise.all([exists('music.mp3'), exists('logo.png')]);
  return {props: {...props, hasMusic, hasLogo}, durationInFrames: totalDuration()};
};

const defaultProps: VideoProps = {hasMusic: false, hasLogo: false};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="C2C-Vertical"
      component={C2CVideo}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={totalDuration()}
      defaultProps={defaultProps}
      calculateMetadata={calculateMetadata}
    />
    <Composition
      id="C2C-Horizontal"
      component={C2CVideo}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={totalDuration()}
      defaultProps={defaultProps}
      calculateMetadata={calculateMetadata}
    />
  </>
);

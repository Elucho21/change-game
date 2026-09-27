import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Eyebrow} from '../components/Badge';
import {Checklist} from '../components/Checklist';
import {FinePrint} from '../components/FinePrint';
import {Scene} from '../components/Scene';
import {compraValida} from '../content';
import {blurIn, fadeUp, useLayout} from '../motion';

export const E4CompraValida: React.FC = () => {
  const frame = useCurrentFrame();
  const {type, vertical} = useLayout();

  return (
    <Scene gap={vertical ? 48 : 40}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 16, alignItems: vertical ? 'flex-start' : 'center'}}>
        <div style={fadeUp(frame, 4)}>
          <Eyebrow fontSize={type.small}>{compraValida.eyebrow}</Eyebrow>
        </div>
        <div style={{...blurIn(frame, 10), fontSize: type.h1 * 0.9, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08}}>
          {compraValida.title}
        </div>
      </div>

      <div style={{width: '100%', maxWidth: vertical ? undefined : 1240}}>
        <Checklist items={compraValida.items} delays={[30, 70, 110]} />
      </div>

      <FinePrint
        lines={compraValida.finePrint}
        delay={160}
        style={{maxWidth: vertical ? undefined : 1240, textAlign: vertical ? 'left' : 'center'}}
      />
    </Scene>
  );
};

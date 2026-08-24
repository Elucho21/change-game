'use client';

import { useGame } from '@/lib/store';
import { CORRUPTION_LEVELS, INVESTIGACION_LEVELS, levelOf, comisionIntegrityEffective, minorityVoteShare } from '@/lib/moral';
import { coalitionSeats } from '@/lib/cabinet';
import Collapsible from './Collapsible';

const toneFor = (v: number) => (v > 65 ? 'bad' : v > 35 ? 'warn' : 'good');

/**
 * Panel de Justicia (Change World Game v1.1): Corrupcion, Progreso de
 * Investigaciones, Corte/Comision, favores activos y los 3 lideres
 * minoritarios. Solo lectura — las cartas de Enrique y de los lideres se
 * juegan en Decisiones/Eventos o en el modal de Enrique.
 */
export default function JusticiaPanel() {
  const moral = useGame((s) => s.moral);
  const politics = useGame((s) => s.politics);
  const cabinet = useGame((s) => s.cabinet);

  const corrLevel = levelOf(moral.corruption, CORRUPTION_LEVELS);
  const invLevel = levelOf(moral.investigacion, INVESTIGACION_LEVELS);
  const comision = comisionIntegrityEffective(politics, coalitionSeats(cabinet));
  const fuga = minorityVoteShare(moral);

  return (
    <div>
      <Collapsible title="Corrupcion">
        <div className="row">
          <span>Nivel</span>
          <b className={toneFor(moral.corruption)}>{moral.corruption} — {corrLevel.label}</b>
        </div>
        <div className="bar">
          <div style={{
            width: `${moral.corruption}%`,
            background: toneFor(moral.corruption) === 'bad' ? 'var(--bad)' : toneFor(moral.corruption) === 'warn' ? 'var(--warn)' : 'var(--good)'
          }}
          />
        </div>
        <p className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>{corrLevel.detail}</p>
      </Collapsible>

      <Collapsible title="Progreso de investigaciones">
        <div className="row">
          <span>Nivel</span>
          <b className={toneFor(moral.investigacion)}>{moral.investigacion} — {invLevel.label}</b>
        </div>
        <div className="bar">
          <div style={{
            width: `${moral.investigacion}%`,
            background: toneFor(moral.investigacion) === 'bad' ? 'var(--bad)' : toneFor(moral.investigacion) === 'warn' ? 'var(--warn)' : 'var(--good)'
          }}
          />
        </div>
        <p className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>{invLevel.detail}</p>

        <div className="card" style={{ marginTop: 10 }}>
          <h4 style={{ fontSize: 12 }}>Lo que empuja o frena</h4>
          <div className="row"><span>Integridad Suprema Corte</span><b>{moral.corteIntegrity}</b></div>
          <div className="row"><span>Integridad Comision</span><b>{Math.round(comision)}</b></div>
          <div className="row"><span>Favores activos</span><b className={moral.favoresActivos > 0 ? 'warn' : 'muted'}>{moral.favoresActivos}</b></div>
        </div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>
          Mas mayoria parlamentaria y menos escandalo la frenan; corrupcion alta, pueblo infeliz y Corte
          independiente la aceleran. Las cartas de Enrique son la unica forma de bajarla de golpe.
        </p>
      </Collapsible>

      {/*
        El detalle de los 3 lideres se mudo a components/GovernmentPanel.tsx en
        v1.4 (esta pestaña no existe hasta el mes 4 y el jugador no los veia).
        Aca queda solo el gancho con lo que SI es de esta pestaña: la corrupcion
        que alimenta a dos de los tres.
      */}
      <Collapsible title="Lideres minoritarios" defaultOpen={false}>
        <div className="row">
          <span>Voto fugado a minoritarios</span>
          <b className={fuga > 12 ? 'bad' : fuga > 6 ? 'warn' : 'good'}>-{fuga.toFixed(1)} pts</b>
        </div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>
          El detalle de los tres esta en 🏛️ Gobierno. Desde aca los alimentas sin querer: la
          corrupcion a la vista empuja a Amalia y a Jhon, y el indice de inseguridad es el
          combustible de Jhon.
        </p>
      </Collapsible>

      <Collapsible title="Indices" defaultOpen={false}>
        <div className="row"><span>Indice ambiental</span><b>{Math.round(moral.environmentIndex)}</b></div>
        <div className="row"><span>Indice de inseguridad</span><b>{Math.round(moral.securityIndex)}</b></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>
          0-100. Derivan lento hacia 50 solos; se mueven fuerte con decisiones y eventos puntuales.
        </p>
      </Collapsible>
    </div>
  );
}

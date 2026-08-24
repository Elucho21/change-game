'use client';

import { useGame } from '@/lib/store';
import { CORRUPTION_LEVELS, INVESTIGACION_LEVELS, levelOf, MINORITY_CAPS, comisionIntegrityEffective } from '@/lib/moral';
import { coalitionSeats } from '@/lib/cabinet';
import Collapsible from './Collapsible';

const pct = (v: number) => `${Math.round(v * 10) / 10}%`;
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

      <Collapsible title="Lideres minoritarios">
        <div className="row"><span>🚩 Gustavo Comun</span><b>{pct(moral.gustavoApoyo)} / {MINORITY_CAPS.gustavo}%</b></div>
        <div className="bar"><div style={{ width: `${(moral.gustavoApoyo / MINORITY_CAPS.gustavo) * 100}%`, background: '#e5484d' }} /></div>

        <div className="row" style={{ marginTop: 8 }}><span>🌿 Amalia Verde</span><b>{pct(moral.amaliaApoyo)} / {MINORITY_CAPS.amalia}%</b></div>
        <div className="bar"><div style={{ width: `${(moral.amaliaApoyo / MINORITY_CAPS.amalia) * 100}%`, background: '#37c98a' }} /></div>

        <div className="row" style={{ marginTop: 8 }}><span>🎖️ Jhon el Duro</span><b>{pct(moral.jhonApoyo)} / {MINORITY_CAPS.jhon}%</b></div>
        <div className="bar"><div style={{ width: `${(moral.jhonApoyo / MINORITY_CAPS.jhon) * 100}%`, background: '#4f7cff' }} /></div>

        <p className="muted" style={{ fontSize: 11, marginTop: 8, lineHeight: 1.4 }}>
          Nunca superan su techo. Gustavo crece con desempleo y descontento; Amalia con el indice ambiental
          hundido; Jhon con la inseguridad en alza. Sus cartas aparecen como eventos nacionales normales.
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

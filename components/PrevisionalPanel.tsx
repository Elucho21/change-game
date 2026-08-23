'use client';

import { useGame } from '@/lib/store';
import Collapsible from './Collapsible';

const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;

/**
 * Panel previsional (Change World Game v1.0): estado del sistema de
 * jubilaciones, empleo/salarios y el semaforo de gasto rigido. Es solo
 * lectura — las reformas se toman como Decision normal en la pestana
 * Decisiones, categoria "Previsional" (lib/decisions.ts).
 */
export default function PrevisionalPanel() {
  const { countries, playerCode, pension, employment } = useGame();
  const country = countries[playerCode];

  const militaryPctGdp = (country.military.military_budget_bn / (country.economy.gdp_trillion_usd * 1000)) * 100;
  const pensionDeficitPctGdp = Math.max(0, -pension.resultApplied);
  const rigidTotal = Math.round((militaryPctGdp + pensionDeficitPctGdp) * 100) / 100;
  const rigidTone = rigidTotal > 18 ? 'bad' : rigidTotal > 15 ? 'warn' : 'good';
  const rigidLabel = rigidTotal > 18 ? 'Alerta' : rigidTotal > 15 ? 'Observar' : 'OK';

  return (
    <div>
      <Collapsible title="Sistema previsional">
        <div className="row">
          <span>Resultado previsional</span>
          <b className={pension.resultApplied >= 0 ? 'good' : 'bad'}>
            {pension.resultApplied >= 0 ? '+' : ''}{pension.resultApplied}% del PBI
          </b>
        </div>
        <p className="muted" style={{ fontSize: 11.5, margin: '2px 0 10px' }}>
          {pension.resultApplied >= 0
            ? 'El sistema se autofinancia: no le pide caja al resto del presupuesto.'
            : 'El sistema no se autofinancia: el Estado tiene que aportar la diferencia, y eso presiona el deficit fiscal.'}
        </p>

        <div className="card">
          <h4 style={{ fontSize: 12 }}>Parametros actuales</h4>
          <div className="row"><span>Edad de jubilacion</span><b>{pension.retirementAgeMen} hombres · {pension.retirementAgeWomen} mujeres</b></div>
          <div className="row"><span>Aporte trabajador</span><b>{pct(pension.contribWorker)}</b></div>
          <div className="row"><span>Aporte empleador</span><b>{pct(pension.contribEmployer)}</b></div>
          <div className="row"><span>Tasa de reemplazo</span><b>{pct(pension.replacementRate)}</b></div>
          <div className="row"><span>Cobertura del sistema</span><b>{pct(pension.coverage)}</b></div>
          <div className="row"><span>Evasion / morosidad</span><b>{pct(pension.evasion)}</b></div>
          <div className="row"><span>Ratio de dependencia</span><b>{pct(pension.dependencyRatio)} jubilados/activos</b></div>
        </div>

        <p className="muted" style={{ fontSize: 11, marginTop: 8, lineHeight: 1.4 }}>
          Las reformas se toman en la pestana Decisiones, categoria Previsional. El coste de Capital Politico
          baja si hay crisis fiscal visible, superavit con inflacion baja, o Capital Politico alto.
        </p>
      </Collapsible>

      <Collapsible title="Empleo y salarios">
        <div className="row"><span>Empleo formal</span><b className="good">{pct(employment.formalPct / 100)}</b></div>
        <div className="bar"><div style={{ width: `${employment.formalPct}%`, background: 'var(--good)' }} /></div>

        <div className="row" style={{ marginTop: 8 }}><span>Empleo informal</span><b className="warn">{pct(employment.informalPct / 100)}</b></div>
        <div className="bar"><div style={{ width: `${employment.informalPct}%`, background: 'var(--warn)' }} /></div>

        <div className="row" style={{ marginTop: 10 }}>
          <span>Indice de salario real</span>
          <b className={employment.realWageIndex >= 100 ? 'good' : 'bad'}>{Math.round(employment.realWageIndex * 10) / 10}</b>
        </div>
        <p className="muted" style={{ fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>
          100 = arranque de la partida. Sube con el crecimiento y la deflacion (si los sueldos nominales
          se mantienen); baja fuerte cuando subis aportes o cuando la inflacion no se indexa.
        </p>
      </Collapsible>

      <Collapsible title="Gasto rigido (militar + previsional)">
        <div className="row">
          <span>Presupuesto militar</span>
          <b>{Math.round(militaryPctGdp * 100) / 100}% del PBI</b>
        </div>
        <div className="row">
          <span>Deficit previsional</span>
          <b className={pensionDeficitPctGdp > 0 ? 'bad' : 'good'}>{pensionDeficitPctGdp}% del PBI</b>
        </div>
        <div className="row">
          <span>Total</span>
          <b className={rigidTone}>{rigidTotal}% · {rigidLabel}</b>
        </div>
        <div className="bar">
          <div
            style={{
              width: `${Math.min(100, (rigidTotal / 24) * 100)}%`,
              background: rigidTone === 'bad' ? 'var(--bad)' : rigidTone === 'warn' ? 'var(--warn)' : 'var(--good)'
            }}
          />
        </div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>
          Militar + previsional + intereses de deuda no deberian superar el 15-18% del PBI de forma sostenida.
          Arriba de eso, subir defensa exige superavit en otro lado o reformar el sistema previsional —
          si no, el camino es mas deficit, mas inflacion y mas presion sobre el tipo de cambio.
        </p>
      </Collapsible>
    </div>
  );
}

'use client';

import { useGame } from '@/lib/store';
import { monthsToElection, needsSuccessor, oppositionCostFactor } from '@/lib/politics';
import { systemOf } from '@/lib/electoral';
import { damagedSectors, taxEffects } from '@/lib/engine';
import { plannedTaxRate } from '@/lib/orders';

/**
 * Panel de gobierno: mandato, oposicion, encuesta y politica impositiva.
 * Todo lo que se muestra lo calcula el motor; aca solo se dibuja.
 */
export default function GovernmentPanel() {
  const { countries, playerCode, politics, turn, capital, taxBase, active } = useGame();
  const planTaxChange = useGame((s) => s.planTaxChange);
  const orders = useGame((s) => s.orders);
  const currentPoll = useGame((s) => s.currentPoll);

  const country = countries[playerCode];
  const votes = currentPoll();
  const meses = monthsToElection(politics, turn);
  const sys = systemOf(playerCode);
  const honeymoonLeft = Math.max(0, (politics.honeymoonUntil ?? 0) - turn + 1);
  const fx = taxEffects(country, taxBase[playerCode]);
  const costFactor = oppositionCostFactor(politics.opposition);
  const danados = damagedSectors(country);

  const TAXES: { kind: 'iva' | 'corporate' | 'income'; label: string; value: number; hint: string }[] = [
    { kind: 'iva', label: 'IVA', value: country.economy.tax_iva, hint: 'Recauda facil, empuja precios y castiga a los que menos tienen.' },
    { kind: 'corporate', label: 'Empresas', value: country.economy.tax_corporate, hint: 'Financia el Estado y frena la inversion.' },
    { kind: 'income', label: 'Ingresos', value: country.economy.tax_income_avg, hint: 'Recauda sin inflacionar; lo siente la clase media.' }
  ];

  return (
    <div>
      <div className="section">
        <h3>Mandato</h3>
        <div className="row"><span>Partido</span><b>{politics.partyName}</b></div>
        <div className="row"><span>Gobierna</span><b>{politics.leaderName}</b></div>
        <div className="row"><span>Sistema</span><b>{sys.label}</b></div>
        <div className="row">
          <span>Mandato</span>
          <b>{politics.consecutiveTerms} de {politics.maxConsecutive} consecutivos · {Math.round(sys.termMonths / 12)} anios</b>
        </div>
        <div className="row">
          <span>Proximas elecciones</span>
          <b className={meses <= 6 ? 'warn' : ''}>
            {politics.pendingBallotage
              ? 'ballotage este mes'
              : meses === 0 ? 'ahora' : `en ${meses} ${meses === 1 ? 'mes' : 'meses'}`}
          </b>
        </div>
        {sys.midtermMonths > 0 && (
          <div className="row">
            <span>Medio termino</span>
            <b>
              {Math.max(0, sys.midtermMonths - (turn - politics.termStart))} meses
            </b>
          </div>
        )}
        <div className="row"><span>Elecciones ganadas</span><b>{politics.electionsWon}</b></div>
        {honeymoonLeft > 0 && (
          <p className="good" style={{ fontSize: 11.5, margin: '6px 0 0' }}>
            Primeros 100 dias: capital pasivo x2 durante {honeymoonLeft} mes{honeymoonLeft === 1 ? '' : 'es'}.
          </p>
        )}
        {needsSuccessor(politics) && (
          <p className="warn" style={{ fontSize: 11.5, margin: '6px 0 0' }}>
            Es tu ultimo mandato: al terminar vas a tener que elegir sucesor para que el partido siga.
          </p>
        )}
      </div>

      <div className="section">
        <h3>Intencion de voto</h3>
        <div className="row">
          <span>Si las elecciones fueran hoy</span>
          <b className={votes > 50 ? 'good' : 'bad'}>{votes}%</b>
        </div>
        <div className="bar">
          <div style={{ width: `${votes}%`, background: votes > 50 ? 'var(--good)' : 'var(--bad)' }} />
        </div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          {sys.bar}. {sys.notes}
        </p>
      </div>

      <div className="section">
        <h3>Oposicion</h3>
        <div className="row">
          <span>Fuerza</span>
          <b className={politics.opposition > 60 ? 'bad' : politics.opposition < 35 ? 'good' : 'warn'}>
            {politics.opposition}
          </b>
        </div>
        <div className="bar">
          <div style={{ width: `${politics.opposition}%`, background: 'var(--bad)' }} />
        </div>
        <p className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
          Cada decision te cuesta <b className={costFactor > 1 ? 'bad' : 'good'}>{costFactor}x</b> capital politico.
          {politics.opposition > 60 && ' Con esta oposicion, gobernar se vuelve caro: convoca al dialogo o mejora el humor social.'}
        </p>
      </div>

      <div className="section">
        <h3>Politica impositiva</h3>
        {TAXES.map((t) => {
          const planeado = plannedTaxRate(orders, t.kind, country);
          return (
            <div key={t.kind} style={{ marginBottom: 10 }}>
              <div className="row">
                <span>{t.label}</span>
                <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <button
                    onClick={() => planTaxChange(t.kind, -2)}
                    disabled={capital < 5 || t.value <= 0}
                    title="Bajar 2 puntos en el plan"
                  >−</button>
                  <b style={{ minWidth: 44, textAlign: 'center' }}>
                    {t.value}%
                    {planeado !== null && planeado !== t.value && (
                      <span className="warn"> → {planeado}%</span>
                    )}
                  </b>
                  <button onClick={() => planTaxChange(t.kind, 2)} disabled={capital < 5} title="Subir 2 puntos en el plan">+</button>
                </span>
              </div>
              <small className="muted" style={{ fontSize: 11, lineHeight: 1.35 }}>{t.hint}</small>
            </div>
          );
        })}

        <p className="muted" style={{ fontSize: 11, marginTop: -2 }}>
          Los cambios quedan en el plan del turno y se aplican al avanzar el mes. Si subis y
          despues bajas la misma alicuota, se cancelan solos y no queda nada en el historial.
        </p>

        <div className="card" style={{ marginTop: 4 }}>
          <h4 style={{ fontSize: 12 }}>Contra la estructura con la que arrancaste</h4>
          <div className="row"><span>Recaudacion</span><b className={fx.fiscal >= 0 ? 'good' : 'bad'}>{fx.fiscal >= 0 ? '+' : ''}{fx.fiscal} del PBI</b></div>
          <div className="row"><span>Inflacion</span><b className={fx.inflation > 0 ? 'bad' : 'good'}>{fx.inflation >= 0 ? '+' : ''}{fx.inflation}/turno</b></div>
          <div className="row"><span>Crecimiento</span><b className={fx.growth >= 0 ? 'good' : 'bad'}>{fx.growth >= 0 ? '+' : ''}{fx.growth}</b></div>
          <div className="row"><span>Humor social</span><b className={fx.happiness >= 0 ? 'good' : 'bad'}>{fx.happiness >= 0 ? '+' : ''}{fx.happiness}/turno</b></div>
        </div>
      </div>

      {(danados.length > 0 || active.length > 0) && (
        <div className="section">
          <h3>Situacion</h3>
          {active.map((a) => (
            <div className="row" key={a.key}>
              <span>{a.event.emoji} {a.event.title}</span>
              <b className="warn">{a.turnsLeft} {a.turnsLeft === 1 ? 'mes' : 'meses'}</b>
            </div>
          ))}
          {danados.map((d) => (
            <div key={d.sector}>
              <div className="row">
                <span>Sector {d.sector} ({d.weight}% del PBI)</span>
                <b className="bad">{d.health}%</b>
              </div>
              <div className="bar"><div style={{ width: `${d.health}%`, background: 'var(--bad)' }} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

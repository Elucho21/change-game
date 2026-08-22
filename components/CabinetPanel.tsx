'use client';

import {
  cabinetPassive, cabinetVoteBonus, coalitionPartners, coalitionSeats,
  ministerById, ministersFor, SEATS
} from '@/lib/cabinet';
import { hasMajority, MAJORITY, totalSeats } from '@/lib/politics';
import { useGame } from '@/lib/store';

/**
 * Gabinete y parlamento.
 * Cinco sillas, cada una con su apuesta; los escanos deciden si tus medidas
 * grandes pasan o hay que negociarlas voto por voto.
 */
export default function CabinetPanel() {
  const { cabinet, politics, orders, capital } = useGame();
  const planCabinet = useGame((s) => s.planCabinet);
  const available = useGame((s) => s.availableCapital)();

  const passive = cabinetPassive(cabinet);
  const socios = coalitionPartners(cabinet);
  const prestados = coalitionSeats(cabinet);
  const total = totalSeats(politics, prestados);
  const mayoria = hasMajority(politics, prestados);
  const voto = cabinetVoteBonus(cabinet);

  const plannedFor = (seat: string) =>
    orders.find((o) => o.kind === 'cabinet' && o.seat === seat);

  return (
    <div>
      <div className="section">
        <h3>Parlamento</h3>
        <div className="row">
          <span>Escanos propios</span>
          <b>{politics.seats}</b>
        </div>
        {prestados > 0 && (
          <div className="row">
            <span>Prestados por la coalicion</span>
            <b className="good">+{prestados}</b>
          </div>
        )}
        <div className="row">
          <span>Total sobre 100</span>
          <b className={mayoria ? 'good' : 'bad'}>{total}</b>
        </div>
        <div className="bar" style={{ position: 'relative' }}>
          <div style={{ width: `${politics.seats}%`, background: 'var(--accent)' }} />
          {prestados > 0 && (
            <div
              style={{
                position: 'absolute', top: 0, left: `${politics.seats}%`,
                width: `${prestados}%`, height: '100%', background: 'var(--good)'
              }}
            />
          )}
          <div
            style={{
              position: 'absolute', top: -2, left: `${MAJORITY}%`,
              width: 2, height: 10, background: 'var(--text)'
            }}
            title={`Mayoria: ${MAJORITY}`}
          />
        </div>
        <p className={mayoria ? 'muted' : 'warn'} style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.45 }}>
          {mayoria
            ? 'Tenes mayoria: tus medidas grandes pasan sin negociar.'
            : `Sin mayoria (te faltan ${MAJORITY - total}): las decisiones de 15 o mas de capital cuestan 40% mas.`}
        </p>
      </div>

      <div className="section">
        <h3>Gabinete</h3>
        {(passive.capitalPerTurn !== 0 || Object.keys(passive).length > 1) && (
          <div className="card" style={{ marginBottom: 10 }}>
            <h4 style={{ fontSize: 12 }}>Lo que aporta por mes</h4>
            {passive.capitalPerTurn ? (
              <div className="row"><span>Capital politico</span><b className="good">+{passive.capitalPerTurn.toFixed(1)}</b></div>
            ) : null}
            {passive.stability ? <div className="row"><span>Estabilidad</span><b className={passive.stability > 0 ? 'good' : 'bad'}>{passive.stability > 0 ? '+' : ''}{passive.stability}</b></div> : null}
            {passive.happiness ? <div className="row"><span>Felicidad</span><b className={passive.happiness > 0 ? 'good' : 'bad'}>{passive.happiness > 0 ? '+' : ''}{passive.happiness}</b></div> : null}
            {passive.inflation ? <div className="row"><span>Inflacion</span><b className={passive.inflation < 0 ? 'good' : 'bad'}>{passive.inflation > 0 ? '+' : ''}{passive.inflation}</b></div> : null}
            {passive.gdp_growth ? <div className="row"><span>Crecimiento</span><b className={passive.gdp_growth > 0 ? 'good' : 'bad'}>{passive.gdp_growth > 0 ? '+' : ''}{passive.gdp_growth}</b></div> : null}
            {passive.fiscal_balance ? <div className="row"><span>Balance fiscal</span><b className={passive.fiscal_balance > 0 ? 'good' : 'bad'}>{passive.fiscal_balance > 0 ? '+' : ''}{passive.fiscal_balance}</b></div> : null}
            {voto ? <div className="row"><span>Intencion de voto</span><b className={voto > 0 ? 'good' : 'bad'}>{voto > 0 ? '+' : ''}{voto}</b></div> : null}
          </div>
        )}

        {socios.length > 0 && (
          <p className="good" style={{ fontSize: 11.5, margin: '0 0 10px', lineHeight: 1.45 }}>
            🤝 Coalicion con {socios.map((m) => m.name).join(', ')}. Te presta escanos y votos,
            y cada tanto va a pedirte algo. Si le decis que no, se va.
          </p>
        )}

        {SEATS.map((seat) => {
          const actual = ministerById(cabinet[seat.id]);
          const planeado = plannedFor(seat.id);
          const opciones = ministersFor(seat.id);

          return (
            <div className="card" key={seat.id}>
              <h4>
                {seat.label}
                {actual ? <span className="muted"> · {actual.name}</span> : <span className="warn"> · vacante</span>}
              </h4>
              <p>{actual ? `${actual.title}. ${actual.description}` : seat.hint}</p>

              {planeado && (
                <p className="warn" style={{ fontSize: 11, margin: '6px 0 0' }}>
                  En el plan: {planeado.label} ({planeado.capitalCost} cap.)
                </p>
              )}

              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                {opciones.map((m) => {
                  const puesto = cabinet[seat.id] === m.id;
                  const costo = cabinet[seat.id] ? 20 : 8;
                  return (
                    <button
                      key={m.id}
                      className={puesto ? 'btn-primary' : ''}
                      disabled={puesto || available < costo}
                      onClick={() => planCabinet(seat.id, m.id)}
                      title={`${m.title}. ${m.description}${m.party !== 'oficialismo' ? ' (otro partido: suma coalicion)' : ''}`}
                    >
                      {m.party !== 'oficialismo' ? '🤝 ' : ''}{m.name}
                      {!puesto && <span className="muted"> · {costo}</span>}
                    </button>
                  );
                })}
                {actual && (
                  <button
                    className="link bad"
                    onClick={() => planCabinet(seat.id, null)}
                    disabled={available < 12}
                  >
                    dejar vacante
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <p className="muted" style={{ fontSize: 11, lineHeight: 1.45 }}>
          Nombrar cuesta 8 de capital; reemplazar a alguien, 20, porque echar tiene su propio costo.
          Los cambios entran al plan del turno y se hacen efectivos al avanzar el mes.
        </p>
      </div>
    </div>
  );
}

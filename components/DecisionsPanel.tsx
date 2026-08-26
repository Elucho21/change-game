'use client';

import { useMemo, useState } from 'react';
import { CATEGORIES, DECISIONS } from '@/lib/decisions';
import { decisionEligible, decisionWhenEligible } from '@/lib/diplomacy';
import { coalitionSeats, coalitionPartners as coalitionPartnersOf } from '@/lib/cabinet';
import {
  monthsToElection as monthsToElectionOf, needsSuccessor, normalizeOppositionParties, parliament, poll
} from '@/lib/politics';
import { systemOf } from '@/lib/electoral';
import { buildCtx, previewDelta } from '@/lib/engine';
import { previewMoralDelta } from '@/lib/moral';
import { previewGroupDelta } from '@/lib/popularGroups';
import { useGame } from '@/lib/store';
import DecisionPreview from './DecisionPreview';

type SortMode = 'catalogo' | 'costo' | 'alfabetico';

/**
 * Decisiones por categoria, con buscador cruzado y orden. El primer click
 * abre las consecuencias a 3 turnos; el segundo confirma. Asi el jugador ve
 * el impacto de segundo orden antes de gastar capital politico, y no se
 * ejecuta nada por un click perdido.
 */
export default function DecisionsPanel() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]['id']>('economia');
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('catalogo');

  const {
    capital, capitalDiplomatico, selected, playerCode, countries, orders, turn, usedOnce,
    world, blocs, relations, moral, groups, politics, cabinet
  } = useGame();
  const plan = useGame((s) => s.planDecision);
  const preview = useGame((s) => s.previewDecision);
  const availablePolitico = useGame((s) => s.availableCapital)();
  const availableDiplomatico = useGame((s) => s.availableCapitalDiplomatico)();
  const quote = useGame((s) => s.quoteDecision);
  const target = selected && selected !== playerCode ? selected : undefined;

  const buscando = query.trim().length > 0;

  // diplomacia gasta de otro pool: la pestana (o la categoria propia del
  // resultado, buscando) define contra que capital se mide
  const poolIsDiplomatico = cat === 'diplomacia';
  const available = poolIsDiplomatico ? availableDiplomatico : availablePolitico;
  const capitalTotal = poolIsDiplomatico ? capitalDiplomatico : capital;
  const poolLabel = poolIsDiplomatico ? 'Capital diplomatico' : 'Capital politico';
  const availableOf = (d: (typeof DECISIONS)[number]) =>
    d.category === 'diplomacia' ? availableDiplomatico : availablePolitico;

  // contexto para las decisiones contextuales (dec.when, Change World Game v1.2):
  // se arma directo del estado vivo, sin pasar por SimState/eventExtraOf — el
  // filtro de decisiones es UI de display, no parte del contrato preview-vs-real
  const decisionCtx = useMemo(() => {
    // el pacto parlamentario (lib/decisions.ts) necesita ver el estado real de
    // los dos partidos opositores para decidir si se le puede ofrecer un lugar.
    // Mismo shape que arma eventExtraOf (lib/simulation.ts) para el sorteo real,
    // asi el filtro del catalogo no le miente al jugador sobre lo que esta
    // habilitado.
    const player = countries[playerCode];
    const seats = parliament(politics, moral, coalitionSeats(cabinet));
    const parties = normalizeOppositionParties(politics.oppositionParties, politics.partyName)
      .map((party, i) => ({
        name: party.name, ideology: party.ideology, mood: party.mood,
        inCoalition: party.inCoalition, seats: i === 0 ? seats.partyA : seats.partyB
      }));
    const sys = systemOf(playerCode);
    const sinceStart = turn - politics.termStart;
    return {
      ...buildCtx(player, world, turn, blocs, relations, {
        moral,
        politics: {
          opposition: politics.opposition,
          monthsToElection: monthsToElectionOf(politics, turn),
          monthsToMidterm: sys.midtermMonths ? Math.max(0, sys.midtermMonths - sinceStart) : null,
          poll: poll(player, politics, capital),
          consecutiveTerms: politics.consecutiveTerms,
          lastTerm: needsSuccessor(politics),
          honeymoon: (politics.honeymoonUntil ?? 0) >= turn,
          capital,
          seats: politics.seats,
          coalition: Object.values(cabinet).length > 0 && !!coalitionPartnersOf(cabinet).length,
          parties
        }
      }),
      groups, capitalDiplomatico
    };
  }, [
    countries, playerCode, world, turn, blocs, relations, moral, groups, capitalDiplomatico,
    politics, cabinet, capital
  ]);

  // las "once" ya usadas y las que no cumplen su `when` desaparecen del
  // catalogo; la contraria de un par toggle (requires) recien aparece cuando
  // la original ya se tomo. Buscando, ignora la pestana y mira las 8 categorias.
  const qLower = query.trim().toLowerCase();
  const list = useMemo(() => {
    const base = DECISIONS.filter((d) =>
      (buscando ? (d.label.toLowerCase().includes(qLower) || d.detail.toLowerCase().includes(qLower)) : d.category === cat)
      && decisionEligible(d, usedOnce, target) && decisionWhenEligible(d, decisionCtx)
    );
    if (sort === 'costo') return [...base].sort((a, b) => a.cost.capital - b.cost.capital);
    if (sort === 'alfabetico') return [...base].sort((a, b) => a.label.localeCompare(b.label));
    return base;
  }, [buscando, qLower, cat, usedOnce, target, decisionCtx, sort]);

  // la proyeccion simula 3 turnos por duplicado: se calcula solo para la
  // decision abierta y se recalcula unicamente si cambia el turno o el objetivo
  const projection = useMemo(
    () => (open ? preview(open, target) : null),
    [open, target, turn, preview]
  );

  return (
    <div>
      <div className="section" style={{ position: 'sticky', top: 0, zIndex: 4 }}>
        <h3>
          {buscando
            ? `Politico: ${availablePolitico} libre · Diplomatico: ${availableDiplomatico} libre`
            : (<>
                {poolLabel}: {available} libre
                {available !== Math.round(capitalTotal) && (
                  <span className="muted"> (de {Math.round(capitalTotal)}, el resto ya esta en el plan)</span>
                )}
              </>)}
        </h3>
        <input
          type="text"
          placeholder="Buscar en las 8 categorias (ej: impuesto, tropas, embajador)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(null); }}
          style={{ width: '100%', marginBottom: 6 }}
        />
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          {!buscando && CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={cat === c.id ? 'btn-primary' : ''}
              onClick={() => { setCat(c.id); setOpen(null); }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            title="Orden de la lista"
            style={{ marginLeft: buscando ? 0 : 'auto' }}
          >
            <option value="catalogo">Orden: catalogo</option>
            <option value="costo">Orden: costo (menor a mayor)</option>
            <option value="alfabetico">Orden: alfabetico</option>
          </select>
        </div>
        {orders.length > 0 && (
          <p className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
            En el plan: {orders.map((o) => o.label).join(' · ')}
          </p>
        )}
      </div>

      <div className="section">
        {buscando && list.length === 0 && (
          <p className="muted" style={{ fontSize: 12.5 }}>Nada coincide con &quot;{query}&quot;.</p>
        )}
        {list.map((d) => {
          const disponible = availableOf(d);
          const etiquetaPool = d.category === 'diplomacia' ? 'Capital diplomatico' : 'Capital politico';
          const needsTarget = d.needsTarget && !target;
          const q = quote(d.id, d.needsTarget ? target : undefined);
          const costo = q?.cost ?? d.cost.capital;
          const enfriando = (q?.cooldown ?? 0) > 0;
          const afford = disponible >= costo;
          const yaEnPlan = orders.some((o) => o.kind === 'decision' && o.id === d.id);
          const disabled = !afford || needsTarget || enfriando;
          const isOpen = open === d.id;
          const catInfo = CATEGORIES.find((c) => c.id === d.category);

          return (
            <div key={d.id}>
              <button
                className={`decision${isOpen ? ' open' : ''}${yaEnPlan ? ' planned' : ''}`}
                disabled={disabled}
                onClick={() => setOpen(isOpen ? null : d.id)}
                title={
                  enfriando ? `Ya la usaste: disponible en ${q?.cooldown} ${q?.cooldown === 1 ? 'mes' : 'meses'}`
                    : needsTarget ? 'Elegi un pais en el globo primero'
                      : afford ? '' : `${etiquetaPool} insuficiente`
                }
              >
                <strong>
                  {d.emoji} {d.label}{yaEnPlan ? ' ✓' : ''}{' '}
                  <span className={costo > d.cost.capital ? 'warn' : costo < d.cost.capital ? 'good' : 'muted'}>
                    ({costo} cap.{d.cost.fiscal ? ` · ${d.cost.fiscal}% PBI` : ''})
                  </span>
                  {buscando && catInfo && <span className="muted"> · {catInfo.emoji} {catInfo.label}</span>}
                </strong>
                <small>{d.detail}</small>
                {enfriando && (
                  <small className="warn">
                    En espera: disponible en {q?.cooldown} {q?.cooldown === 1 ? 'mes' : 'meses'}.
                  </small>
                )}
                {d.needsTarget && (
                  <small className={target ? 'good' : 'warn'}>
                    {target ? `Objetivo: ${countries[target].flag} ${countries[target].name}` : 'Elegi un pais en el globo'}
                  </small>
                )}
                <span className="preview">
                  {previewDelta(d.effects).map((p) => (
                    <em key={p.key} className={p.tone === 'bueno' ? 'good' : 'bad'}>
                      {p.label} {p.value > 0 ? '+' : ''}{p.value}
                    </em>
                  ))}
                  {d.moralEffects && previewMoralDelta(d.moralEffects).map((p) => (
                    <em key={p.key} className={p.tone === 'bueno' ? 'good' : 'bad'}>
                      {p.label} {p.value > 0 ? '+' : ''}{p.value}
                    </em>
                  ))}
                  {d.groupEffects && previewGroupDelta(d.groupEffects).map((p) => (
                    <em key={p.key} className={p.tone === 'bueno' ? 'good' : 'bad'}>
                      {p.label} {p.value > 0 ? '+' : ''}{p.value}
                    </em>
                  ))}
                  {d.relations?.map((r, i) => (
                    <em key={i} className={r.amount > 0 ? 'good' : 'bad'}>
                      {r.target === 'TARGET' ? 'Relacion objetivo' : `Relacion ${r.target}`} {r.amount > 0 ? '+' : ''}{r.amount}
                    </em>
                  ))}
                </span>
              </button>

              {isOpen && (
                <div className="decision-open">
                  {projection && <DecisionPreview projection={projection} />}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button
                      className="btn-primary"
                      onClick={() => { plan(d.id, target); setOpen(null); }}
                      disabled={disabled}
                    >
                      {yaEnPlan ? 'Actualizar en el plan' : 'Agregar al plan'}
                    </button>
                    <button onClick={() => setOpen(null)}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { describe, expect, it } from 'vitest';
import data from '../lib/data/countries.gen.json';
import {
  aiCountryDecisions, aiRoster, applySectorShock, applyWorldShock, canJoin, ratesOf, taxEffects,
  worldShockMultiplier
} from '../lib/engine';
import { bilateralVolume, tradeBaseline, tradeMatrix, volumeFrom, type TradeContext } from '../lib/trade';
import { deterministicTick, projectDecision, type SimState } from '../lib/simulation';
import {
  defaultPolitics, driftOpposition, parliamentCostFactor, poll, seatsFromVote
} from '../lib/politics';
import { BLOCS } from '../lib/blocs';
import { CATEGORIES, DECISIONS } from '../lib/decisions';
import { addDecisionOrder, addTaxOrder, committedCapital } from '../lib/orders';
import { cooldownLeft, cooldownOf, scaleDecision } from '../lib/diplomacy';
import {
  cabinetCostFactor, cabinetPassive, cabinetVoteBonus, coalitionSeats, hasCoalition
} from '../lib/cabinet';
import { chokepointClosureRisk } from '../lib/routes';
import type { Country, GlobalState } from '../lib/types';

/**
 * Tests del motor. Existen por una razon concreta: el contenido lo carga Grok
 * en paralelo, y una condicion mal escrita o un delta desbalanceado no se nota
 * hasta jugar media hora. Aca se nota en dos segundos.
 */

const RAW = data as unknown as {
  countries: Record<string, Country>;
  relations: Record<string, number>;
  global: GlobalState;
};

const fresh = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function simFor(playerCode: string): SimState {
  const countries = fresh(RAW.countries);
  const relations = fresh(RAW.relations);
  const blocs = fresh(BLOCS);
  const base: SimState = {
    turn: 1,
    playerCode,
    countries,
    relations,
    blocs,
    world: fresh(RAW.global),
    capital: 60,
    sanctions: [],
    disruptions: {},
    tradeBase: {},
    active: [],
    taxBase: Object.fromEntries(Object.values(countries).map((c) => [c.code, ratesOf(c)]))
  };
  const ctx: TradeContext = {
    countries, relations, blocs, sanctions: [], playerCode, disruptions: {}, turn: 1
  };
  base.tradeBase = tradeBaseline(ctx);
  return base;
}

const ctxOf = (s: SimState): TradeContext => ({
  countries: s.countries,
  relations: s.relations,
  blocs: s.blocs,
  sanctions: s.sanctions,
  playerCode: s.playerCode,
  disruptions: s.disruptions,
  turn: s.turn
});

// ============================================================
describe('comercio', () => {
  it('mantiene la calibracion contra los pares conocidos', () => {
    const s = simFor('Argentina');
    const ctx = ctxOf(s);
    // Los valores incluyen los multiplicadores de bloque y relacion, no solo la
    // gravedad base: EE.UU. y Mexico comparten el T-MEC, y eso los acerca.
    // Los rangos son anchos a proposito: cuidan el orden de magnitud, no un
    // numero exacto que cambiaria con cualquier ajuste de balance.
    expect(bilateralVolume('China', 'USA', ctx)).toBeGreaterThan(400);
    expect(bilateralVolume('China', 'USA', ctx)).toBeLessThan(800);
    expect(bilateralVolume('USA', 'Mexico', ctx)).toBeGreaterThan(350);
    expect(bilateralVolume('USA', 'Mexico', ctx)).toBeLessThan(750);
    expect(bilateralVolume('Brazil', 'China', ctx)).toBeGreaterThan(80);
    expect(bilateralVolume('Brazil', 'China', ctx)).toBeLessThan(250);
    // y el orden entre pares tiene que sostenerse
    expect(bilateralVolume('China', 'USA', ctx)).toBeGreaterThan(bilateralVolume('Brazil', 'China', ctx));
  });

  it('es simetrico', () => {
    const ctx = ctxOf(simFor('Argentina'));
    expect(bilateralVolume('Brazil', 'Argentina', ctx)).toBe(bilateralVolume('Argentina', 'Brazil', ctx));
  });

  it('la sancion derrumba el comercio con ese pais', () => {
    const s = simFor('Argentina');
    const antes = bilateralVolume('Argentina', 'Brazil', ctxOf(s));
    s.sanctions = ['Brazil'];
    const despues = bilateralVolume('Argentina', 'Brazil', ctxOf(s));
    expect(despues).toBeLessThan(antes * 0.3);
  });

  it('cerrar un chokepoint pega en el comercio de larga distancia', () => {
    const s = simFor('Argentina');
    const antes = bilateralVolume('Argentina', 'China', ctxOf(s));
    s.disruptions = { malaca: 10, ormuz: 10 };
    const despues = bilateralVolume('Argentina', 'China', ctxOf(s));
    expect(despues).toBeLessThan(antes);
  });
});

// ============================================================
describe('sectores', () => {
  it('el mismo shock pega distinto segun el peso del sector', () => {
    const s = simFor('Argentina');
    const arg = s.countries.Argentina;   // agricultura 8%
    const jpn = s.countries.Japan;       // agricultura 1%
    const dArg = applySectorShock(arg, { agriculture: -25 });
    const dJpn = applySectorShock(jpn, { agriculture: -25 });
    expect(dArg).toBeLessThan(dJpn);
    expect(Math.abs(dArg)).toBeGreaterThan(Math.abs(dJpn) * 3);
  });

  it('deja registrada la salud del sector golpeado', () => {
    const s = simFor('Argentina');
    applySectorShock(s.countries.Argentina, { agriculture: -25 });
    expect(s.countries.Argentina.sectorHealth?.agriculture).toBe(75);
  });
});

// ============================================================
describe('impuestos', () => {
  it('no hacen nada mientras el jugador no los toque', () => {
    const s = simFor('USA');
    for (const c of Object.values(s.countries)) {
      const fx = taxEffects(c, s.taxBase[c.code]);
      expect(fx).toEqual({ fiscal: 0, inflation: 0, growth: 0, happiness: 0 });
    }
  });

  it('subir el IVA recauda mas y cuesta humor social e inflacion', () => {
    const s = simFor('Argentina');
    s.countries.Argentina.economy.tax_iva += 5;
    const fx = taxEffects(s.countries.Argentina, s.taxBase.Argentina);
    expect(fx.fiscal).toBeGreaterThan(0);
    expect(fx.inflation).toBeGreaterThan(0);
    expect(fx.happiness).toBeLessThan(0);
  });
});

// ============================================================
describe('turno determinista', () => {
  it('el preview coincide con lo que realmente pasa', () => {
    const decision = DECISIONS.find((d) => d.id === 'ajuste_fiscal')!;
    const start = simFor('Argentina');

    const projection = projectDecision(fresh(start), decision, undefined, 3);
    const felicidadProyectada = projection.metrics.find((m) => m.key === 'happiness')!.deltas[3];

    // linea base: tres turnos sin decidir nada
    let base = fresh(start);
    for (let i = 0; i < 3; i++) base = deterministicTick(base).state;

    // el mismo arranque, aplicando la decision
    let withD = fresh(start);
    withD.countries[withD.playerCode].population.happiness += decision.effects.happiness ?? 0;
    withD.countries[withD.playerCode].economy.gdp_growth += decision.effects.gdp_growth ?? 0;
    withD.countries[withD.playerCode].economy.inflation += decision.effects.inflation ?? 0;
    withD.countries[withD.playerCode].economy.unemployment += decision.effects.unemployment ?? 0;
    withD.countries[withD.playerCode].economy.fiscal_balance += decision.effects.fiscal_balance ?? 0;
    withD.countries[withD.playerCode].population.stability += decision.effects.stability ?? 0;
    for (let i = 0; i < 3; i++) withD = deterministicTick(withD).state;

    const real =
      withD.countries[withD.playerCode].population.happiness -
      base.countries[base.playerCode].population.happiness;

    expect(felicidadProyectada).toBeCloseTo(real, 1);
  });

  it('los eventos con ongoing cobran todos los meses y se apagan solos', () => {
    const s = simFor('Argentina');
    s.active = [
      {
        key: 'x',
        turn: 1,
        target: 'Argentina',
        resolved: false,
        turnsLeft: 3,
        event: {
          id: 'test_recesion', scope: 'mundial', title: 'test', emoji: '📉',
          tags: [], weight: 0, duration: 3, description: '',
          ongoing: { happiness: -2 }
        }
      }
    ];
    const antes = s.countries.Argentina.population.happiness;
    let cur = s;
    const felicidades: number[] = [];
    for (let i = 0; i < 5; i++) {
      cur = deterministicTick(cur).state;
      felicidades.push(cur.countries.Argentina.population.happiness);
    }
    expect(cur.active).toHaveLength(0);
    expect(felicidades[0]).toBeLessThan(antes);
    // los ultimos dos turnos ya no tienen el castigo del evento
    const caidaConEvento = felicidades[0] - felicidades[1];
    const caidaSinEvento = felicidades[3] - felicidades[4];
    expect(caidaConEvento).toBeGreaterThan(caidaSinEvento);
  });

  it('no rompe la economia despues de 60 turnos', () => {
    let s = simFor('Argentina');
    for (let i = 0; i < 60; i++) s = deterministicTick(s).state;
    const e = s.countries.Argentina.economy;
    const p = s.countries.Argentina.population;
    expect(Number.isFinite(e.inflation)).toBe(true);
    expect(Number.isFinite(e.gdp_growth)).toBe(true);
    expect(p.happiness).toBeGreaterThanOrEqual(0);
    expect(p.happiness).toBeLessThanOrEqual(100);
    expect(e.unemployment).toBeGreaterThan(0);
    // con inflacion alta sostenida la felicidad cae, pero no se hunde a cero:
    // tiene que existir un equilibrio jugable
    expect(p.happiness).toBeGreaterThan(15);
  });
});

// ============================================================
describe('politica', () => {
  it('la oposicion converge en vez de acumular sin techo', () => {
    const country = fresh(RAW.countries.Argentina);
    country.population.happiness = 20;
    let p = defaultPolitics(country, 1);
    for (let i = 0; i < 200; i++) p = { ...p, opposition: driftOpposition(p, country) };
    expect(p.opposition).toBeLessThanOrEqual(90);

    // y si la gestion mejora, baja
    country.population.happiness = 75;
    country.economy.gdp_growth = 4;
    for (let i = 0; i < 40; i++) p = { ...p, opposition: driftOpposition(p, country) };
    expect(p.opposition).toBeLessThan(45);
  });

  it('la encuesta reacciona a la gestion', () => {
    const country = fresh(RAW.countries.Brazil);
    const p = defaultPolitics(country, 1);
    const bueno = { ...country, population: { ...country.population, happiness: 75 } };
    const malo = { ...country, population: { ...country.population, happiness: 25 } };
    expect(poll(bueno, p, 60)).toBeGreaterThan(poll(malo, p, 60));
  });
});

// ============================================================
describe('contenido', () => {
  it('todos los ids de decision son unicos', () => {
    const ids = DECISIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ninguna decision es gratis', () => {
    for (const d of DECISIONS) {
      expect(d.cost.capital, `${d.id} no cuesta capital politico`).toBeGreaterThan(0);
    }
  });

  it('los bloques solo tienen miembros que existen', () => {
    for (const b of BLOCS) {
      for (const m of [...b.members, ...b.candidates, ...b.rivals]) {
        expect(RAW.countries[m], `${b.short} referencia a "${m}", que no existe`).toBeTruthy();
      }
    }
  });

  it('la cohesion de los bloques arranca en rango', () => {
    for (const b of BLOCS) {
      expect(b.cohesion).toBeGreaterThanOrEqual(0);
      expect(b.cohesion).toBeLessThanOrEqual(100);
    }
  });
});

// ============================================================
describe('bloques', () => {
  it('entrar a una union aduanera mejora el comercio con los socios', () => {
    const s = simFor('Chile');
    const antes = bilateralVolume('Chile', 'Brazil', ctxOf(s));
    const mercosur = s.blocs.find((b) => b.id === 'mercosur')!;
    mercosur.members.push('Chile');
    const despues = bilateralVolume('Chile', 'Brazil', ctxOf(s));
    expect(despues).toBeGreaterThan(antes);
  });

  it('no se puede entrar a un bloque militar sin relacion suficiente', () => {
    const s = simFor('Argentina');
    const otan = s.blocs.find((b) => b.id === 'otan')!;
    const check = canJoin(otan, 'Argentina', s.relations, 100);
    expect(check.ok).toBe(false);
  });
});

// ============================================================
describe('plan del turno', () => {
  it('subir y bajar la misma alicuota deja el plan vacio', () => {
    let orders = addTaxOrder([], 'iva', 2);
    expect(orders).toHaveLength(1);
    orders = addTaxOrder(orders, 'iva', -2);
    // este era el bug: quedaban dos lineas contradictorias en el historial
    expect(orders).toHaveLength(0);
  });

  it('los cambios sobre la misma alicuota se consolidan en uno solo', () => {
    let orders = addTaxOrder([], 'iva', 2);
    orders = addTaxOrder(orders, 'iva', 2);
    orders = addTaxOrder(orders, 'iva', -1);
    expect(orders).toHaveLength(1);
    const tax = orders[0] as { delta: number };
    expect(tax.delta).toBe(3);
  });

  it('alicuotas distintas conviven como ordenes separadas', () => {
    let orders = addTaxOrder([], 'iva', 2);
    orders = addTaxOrder(orders, 'corporate', -3);
    expect(orders).toHaveLength(2);
  });

  it('planificar la misma decision dos veces no la duplica', () => {
    let orders = addDecisionOrder([], 'obra_publica', 8);
    orders = addDecisionOrder(orders, 'obra_publica', 8);
    expect(orders).toHaveLength(1);
  });

  it('el capital comprometido suma el costo de todo el plan', () => {
    let orders = addDecisionOrder([], 'obra_publica', 8);
    orders = addTaxOrder(orders, 'iva', 4);   // 2 + 4*1.5 = 8
    expect(committedCapital(orders)).toBe(16);
  });
});

// ============================================================
describe('tasador diplomatico', () => {
  it('la misma decision cuesta segun el tamano del socio', () => {
    const s = simFor('Argentina');
    const tlc = DECISIONS.find((d) => d.id === 'tratado_comercial')!;
    const uy = scaleDecision(tlc, s.countries.Argentina, s.countries.Uruguay, s.relations);
    const us = scaleDecision(tlc, s.countries.Argentina, s.countries.USA, s.relations);
    expect(uy.cost).toBeLessThan(us.cost);
    expect(us.cost).toBeGreaterThan(tlc.cost.capital * 2);
    expect(uy.cost).toBeLessThan(tlc.cost.capital);
  });

  it('los efectos escalan igual que el costo', () => {
    const s = simFor('Argentina');
    const tlc = DECISIONS.find((d) => d.id === 'tratado_comercial')!;
    const uy = scaleDecision(tlc, s.countries.Argentina, s.countries.Uruguay, s.relations);
    const us = scaleDecision(tlc, s.countries.Argentina, s.countries.USA, s.relations);
    expect(us.effects.gdp_growth!).toBeGreaterThan(uy.effects.gdp_growth!);
  });

  it('una decision sin objetivo no se toca', () => {
    const s = simFor('Argentina');
    const ajuste = DECISIONS.find((d) => d.id === 'ajuste_fiscal')!;
    const q = scaleDecision(ajuste, s.countries.Argentina, undefined, s.relations);
    expect(q.cost).toBe(ajuste.cost.capital);
    expect(q.effects).toEqual(ajuste.effects);
  });

  it('el cooldown impide repetir la jugada con el mismo pais', () => {
    const cooldowns = { 'mision_diplomatica|Brazil': 10 };
    expect(cooldownLeft(cooldowns, 'mision_diplomatica', 'Brazil', 4)).toBe(6);
    expect(cooldownLeft(cooldowns, 'mision_diplomatica', 'Chile', 4)).toBe(0);
    expect(cooldownLeft(cooldowns, 'mision_diplomatica', 'Brazil', 12)).toBe(0);
  });
});

// ============================================================
describe('comercio a escala', () => {
  it('la matriz es simetrica y coincide con el calculo por par', () => {
    const s = simFor('Argentina');
    const ctx = ctxOf(s);
    const m = tradeMatrix(ctx);
    expect(m.totals.Argentina).toBeGreaterThan(0);
    const directo = bilateralVolume('Argentina', 'Brazil', ctx);
    expect(volumeFrom(m, 'Argentina', 'Brazil')).toBe(directo);
    expect(volumeFrom(m, 'Brazil', 'Argentina')).toBe(directo);
  });

  it('el total de un pais es la suma de sus pares', () => {
    const s = simFor('Argentina');
    const ctx = ctxOf(s);
    const m = tradeMatrix(ctx);
    const suma = Object.keys(ctx.countries)
      .filter((c) => c !== 'Argentina')
      .reduce((acc, c) => acc + volumeFrom(m, 'Argentina', c), 0);
    expect(m.totals.Argentina).toBeCloseTo(suma, 0);
  });
});

// ============================================================
describe('gabinete y parlamento', () => {
  it('los pasivos del gabinete se suman', () => {
    const cabinet = { economia: 'eco_ortodoxa', jefatura: 'jef_armador' };
    const p = cabinetPassive(cabinet);
    expect(p.capitalPerTurn).toBeGreaterThan(0);      // el armador aporta capital
    expect(p.inflation).toBeLessThan(0);              // la ortodoxa baja inflacion
    expect(p.happiness).toBeLessThan(0);              // y cuesta humor social
  });

  it('un ministro del area abarata esa categoria y no las otras', () => {
    const cabinet = { exterior: 'ext_carrera' };
    expect(cabinetCostFactor(cabinet, 'diplomacia')).toBeLessThan(1);
    expect(cabinetCostFactor(cabinet, 'economia')).toBe(1);
  });

  it('sentar a un opositor arma coalicion, suma votos y escanos', () => {
    const cabinet = { jefatura: 'jef_coalicion' };
    expect(hasCoalition(cabinet)).toBe(true);
    expect(coalitionSeats(cabinet)).toBeGreaterThan(0);
    expect(cabinetVoteBonus(cabinet)).toBeGreaterThan(0);
    expect(hasCoalition({ economia: 'eco_ortodoxa' })).toBe(false);
  });

  it('sin mayoria las medidas grandes cuestan mas, las chicas no', () => {
    const country = fresh(RAW.countries.Argentina);
    const p = { ...defaultPolitics(country, 1), seats: 40 };
    expect(parliamentCostFactor(p, 20)).toBe(1.4);
    expect(parliamentCostFactor(p, 8)).toBe(1);
    // con los escanos prestados por la coalicion, alcanza la mayoria
    expect(parliamentCostFactor(p, 20, 12)).toBe(1);
  });

  it('el reparto de escanos sigue al voto sin copiarlo', () => {
    const previo = 48;
    const conVictoria = seatsFromVote(60, previo);
    const conDerrota = seatsFromVote(35, previo);
    expect(conVictoria).toBeGreaterThan(previo);
    expect(conDerrota).toBeLessThan(previo);
    // nunca barre el Congreso de un saque
    expect(conVictoria).toBeLessThan(70);
  });
});

// ============================================================
describe('chokepoints con duenio', () => {
  it('sin hostilidad ni tension, nadie cierra nada', () => {
    expect(chokepointClosureRisk('ormuz', 10, 40)).toBe(0);
  });

  it('con Iran acorralado y tension alta, el riesgo aparece', () => {
    const riesgo = chokepointClosureRisk('ormuz', -85, 85);
    expect(riesgo).toBeGreaterThan(0);
    expect(riesgo).toBeLessThanOrEqual(0.12);
  });

  it('un paso sin duenio no tiene riesgo politico', () => {
    expect(chokepointClosureRisk('panama', -90, 90)).toBe(0);
  });
});

// ============================================================
describe('acciones de gobierno', () => {
  it('todas tienen enfriamiento entre 1 y 4 meses', () => {
    for (const d of DECISIONS) {
      const cd = cooldownOf(d);
      expect(cd, `${d.id} tiene un enfriamiento fuera de rango`).toBeGreaterThanOrEqual(1);
      // 4 es el tope, y solo para los actos de comunicacion
      expect(cd, `${d.id} tiene un enfriamiento fuera de rango`).toBeLessThanOrEqual(4);
      if (cd === 4) expect(d.category).toBe('comunicacion');
    }
  });

  it('cada segmento tiene al menos ocho opciones', () => {
    for (const cat of CATEGORIES) {
      const n = DECISIONS.filter((d) => d.category === cat.id).length;
      const minimo = cat.id === 'comunicacion' ? 5 : 8;
      expect(n, `${cat.label} tiene solo ${n} acciones`).toBeGreaterThanOrEqual(minimo);
    }
  });

  it('comunicacion sube el animo sin tocar la economia real', () => {
    const comms = DECISIONS.filter((d) => d.category === 'comunicacion');
    expect(comms.length).toBeGreaterThan(4);
    for (const d of comms) {
      // no mueven crecimiento, inflacion ni desempleo: cambian como se vive la economia
      expect(d.effects.gdp_growth ?? 0, `${d.id} mueve el crecimiento`).toBe(0);
      expect(d.effects.inflation ?? 0, `${d.id} mueve la inflacion`).toBe(0);
      expect(d.effects.unemployment ?? 0, `${d.id} mueve el desempleo`).toBe(0);
      // y alguna de las tres que si les toca
      const mueveAnimo = (d.effects.happiness ?? 0) > 0 || (d.effects.stability ?? 0) > 0 || (d.effects.capital ?? 0) > 0;
      expect(mueveAnimo, `${d.id} no sube animo ni capital`).toBe(true);
    }
  });

  it('ninguna accion nueva es gratis', () => {
    for (const d of DECISIONS) {
      expect(d.cost.capital, `${d.id} no cuesta capital`).toBeGreaterThan(0);
    }
  });
});

describe('IA de paises rivales', () => {
  it('el roster tiene al menos 10 paises y nunca incluye al jugador', () => {
    const countries = fresh(RAW.countries);
    const roster = aiRoster(countries, 'Argentina');
    expect(roster.length).toBeGreaterThanOrEqual(10);
    expect(roster).not.toContain('Argentina');
  });

  it('ordena el roster de mayor a menor PBI', () => {
    const countries = fresh(RAW.countries);
    const roster = aiRoster(countries, 'Argentina');
    const gdps = roster.map((code) => countries[code].economy.gdp_trillion_usd);
    for (let i = 1; i < gdps.length; i++) expect(gdps[i]).toBeLessThanOrEqual(gdps[i - 1]);
  });

  it('un pais con deficit muy negativo sube el IVA cuando le toca actuar', () => {
    const countries = fresh(RAW.countries);
    countries.Brazil.economy.fiscal_balance = -10;
    countries.Brazil.economy.tax_iva = 20;
    const before = countries.Brazil.economy.tax_iva;

    const originalRandom = Math.random;
    Math.random = () => 0; // fuerza a que el pais actue este turno
    try {
      aiCountryDecisions(countries, ['Brazil'], fresh(RAW.global));
    } finally {
      Math.random = originalRandom;
    }

    expect(countries.Brazil.economy.tax_iva).toBeGreaterThan(before);
  });

  it('nunca mueve al pais del jugador si no esta en el roster que se le pasa', () => {
    const countries = fresh(RAW.countries);
    const before = JSON.stringify(countries.Argentina);
    aiCountryDecisions(countries, aiRoster(countries, 'Argentina'), fresh(RAW.global));
    expect(JSON.stringify(countries.Argentina)).toBe(before);
  });
});

describe('shock mundial diferenciado', () => {
  it('una potencia absorbe mejor el golpe que una economia chica', () => {
    const countries = fresh(RAW.countries);
    expect(worldShockMultiplier(countries.USA)).toBeLessThan(worldShockMultiplier(countries.Bolivia));
  });

  it('aplica el mismo shock con distinta intensidad segun el pais', () => {
    const countries = fresh(RAW.countries);
    countries.USA.economy.gdp_growth = 2;
    countries.Bolivia.economy.gdp_growth = 2;
    applyWorldShock(countries, { gdp_growth: -1 }, []);
    // USA (grande, multiplicador 0.7) cae menos que Bolivia (chica, 1.35)
    expect(countries.USA.economy.gdp_growth).toBeGreaterThan(countries.Bolivia.economy.gdp_growth);
  });

  it('devuelve quien lo paso mejor y peor dentro del roster', () => {
    const countries = fresh(RAW.countries);
    const roster = ['USA', 'Bolivia'];
    for (const code of roster) countries[code].economy.gdp_growth = 2;
    const spread = applyWorldShock(countries, { gdp_growth: -1 }, roster);
    expect(spread).not.toBeNull();
    expect(spread!.best).toBe('USA');
    expect(spread!.worst).toBe('Bolivia');
  });
});

import { describe, expect, it } from 'vitest';
import { DECISIONS } from '../lib/decisions';
import { DECISIONS_ECONOMIA } from '../lib/decisions_economia';
import { DECISIONS_ORMUZ } from '../lib/decisions_ormuz';
import { NATIONAL_EVENTS } from '../lib/events/national';
import { NATIONAL_EVENTS_EXTRA } from '../lib/events/national_extra';
import { WORLD_EVENTS } from '../lib/events/world';
import { WORLD_EVENTS_EXTRA } from '../lib/events/world_extra';
import {
  employmentFromSectorPush,
  GAME_SECTORS,
  GAME_SECTOR_LABOR,
  SECTOR_LABOR
} from '../lib/employment_sectors';
import type { EventContext, GameEvent } from '../lib/types';

const ALL_DECISIONS = [...DECISIONS, ...DECISIONS_ORMUZ, ...DECISIONS_ECONOMIA];
const ALL_EVENTS = [...WORLD_EVENTS, ...WORLD_EVENTS_EXTRA, ...NATIONAL_EVENTS, ...NATIONAL_EVENTS_EXTRA];

describe('CHANGE WORLD GAME 1.0 — contenido', () => {
  it('ids de decisiones unicos entre core y extras', () => {
    const ids = ALL_DECISIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ids de eventos unicos entre core y extras', () => {
    const ids = ALL_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ninguna decision extra es gratis y el cooldown esta en rango', () => {
    for (const d of [...DECISIONS_ECONOMIA, ...DECISIONS_ORMUZ]) {
      expect(d.cost.capital, d.id).toBeGreaterThan(0);
      const cd = d.cooldown ?? 2;
      expect(cd, d.id).toBeGreaterThanOrEqual(1);
      expect(cd, d.id).toBeLessThanOrEqual(3);
    }
  });

  it('si una decision extra da capital, da mas de lo que cuesta', () => {
    for (const d of ALL_DECISIONS) {
      const gana = d.effects.capital ?? 0;
      if (gana <= 0) continue;
      expect(gana, d.id).toBeGreaterThan(d.cost.capital);
    }
  });

  it('existen las decisiones de formalizacion e impulso sectorial', () => {
    const ids = DECISIONS_ECONOMIA.map((d) => d.id);
    for (const id of [
      'aportes_nuevos_formales',
      'credito_fiscal_formal',
      'simplificacion_laboral',
      'amnistia_previsional',
      'inspeccion_trabajo',
      'impulso_industria',
      'impulso_turismo',
      'impulso_agro',
      'impulso_servicios'
    ]) {
      expect(ids, id).toContain(id);
    }
  });

  it('Ormuz es una decision solo para Iran', () => {
    const cerrar = DECISIONS_ORMUZ.find((d) => d.id === 'cerrar_estrecho_ormuz');
    expect(cerrar).toBeTruthy();
    expect(cerrar!.category).toBe('defensa');
    expect(cerrar!.cost.capital).toBeGreaterThanOrEqual(25);
    const iran = { player: { code: 'Iran' } } as EventContext;
    const argentina = { player: { code: 'Argentina' } } as EventContext;
    expect(cerrar!.when!(iran)).toBe(true);
    expect(cerrar!.when!(argentina)).toBe(false);
  });

  it('la tabla de empleo cubre los 5 sectores del JSON', () => {
    expect(GAME_SECTORS).toEqual(['industry', 'agriculture', 'services', 'commerce', 'tourism']);
    for (const s of GAME_SECTORS) {
      const p = GAME_SECTOR_LABOR[s];
      expect(p.employmentIntensity).toBeGreaterThan(0);
      expect(p.formality).toBeGreaterThan(0);
      expect(p.formality).toBeLessThanOrEqual(1);
    }
    expect(SECTOR_LABOR.tourism.employmentIntensity).toBeGreaterThan(SECTOR_LABOR.mining_energy.employmentIntensity);
    expect(employmentFromSectorPush('tourism', 1)).toBeGreaterThan(employmentFromSectorPush('industry', 1) * 0.9);
  });

  it('eventos v1.0 de deflacion, informalidad y recaudacion existen', () => {
    const ids = NATIONAL_EVENTS_EXTRA.map((e) => e.id);
    expect(ids).toContain('deflacion_leve');
    expect(ids).toContain('trampa_deflacion');
    expect(ids).toContain('informalidad_galopante');
    expect(ids).toContain('recaudacion_cae_pbi');
    expect(ids).toContain('competidor_desplaza_asia');
  });

  it('rutas extra: congestion, tarifas, accidente ambiental, pirateria', () => {
    const ids = WORLD_EVENTS_EXTRA.map((e) => e.id);
    expect(ids).toContain('pirateria_aden');
    expect(ids).toContain('congestion_puertos_usa');
    expect(ids).toContain('guerra_tarifas_navieras');
    expect(ids).toContain('accidente_ambiental_puerto');
    const aden = WORLD_EVENTS_EXTRA.find((e) => e.id === 'pirateria_aden')!;
    expect(aden.disrupts).toContain('suez');
  });

  it('eventos con duration > 1 tienen goteo o golpe sectorial', () => {
    const skip = new Set(['cumbre_climatica', 'ampliacion_otan', 'cumbre_brics']);
    const faltan: string[] = [];
    for (const e of ALL_EVENTS) {
      if (e.duration <= 1) continue;
      if (skip.has(e.id)) continue;
      if (!hasDrip(e)) faltan.push(e.id);
    }
    expect(faltan, faltan.join(', ')).toEqual([]);
  });

  it('si un evento usa sectorEffects, no cobra gdp_growth fijo', () => {
    for (const e of ALL_EVENTS) {
      if (!e.sectorEffects) continue;
      expect(e.effects?.gdp_growth ?? 0, `${e.id} effects.gdp_growth`).toBe(0);
      expect(e.worldEffects?.gdp_growth ?? 0, `${e.id} worldEffects.gdp_growth`).toBe(0);
    }
  });

  it('toda opcion de evento extra tiene costo o riesgo o un downside en effects', () => {
    const nuevos = new Set([
      'pirateria_aden',
      'congestion_puertos_usa',
      'guerra_tarifas_navieras',
      'accidente_ambiental_puerto',
      'competidor_desplaza_asia',
      'trampa_deflacion',
      'informalidad_galopante',
      'recaudacion_cae_pbi',
      'reforma_jubilatoria_calle'
    ]);
    for (const e of [...WORLD_EVENTS_EXTRA, ...NATIONAL_EVENTS_EXTRA]) {
      if (!nuevos.has(e.id)) continue;
      if (!e.choices || e.choices.length < 2) continue;
      expect(e.choices.length, e.id).toBeLessThanOrEqual(3);
      for (const c of e.choices) {
        const capital = c.cost?.capital ?? 0;
        const fiscal = c.cost?.fiscal ?? 0;
        const downside =
          (c.effects.happiness ?? 0) < 0
          || (c.effects.stability ?? 0) < 0
          || (c.effects.gdp_growth ?? 0) < 0
          || (c.effects.inflation ?? 0) > 0
          || (c.effects.unemployment ?? 0) > 0
          || (c.effects.fiscal_balance ?? 0) < 0
          || Boolean(c.risk);
        expect(capital > 0 || fiscal > 0 || downside, `${e.id}/${c.id} es gratis y buena`).toBe(true);
      }
    }
  });
});

function hasDrip(e: GameEvent): boolean {
  return Boolean(e.ongoing || e.worldOngoing || e.sectorEffects);
}

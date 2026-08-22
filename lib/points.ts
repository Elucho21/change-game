import data from './data/countries.gen.json';
import { CHOKEPOINTS } from './routes';
import type { Country, Layers, MapPoint } from './types';

/**
 * Puntos que se dibujan sobre el globo (capa `pointsData`).
 *
 * Cuatro fuentes:
 *  - capitales   → derivadas de los paises, no hay datos que cargar
 *  - chokepoints → lib/routes.ts, se pintan rojos cuando estan cerrados
 *  - puertos     → PENDIENTE, ver docs/PEDIDOS_A_GROK.md
 *  - aeropuertos → PENDIENTE, ver docs/PEDIDOS_A_GROK.md
 *
 * La UI ya consume las cuatro capas: cuando lleguen los datos de puertos y
 * aeropuertos alcanza con llenar los arrays de abajo, sin tocar el globo.
 */

const COUNTRIES = (data as unknown as { countries: Record<string, Country> }).countries;

/** Capitales: salen del mismo JSON de paises, con el PBI como peso. */
export const CAPITALS: MapPoint[] = Object.values(COUNTRIES).map((c) => ({
  id: `capital-${c.code}`,
  kind: 'capital',
  name: `${c.capital} (${c.name})`,
  lat: c.lat,
  lng: c.lng,
  country: c.code,
  weight: Math.min(1, c.economy.gdp_trillion_usd / 20),
  description: `Capital de ${c.name}`
}));

/**
 * Puertos principales. VACIO A PROPOSITO: los datos los carga Grok.
 * Formato esperado por elemento (ver docs/PEDIDOS_A_GROK.md):
 *   { id: 'puerto-santos', kind: 'puerto', name: 'Santos', lat: -23.96, lng: -46.33,
 *     country: 'Brazil', weight: 0.8, description: 'Mayor puerto de Sudamerica' }
 */
export const PORTS: MapPoint[] = [];

/** Aeropuertos principales. VACIO A PROPOSITO: los datos los carga Grok. */
export const AIRPORTS: MapPoint[] = [];

/** Chokepoints como puntos del mapa, con su estado de bloqueo. */
export function chokepointPoints(disruptions: Record<string, number>, turn: number): MapPoint[] {
  return CHOKEPOINTS.map((c) => {
    const closed = (disruptions[c.id] ?? 0) > turn;
    return {
      id: `chokepoint-${c.id}`,
      kind: 'chokepoint' as const,
      name: closed ? `${c.name} (CERRADO)` : c.name,
      lat: c.lat,
      lng: c.lng,
      weight: closed ? 1 : 0.5,
      description: c.description
    };
  });
}

export const POINT_COLORS: Record<MapPoint['kind'], string> = {
  capital: '#f5d76e',
  puerto: '#37c98a',
  aeropuerto: '#9b6cf5',
  chokepoint: '#7f8ea8'
};

/**
 * Todos los puntos visibles segun las capas activas.
 * `points` es la capa maestra: si esta apagada no se dibuja ningun punto.
 */
export function visiblePoints(
  layers: Layers,
  disruptions: Record<string, number>,
  turn: number
): MapPoint[] {
  if (!layers.points) return [];
  const out: MapPoint[] = [];
  if (layers.rutas) out.push(...chokepointPoints(disruptions, turn));
  if (layers.capitals) out.push(...CAPITALS);
  if (layers.ports) out.push(...PORTS);
  if (layers.airports) out.push(...AIRPORTS);
  return out;
}

/** Cuantos puntos hay cargados de cada tipo (para avisar en la UI si falta data). */
export const pointCounts = () => ({
  capitales: CAPITALS.length,
  chokepoints: CHOKEPOINTS.length,
  puertos: PORTS.length,
  aeropuertos: AIRPORTS.length
});

import type { Chokepoint, MaritimeRoute } from './types';

/**
 * Rutas maritimas reales y sus puntos de estrangulamiento.
 *
 * No son decoracion: cada ruta pasa por uno o mas chokepoints, y cuando un
 * evento cierra un chokepoint el comercio que depende de esa ruta cae y el
 * petroleo sube. Ver `disruptionFactor()` y los eventos con `disrupts` en
 * lib/events/world.ts.
 */

export const CHOKEPOINTS: Chokepoint[] = [
  {
    id: 'ormuz',
    name: 'Estrecho de Ormuz',
    lat: 26.57,
    lng: 56.25,
    oilShare: 0.2,
    description: 'Por aca sale una quinta parte del petroleo del mundo. Cerrarlo dispara el barril.'
  },
  {
    id: 'suez',
    name: 'Canal de Suez',
    lat: 30.02,
    lng: 32.55,
    oilShare: 0.08,
    description: 'Atajo entre Asia y Europa. Sin el, los buques rodean Africa y suman dos semanas.'
  },
  {
    id: 'malaca',
    name: 'Estrecho de Malaca',
    lat: 1.43,
    lng: 102.9,
    oilShare: 0.15,
    description: 'Cuello de botella del comercio asiatico. Un incidente aca frena a China entera.'
  },
  {
    id: 'panama',
    name: 'Canal de Panama',
    lat: 8.98,
    lng: -79.52,
    oilShare: 0.03,
    description: 'Une los dos oceanos. Las sequias bajan el calado y limitan el trafico.'
  },
  {
    id: 'gibraltar',
    name: 'Estrecho de Gibraltar',
    lat: 35.95,
    lng: -5.6,
    oilShare: 0.04,
    description: 'Puerta del Mediterraneo hacia el Atlantico.'
  }
];

export const MARITIME_ROUTES: MaritimeRoute[] = [
  {
    id: 'asia-europa',
    name: 'Asia → Europa (Malaca + Suez)',
    volume: 480,
    color: '#00e5ff',
    chokepoints: ['malaca', 'suez', 'gibraltar'],
    coords: [
      [31.23, 121.47], [22.32, 114.17], [1.29, 103.85], [5.6, 100.0],
      [12.65, 43.3], [29.95, 32.55], [35.9, 14.5], [51.92, 4.48]
    ]
  },
  {
    id: 'asia-uswest',
    name: 'Asia → Costa Oeste de EE.UU.',
    volume: 390,
    color: '#00ff9d',
    chokepoints: [],
    coords: [[31.23, 121.47], [35.4, 139.7], [34.05, -118.25]]
  },
  {
    id: 'asia-useast',
    name: 'Asia → Costa Este de EE.UU. (Panama)',
    volume: 220,
    color: '#ffaa00',
    chokepoints: ['panama'],
    coords: [[22.32, 114.17], [8.98, -79.52], [25.76, -80.19], [40.71, -74.01]]
  },
  {
    id: 'sudamerica-china',
    name: 'Sudamerica → China',
    volume: 180,
    color: '#a78bfa',
    chokepoints: ['malaca'],
    coords: [[-23.55, -46.63], [-34.9, -56.16], [-33.03, -71.63], [1.29, 103.85], [31.23, 121.47]]
  },
  {
    id: 'golfo-asia',
    name: 'Golfo Persico → Asia (Ormuz)',
    volume: 350,
    color: '#f97316',
    chokepoints: ['ormuz', 'malaca'],
    coords: [[26.57, 50.55], [26.57, 56.25], [25.2, 55.27], [1.29, 103.85], [22.32, 114.17]]
  },
  {
    id: 'sudamerica-europa',
    name: 'Sudamerica → Europa',
    volume: 160,
    color: '#38bdf8',
    chokepoints: ['gibraltar'],
    coords: [[-34.6, -58.37], [-23.55, -46.63], [14.7, -17.44], [35.95, -5.6], [43.35, -8.4], [51.92, 4.48]]
  }
];

export const chokepointById = (id: string) => CHOKEPOINTS.find((c) => c.id === id);

/** Una ruta esta interrumpida si alguno de sus chokepoints lo esta. */
export const routeDisrupted = (route: MaritimeRoute, disruptions: Record<string, number>, turn: number) =>
  route.chokepoints.some((c) => (disruptions[c] ?? 0) > turn);

/** Chokepoints cerrados en este turno. */
export const activeDisruptions = (disruptions: Record<string, number>, turn: number) =>
  CHOKEPOINTS.filter((c) => (disruptions[c.id] ?? 0) > turn);

/**
 * Cuanto se encarece / cae el comercio de larga distancia mientras hay
 * chokepoints cerrados. 1 = normal, 0.7 = perdiste el 30% del flujo.
 */
export function disruptionFactor(disruptions: Record<string, number>, turn: number) {
  const closed = activeDisruptions(disruptions, turn);
  if (!closed.length) return 1;
  const affected = MARITIME_ROUTES.filter((r) => routeDisrupted(r, disruptions, turn));
  const lost = affected.reduce((s, r) => s + r.volume, 0);
  const total = MARITIME_ROUTES.reduce((s, r) => s + r.volume, 0);
  return Math.max(0.55, 1 - (lost / total) * 0.45);
}

/** Cuanto sube el barril por turno mientras los chokepoints petroleros esten cerrados. */
export function oilShock(disruptions: Record<string, number>, turn: number) {
  return activeDisruptions(disruptions, turn).reduce((s, c) => s + c.oilShare * 60, 0);
}

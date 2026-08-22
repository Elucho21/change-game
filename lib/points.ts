/**
 * Puntos del globo: capitales, puertos y aeropuertos del MVP + hubs globales.
 *
 * Datos puros, sin logica de juego. GlobeView los dibuja; el store decide
 * que capas se ven. Claude debe sumar a `Layers` (lib/store.ts):
 *   capitales: true, puertos: true, aeropuertos: true
 * Hasta que existan como boolean, GlobeView usa un fallback local.
 */

export type PointType = 'capital' | 'port' | 'airport';

export interface MapPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: PointType;
  country: string;
  importance: 1 | 2 | 3;
}

/** Capas de puntos. Contrato que Claude tiene que espejar en `Layers`. */
export type PointLayer = 'capitales' | 'puertos' | 'aeropuertos';

export const DEFAULT_POINT_LAYERS: Record<PointLayer, boolean> = {
  capitales: true,
  puertos: true,
  aeropuertos: true
};

export const POINT_COLORS: Record<PointType, string> = {
  capital: '#f5d76e',
  port: '#7dd3fc',
  airport: '#c4b5fd'
};

export const POINT_TYPE_LABEL: Record<PointType, string> = {
  capital: 'Capital',
  port: 'Puerto',
  airport: 'Aeropuerto'
};

export const POINT_LAYER_BY_TYPE: Record<PointType, PointLayer> = {
  capital: 'capitales',
  port: 'puertos',
  airport: 'aeropuertos'
};

/** Radio en el globo: importancia 1 ~ 0.28, 3 ~ 0.52. */
export function pointRadius(p: MapPoint): number {
  return 0.16 + p.importance * 0.12;
}

export function pointTooltipHtml(p: MapPoint): string {
  return `<div style="padding:6px 9px;background:#0e1524ee;border:1px solid #1e293f;border-radius:8px;font-size:12px;color:#e6ecf7;min-width:150px">
    <b>${p.name}</b>
    <div style="color:#8c99b3;margin-top:3px">${POINT_TYPE_LABEL[p.type]} · importancia ${p.importance}</div>
  </div>`;
}

export function filterMapPoints(points: MapPoint[], layers: Record<PointLayer, boolean>): MapPoint[] {
  return points.filter((p) => layers[POINT_LAYER_BY_TYPE[p.type]]);
}

export function pointsByCountry(code: string): MapPoint[] {
  return MAP_POINTS.filter((p) => p.country === code);
}

export function hasMajorPort(code: string): boolean {
  return MAP_POINTS.some((p) => p.country === code && p.type === 'port' && p.importance >= 2);
}

function pt(
  id: string,
  name: string,
  lat: number,
  lng: number,
  type: PointType,
  country: string,
  importance: 1 | 2 | 3
): MapPoint {
  return { id, name, lat, lng, type, country, importance };
}

/** Capitales: mismas coordenadas que countries.gen.json para que coincidan con el pais. */
const CAPITALS: MapPoint[] = [
  pt('cap-usa', 'Washington D.C.', 38.9, -77, 'capital', 'USA', 3),
  pt('cap-china', 'Beijing', 39.9, 116.4, 'capital', 'China', 3),
  pt('cap-russia', 'Moscow', 55.8, 37.6, 'capital', 'Russia', 3),
  pt('cap-japan', 'Tokyo', 35.7, 139.7, 'capital', 'Japan', 3),
  pt('cap-sk', 'Seoul', 37.6, 127, 'capital', 'SouthKorea', 2),
  pt('cap-nk', 'Pyongyang', 39, 125.8, 'capital', 'NorthKorea', 1),
  pt('cap-uk', 'London', 51.5, -0.13, 'capital', 'UK', 3),
  pt('cap-france', 'Paris', 48.9, 2.35, 'capital', 'France', 3),
  pt('cap-germany', 'Berlin', 52.5, 13.4, 'capital', 'Germany', 3),
  pt('cap-spain', 'Madrid', 40.4, -3.7, 'capital', 'Spain', 2),
  pt('cap-canada', 'Ottawa', 45.4, -75.7, 'capital', 'Canada', 2),
  pt('cap-mexico', 'Mexico City', 19.4, -99.1, 'capital', 'Mexico', 2),
  pt('cap-brazil', 'Brasilia', -15.8, -47.9, 'capital', 'Brazil', 3),
  pt('cap-argentina', 'Buenos Aires', -34.6, -58.4, 'capital', 'Argentina', 2),
  pt('cap-chile', 'Santiago', -33.4, -70.7, 'capital', 'Chile', 2),
  pt('cap-colombia', 'Bogota', 4.7, -74.1, 'capital', 'Colombia', 2),
  pt('cap-peru', 'Lima', -12, -77, 'capital', 'Peru', 2),
  pt('cap-venezuela', 'Caracas', 10.5, -66.9, 'capital', 'Venezuela', 1),
  pt('cap-ecuador', 'Quito', -0.2, -78.5, 'capital', 'Ecuador', 1),
  pt('cap-bolivia', 'La Paz', -16.5, -68.1, 'capital', 'Bolivia', 1),
  pt('cap-paraguay', 'Asuncion', -25.3, -57.6, 'capital', 'Paraguay', 1),
  pt('cap-uruguay', 'Montevideo', -34.9, -56.2, 'capital', 'Uruguay', 1),
  pt('cap-guyana', 'Georgetown', 6.8, -58.2, 'capital', 'Guyana', 1),
  pt('cap-suriname', 'Paramaribo', 5.9, -55.2, 'capital', 'Suriname', 1)
];

const PORTS: MapPoint[] = [
  pt('port-la', 'Los Angeles', 33.74, -118.27, 'port', 'USA', 3),
  pt('port-ny', 'Nueva York / Newark', 40.68, -74.02, 'port', 'USA', 3),
  pt('port-shanghai', 'Shanghai', 31.23, 121.47, 'port', 'China', 3),
  pt('port-shenzhen', 'Shenzhen', 22.5, 113.9, 'port', 'China', 3),
  pt('port-novorossiysk', 'Novorossiysk', 44.72, 37.77, 'port', 'Russia', 2),
  pt('port-yokohama', 'Yokohama', 35.45, 139.65, 'port', 'Japan', 2),
  pt('port-busan', 'Busan', 35.1, 129.04, 'port', 'SouthKorea', 3),
  pt('port-nampo', 'Nampo', 38.73, 125.41, 'port', 'NorthKorea', 1),
  pt('port-felixstowe', 'Felixstowe', 51.96, 1.35, 'port', 'UK', 2),
  pt('port-lehavre', 'Le Havre', 49.49, 0.11, 'port', 'France', 2),
  pt('port-hamburg', 'Hamburgo', 53.54, 9.98, 'port', 'Germany', 3),
  pt('port-algeciras', 'Algeciras', 36.13, -5.43, 'port', 'Spain', 2),
  pt('port-valencia', 'Valencia', 39.45, -0.32, 'port', 'Spain', 2),
  pt('port-vancouver', 'Vancouver', 49.29, -123.11, 'port', 'Canada', 2),
  pt('port-manzanillo', 'Manzanillo', 19.05, -104.32, 'port', 'Mexico', 2),
  pt('port-santos', 'Santos', -23.95, -46.33, 'port', 'Brazil', 3),
  pt('port-bsas', 'Buenos Aires', -34.6, -58.37, 'port', 'Argentina', 2),
  pt('port-valparaiso', 'Valparaiso', -33.04, -71.63, 'port', 'Chile', 2),
  pt('port-cartagena', 'Cartagena', 10.4, -75.53, 'port', 'Colombia', 2),
  pt('port-callao', 'Callao', -12.05, -77.14, 'port', 'Peru', 2),
  pt('port-cabello', 'Puerto Cabello', 10.48, -68.01, 'port', 'Venezuela', 1),
  pt('port-guayaquil', 'Guayaquil', -2.28, -79.9, 'port', 'Ecuador', 1),
  pt('port-villeta', 'Villeta', -25.38, -57.56, 'port', 'Paraguay', 1),
  pt('port-montevideo', 'Montevideo', -34.9, -56.21, 'port', 'Uruguay', 1),
  pt('port-georgetown', 'Georgetown', 6.81, -58.17, 'port', 'Guyana', 1),
  pt('port-paramaribo', 'Paramaribo', 5.83, -55.15, 'port', 'Suriname', 1),
  // hubs globales fuera del MVP: Claude puede mapearlos cuando sume paises
  pt('port-singapore', 'Singapur', 1.29, 103.85, 'port', 'Singapore', 3),
  pt('port-rotterdam', 'Rotterdam', 51.92, 4.48, 'port', 'Netherlands', 3),
  pt('port-jebelali', 'Jebel Ali (Dubai)', 25.01, 55.06, 'port', 'UAE', 3)
];

const AIRPORTS: MapPoint[] = [
  pt('air-iad', 'Dulles (IAD)', 38.95, -77.46, 'airport', 'USA', 2),
  pt('air-jfk', 'JFK', 40.64, -73.78, 'airport', 'USA', 3),
  pt('air-lax', 'Los Angeles (LAX)', 33.94, -118.41, 'airport', 'USA', 3),
  pt('air-pek', 'Beijing (PEK)', 40.08, 116.58, 'airport', 'China', 3),
  pt('air-pvg', 'Shanghai (PVG)', 31.14, 121.81, 'airport', 'China', 3),
  pt('air-svo', 'Sheremetyevo (SVO)', 55.97, 37.41, 'airport', 'Russia', 2),
  pt('air-hnd', 'Haneda (HND)', 35.55, 139.78, 'airport', 'Japan', 3),
  pt('air-icn', 'Incheon (ICN)', 37.46, 126.44, 'airport', 'SouthKorea', 3),
  pt('air-fnj', 'Pyongyang (FNJ)', 39.05, 125.78, 'airport', 'NorthKorea', 1),
  pt('air-lhr', 'Heathrow (LHR)', 51.47, -0.45, 'airport', 'UK', 3),
  pt('air-cdg', 'Charles de Gaulle (CDG)', 49.01, 2.55, 'airport', 'France', 3),
  pt('air-fra', 'Frankfurt (FRA)', 50.04, 8.57, 'airport', 'Germany', 3),
  pt('air-mad', 'Madrid (MAD)', 40.47, -3.56, 'airport', 'Spain', 2),
  pt('air-yyz', 'Toronto (YYZ)', 43.68, -79.63, 'airport', 'Canada', 2),
  pt('air-mex', 'Mexico (MEX)', 19.44, -99.07, 'airport', 'Mexico', 2),
  pt('air-gru', 'Guarulhos (GRU)', -23.43, -46.47, 'airport', 'Brazil', 3),
  pt('air-eze', 'Ezeiza (EZE)', -34.82, -58.54, 'airport', 'Argentina', 2),
  pt('air-scl', 'Santiago (SCL)', -33.39, -70.79, 'airport', 'Chile', 2),
  pt('air-bog', 'El Dorado (BOG)', 4.7, -74.14, 'airport', 'Colombia', 2),
  pt('air-lim', 'Jorge Chavez (LIM)', -12.02, -77.11, 'airport', 'Peru', 2),
  pt('air-ccs', 'Maiquetia (CCS)', 10.6, -67, 'airport', 'Venezuela', 1),
  pt('air-uio', 'Quito (UIO)', -0.13, -78.36, 'airport', 'Ecuador', 1),
  pt('air-lpb', 'El Alto (LPB)', -16.51, -68.19, 'airport', 'Bolivia', 1),
  pt('air-asu', 'Silvio Pettirossi (ASU)', -25.24, -57.52, 'airport', 'Paraguay', 1),
  pt('air-mvd', 'Carrasco (MVD)', -34.84, -56.03, 'airport', 'Uruguay', 1),
  pt('air-geo', 'Cheddi Jagan (GEO)', 6.5, -58.25, 'airport', 'Guyana', 1),
  pt('air-pbm', 'Zanderij (PBM)', 5.45, -55.19, 'airport', 'Suriname', 1),
  pt('air-dxb', 'Dubai (DXB)', 25.25, 55.36, 'airport', 'UAE', 3),
  pt('air-sin', 'Changi (SIN)', 1.36, 103.99, 'airport', 'Singapore', 3),
  pt('air-ams', 'Schiphol (AMS)', 52.31, 4.77, 'airport', 'Netherlands', 3)
];

export const MAP_POINTS: MapPoint[] = [...CAPITALS, ...PORTS, ...AIRPORTS];

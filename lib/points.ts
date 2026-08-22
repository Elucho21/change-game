import data from './data/countries.gen.json';
import { CHOKEPOINTS } from './routes';
import type { Country, Layers, MapPoint } from './types';

/**
 * Puntos que se dibujan sobre el globo (capa `pointsData`).
 *
 * Cuatro fuentes:
 *  - capitales   → derivadas de los paises, no hay datos que cargar
 *  - chokepoints → lib/routes.ts, se pintan rojos cuando estan cerrados
 *  - puertos     → PORTS (este archivo)
 *  - aeropuertos → AIRPORTS (este archivo)
 *
 * La UI ya consume las cuatro capas. Sumar un puerto o aeropuerto es
 * agregar un elemento al array; no hay que tocar el globo.
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
 * Puertos principales del MVP. Sudamerica cubierta primero (es donde
 * transcurre la mayoria de las partidas); el resto, los que mueven el
 * comercio de los 24 paises. Hubs fuera del JSON (Singapur, Rotterdam,
 * Dubai) van sin `country` hasta que esos paises entren en Fase 4.
 */
export const PORTS: MapPoint[] = [
  // --- Sudamerica ---
  { id: 'puerto-santos', kind: 'puerto', name: 'Santos', lat: -23.96, lng: -46.33, country: 'Brazil', weight: 0.9, description: 'Mayor puerto de America Latina: soja, cafe y contenedores.' },
  { id: 'puerto-paranagua', kind: 'puerto', name: 'Paranagua', lat: -25.52, lng: -48.51, country: 'Brazil', weight: 0.55, description: 'Salida cerealera del sur de Brasil hacia Asia.' },
  { id: 'puerto-rio', kind: 'puerto', name: 'Rio de Janeiro', lat: -22.9, lng: -43.17, country: 'Brazil', weight: 0.5, description: 'Hub de contenedores y petroleo de la costa este brasilena.' },
  { id: 'puerto-buenosaires', kind: 'puerto', name: 'Buenos Aires', lat: -34.6, lng: -58.37, country: 'Argentina', weight: 0.7, description: 'Principal puerto argentino: granos, autos y contenedores.' },
  { id: 'puerto-rosario', kind: 'puerto', name: 'Rosario', lat: -32.94, lng: -60.64, country: 'Argentina', weight: 0.5, description: 'Puerto fluvial del Parana. Sale buena parte de la soja mundial.' },
  { id: 'puerto-callao', kind: 'puerto', name: 'Callao', lat: -12.05, lng: -77.15, country: 'Peru', weight: 0.65, description: 'Salida del Pacifico peruano: minerales, pesca y contenedores.' },
  { id: 'puerto-sanantonio', kind: 'puerto', name: 'San Antonio', lat: -33.59, lng: -71.61, country: 'Chile', weight: 0.6, description: 'Mayor puerto chileno de contenedores, sobre la ruta a Asia.' },
  { id: 'puerto-valparaiso', kind: 'puerto', name: 'Valparaiso', lat: -33.04, lng: -71.63, country: 'Chile', weight: 0.45, description: 'Puerto historico del Pacifico sur, complementa a San Antonio.' },
  { id: 'puerto-cartagena', kind: 'puerto', name: 'Cartagena', lat: 10.4, lng: -75.53, country: 'Colombia', weight: 0.6, description: 'Hub caribeno: transbordo hacia Panama, EE.UU. y Europa.' },
  { id: 'puerto-buenaventura', kind: 'puerto', name: 'Buenaventura', lat: 3.89, lng: -77.07, country: 'Colombia', weight: 0.5, description: 'Unica gran salida colombiana al Pacifico.' },
  { id: 'puerto-montevideo', kind: 'puerto', name: 'Montevideo', lat: -34.9, lng: -56.21, country: 'Uruguay', weight: 0.45, description: 'Hub del Rio de la Plata y puerta de Paraguay al mar.' },
  { id: 'puerto-guayaquil', kind: 'puerto', name: 'Guayaquil', lat: -2.28, lng: -79.9, country: 'Ecuador', weight: 0.5, description: 'Puerto bananero y camaronero; el 80% del comercio ecuatoriano.' },
  { id: 'puerto-cabello', kind: 'puerto', name: 'Puerto Cabello', lat: 10.48, lng: -68.01, country: 'Venezuela', weight: 0.4, description: 'Principal puerto venezolano de carga general y petroleo.' },
  { id: 'puerto-georgetown', kind: 'puerto', name: 'Georgetown', lat: 6.81, lng: -58.17, country: 'Guyana', weight: 0.25, description: 'Salida del petroestado emergente hacia el Caribe y Europa.' },
  { id: 'puerto-paramaribo', kind: 'puerto', name: 'Paramaribo', lat: 5.83, lng: -55.15, country: 'Suriname', weight: 0.2, description: 'Unico puerto de ultramar de Surinam.' },
  { id: 'puerto-villeta', kind: 'puerto', name: 'Villeta', lat: -25.38, lng: -57.56, country: 'Paraguay', weight: 0.25, description: 'Puerto fluvial sobre el Paraguay; la carga sale por Montevideo.' },
  // --- Norteamerica ---
  { id: 'puerto-losangeles', kind: 'puerto', name: 'Los Angeles', lat: 33.74, lng: -118.27, country: 'USA', weight: 1, description: 'Mayor puerta de EE.UU. al comercio con Asia.' },
  { id: 'puerto-newyork', kind: 'puerto', name: 'Nueva York / Newark', lat: 40.68, lng: -74.02, country: 'USA', weight: 0.95, description: 'Hub de la costa este: Europa, Mediterraneo y Sudamerica.' },
  { id: 'puerto-houston', kind: 'puerto', name: 'Houston', lat: 29.73, lng: -95.27, country: 'USA', weight: 0.75, description: 'Puerto energetico del Golfo de Mexico: crudo, gas y quimicos.' },
  { id: 'puerto-vancouver', kind: 'puerto', name: 'Vancouver', lat: 49.29, lng: -123.11, country: 'Canada', weight: 0.65, description: 'Salida canadiense al Pacifico: grano, carbon y contenedores.' },
  { id: 'puerto-montreal', kind: 'puerto', name: 'Montreal', lat: 45.5, lng: -73.55, country: 'Canada', weight: 0.5, description: 'Puerto interior del San Lorenzo hacia Europa.' },
  { id: 'puerto-manzanillo', kind: 'puerto', name: 'Manzanillo', lat: 19.05, lng: -104.32, country: 'Mexico', weight: 0.65, description: 'Mayor puerto mexicano del Pacifico, conectado a Asia.' },
  { id: 'puerto-veracruz', kind: 'puerto', name: 'Veracruz', lat: 19.2, lng: -96.13, country: 'Mexico', weight: 0.45, description: 'Puerto historico del Golfo: autos, granos y T-MEC.' },
  // --- Europa y Asia del MVP ---
  { id: 'puerto-hamburg', kind: 'puerto', name: 'Hamburgo', lat: 53.54, lng: 9.98, country: 'Germany', weight: 0.8, description: 'Principal puerto aleman y hub del norte de Europa.' },
  { id: 'puerto-felixstowe', kind: 'puerto', name: 'Felixstowe', lat: 51.96, lng: 1.35, country: 'UK', weight: 0.6, description: 'Mayor puerto de contenedores del Reino Unido.' },
  { id: 'puerto-lehavre', kind: 'puerto', name: 'Le Havre', lat: 49.49, lng: 0.11, country: 'France', weight: 0.55, description: 'Puerta maritima de Paris hacia el Atlantico.' },
  { id: 'puerto-marseille', kind: 'puerto', name: 'Marsella', lat: 43.34, lng: 5.33, country: 'France', weight: 0.5, description: 'Salida francesa al Mediterraneo y al canal de Suez.' },
  { id: 'puerto-algeciras', kind: 'puerto', name: 'Algeciras', lat: 36.13, lng: -5.43, country: 'Spain', weight: 0.7, description: 'Hub de transbordo junto a Gibraltar, entre Atlantico y Mediterraneo.' },
  { id: 'puerto-valencia', kind: 'puerto', name: 'Valencia', lat: 39.45, lng: -0.32, country: 'Spain', weight: 0.6, description: 'Mayor puerto de contenedores de Espana.' },
  { id: 'puerto-shanghai', kind: 'puerto', name: 'Shanghai', lat: 31.23, lng: 121.47, country: 'China', weight: 1, description: 'El puerto de contenedores mas grande del mundo.' },
  { id: 'puerto-shenzhen', kind: 'puerto', name: 'Shenzhen', lat: 22.5, lng: 113.9, country: 'China', weight: 0.9, description: 'Hub del delta del Perla, frente a Hong Kong.' },
  { id: 'puerto-busan', kind: 'puerto', name: 'Busan', lat: 35.1, lng: 129.04, country: 'SouthKorea', weight: 0.85, description: 'Mayor puerto coreano y transbordo del noreste asiatico.' },
  { id: 'puerto-yokohama', kind: 'puerto', name: 'Yokohama', lat: 35.45, lng: 139.65, country: 'Japan', weight: 0.75, description: 'Puerto de la bahia de Tokio: autos, electronica y energia.' },
  { id: 'puerto-novorossiysk', kind: 'puerto', name: 'Novorossiysk', lat: 44.72, lng: 37.77, country: 'Russia', weight: 0.5, description: 'Principal puerto ruso de granos y crudo sobre el Mar Negro.' },
  { id: 'puerto-nampo', kind: 'puerto', name: 'Nampo', lat: 38.73, lng: 125.41, country: 'NorthKorea', weight: 0.2, description: 'Salida maritima de Pyongyang; trafico limitado y controlado.' },
  // --- Hubs globales fuera del MVP (sin country hasta Fase 4) ---
  { id: 'puerto-singapur', kind: 'puerto', name: 'Singapur', lat: 1.29, lng: 103.85, country: 'Singapore', weight: 1, description: 'Hub de transbordo de Malaca. El comercio Asia-Europa pasa por aca.' },
  { id: 'puerto-rotterdam', kind: 'puerto', name: 'Rotterdam', lat: 51.92, lng: 4.48, country: 'Netherlands', weight: 0.95, description: 'Mayor puerto de Europa y terminal de las rutas Asia-Europa.' },
  { id: 'puerto-jebelali', kind: 'puerto', name: 'Jebel Ali', lat: 25.01, lng: 55.06, country: 'UAE', weight: 0.85, description: 'Hub del Golfo, junto a Ormuz. Reexporta hacia Asia y Africa.' }
];

/** Aeropuertos: hubs internacionales de los 24 paises, weight por trafico. */
export const AIRPORTS: MapPoint[] = [
  { id: 'aeropuerto-jfk', kind: 'aeropuerto', name: 'JFK', lat: 40.64, lng: -73.78, country: 'USA', weight: 0.95, description: 'Hub transatlantico de Nueva York.' },
  { id: 'aeropuerto-lax', kind: 'aeropuerto', name: 'Los Angeles (LAX)', lat: 33.94, lng: -118.41, country: 'USA', weight: 0.9, description: 'Puerta aerea de EE.UU. hacia Asia y el Pacifico.' },
  { id: 'aeropuerto-iad', kind: 'aeropuerto', name: 'Dulles (IAD)', lat: 38.95, lng: -77.46, country: 'USA', weight: 0.55, description: 'Aeropuerto internacional de Washington.' },
  { id: 'aeropuerto-pek', kind: 'aeropuerto', name: 'Beijing (PEK)', lat: 40.08, lng: 116.58, country: 'China', weight: 0.9, description: 'Hub politico y de largo radio de China.' },
  { id: 'aeropuerto-pvg', kind: 'aeropuerto', name: 'Shanghai (PVG)', lat: 31.14, lng: 121.81, country: 'China', weight: 0.95, description: 'Mayor hub de carga aerea de Asia.' },
  { id: 'aeropuerto-hnd', kind: 'aeropuerto', name: 'Haneda (HND)', lat: 35.55, lng: 139.78, country: 'Japan', weight: 0.9, description: 'Aeropuerto urbano de Tokio, mixto domestico e internacional.' },
  { id: 'aeropuerto-icn', kind: 'aeropuerto', name: 'Incheon (ICN)', lat: 37.46, lng: 126.44, country: 'SouthKorea', weight: 0.85, description: 'Hub de transbordo de Corea del Sur hacia America y Europa.' },
  { id: 'aeropuerto-fnj', kind: 'aeropuerto', name: 'Pyongyang (FNJ)', lat: 39.05, lng: 125.78, country: 'NorthKorea', weight: 0.15, description: 'Unica puerta aerea internacional de Corea del Norte.' },
  { id: 'aeropuerto-lhr', kind: 'aeropuerto', name: 'Heathrow (LHR)', lat: 51.47, lng: -0.45, country: 'UK', weight: 1, description: 'El hub europeo de largo radio mas conectado del mundo.' },
  { id: 'aeropuerto-cdg', kind: 'aeropuerto', name: 'Charles de Gaulle (CDG)', lat: 49.01, lng: 2.55, country: 'France', weight: 0.9, description: 'Hub de Air France y puerta de Europa al Africa francofona.' },
  { id: 'aeropuerto-fra', kind: 'aeropuerto', name: 'Frankfurt (FRA)', lat: 50.04, lng: 8.57, country: 'Germany', weight: 0.9, description: 'Hub de Lufthansa y principal aeropuerto de carga de Europa.' },
  { id: 'aeropuerto-mad', kind: 'aeropuerto', name: 'Madrid (MAD)', lat: 40.47, lng: -3.56, country: 'Spain', weight: 0.7, description: 'Puente aereo entre Europa y America Latina.' },
  { id: 'aeropuerto-yyz', kind: 'aeropuerto', name: 'Toronto (YYZ)', lat: 43.68, lng: -79.63, country: 'Canada', weight: 0.75, description: 'Hub de Air Canada hacia EE.UU., Europa y Asia.' },
  { id: 'aeropuerto-mex', kind: 'aeropuerto', name: 'Mexico (MEX)', lat: 19.44, lng: -99.07, country: 'Mexico', weight: 0.7, description: 'Hub de LATAM norte: T-MEC y conexiones con Sudamerica.' },
  { id: 'aeropuerto-gru', kind: 'aeropuerto', name: 'Guarulhos (GRU)', lat: -23.43, lng: -46.47, country: 'Brazil', weight: 0.8, description: 'Mayor aeropuerto de Sudamerica, hub de Sao Paulo.' },
  { id: 'aeropuerto-ezeiza', kind: 'aeropuerto', name: 'Ezeiza (EZE)', lat: -34.82, lng: -58.54, country: 'Argentina', weight: 0.6, description: 'Aeropuerto internacional de Buenos Aires.' },
  { id: 'aeropuerto-scl', kind: 'aeropuerto', name: 'Santiago (SCL)', lat: -33.39, lng: -70.79, country: 'Chile', weight: 0.55, description: 'Hub del Cono Sur hacia Oceania y el Pacifico.' },
  { id: 'aeropuerto-bog', kind: 'aeropuerto', name: 'El Dorado (BOG)', lat: 4.7, lng: -74.14, country: 'Colombia', weight: 0.55, description: 'Hub andino: puente entre Sudamerica, EE.UU. y Europa.' },
  { id: 'aeropuerto-lim', kind: 'aeropuerto', name: 'Jorge Chavez (LIM)', lat: -12.02, lng: -77.11, country: 'Peru', weight: 0.55, description: 'Hub del Pacifico sudamericano.' },
  { id: 'aeropuerto-ccs', kind: 'aeropuerto', name: 'Maiquetia (CCS)', lat: 10.6, lng: -67, country: 'Venezuela', weight: 0.35, description: 'Aeropuerto internacional de Caracas.' },
  { id: 'aeropuerto-uio', kind: 'aeropuerto', name: 'Quito (UIO)', lat: -0.13, lng: -78.36, country: 'Ecuador', weight: 0.3, description: 'Hub andino de Ecuador, a 2800 m de altura.' },
  { id: 'aeropuerto-lpb', kind: 'aeropuerto', name: 'El Alto (LPB)', lat: -16.51, lng: -68.19, country: 'Bolivia', weight: 0.3, description: 'Aeropuerto de La Paz, uno de los mas altos del mundo.' },
  { id: 'aeropuerto-asu', kind: 'aeropuerto', name: 'Silvio Pettirossi (ASU)', lat: -25.24, lng: -57.52, country: 'Paraguay', weight: 0.25, description: 'Unica puerta aerea internacional de Asuncion.' },
  { id: 'aeropuerto-mvd', kind: 'aeropuerto', name: 'Carrasco (MVD)', lat: -34.84, lng: -56.03, country: 'Uruguay', weight: 0.35, description: 'Aeropuerto internacional de Montevideo.' },
  { id: 'aeropuerto-geo', kind: 'aeropuerto', name: 'Cheddi Jagan (GEO)', lat: 6.5, lng: -58.25, country: 'Guyana', weight: 0.2, description: 'Puerta aerea de Georgetown hacia el Caribe y EE.UU.' },
  { id: 'aeropuerto-pbm', kind: 'aeropuerto', name: 'Zanderij (PBM)', lat: 5.45, lng: -55.19, country: 'Suriname', weight: 0.18, description: 'Aeropuerto internacional de Paramaribo.' },
  { id: 'aeropuerto-svo', kind: 'aeropuerto', name: 'Sheremetyevo (SVO)', lat: 55.97, lng: 37.41, country: 'Russia', weight: 0.7, description: 'Hub de Aeroflot en Moscu.' },
  { id: 'aeropuerto-dxb', kind: 'aeropuerto', name: 'Dubai (DXB)', lat: 25.25, lng: 55.36, country: 'UAE', weight: 0.95, description: 'Hub global del Golfo. Conecta Europa, Asia y Africa.' },
  { id: 'aeropuerto-sin', kind: 'aeropuerto', name: 'Changi (SIN)', lat: 1.36, lng: 103.99, country: 'Singapore', weight: 0.85, description: 'Hub de transbordo de Malaca, junto al estrecho.' }
];

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

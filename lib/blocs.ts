import type { Bloc } from './types';

/** Alianzas, uniones aduaneras y foros politicos del MVP.
 *  Solo se listan los miembros que existen en countries_mvp.json. */
export const BLOCS: Bloc[] = [
  {
    id: 'otan',
    name: 'Organizacion del Tratado del Atlantico Norte',
    short: 'OTAN',
    type: 'militar',
    color: '#4f7cff',
    founded: 1949,
    members: ['USA', 'Canada', 'UK', 'France', 'Germany', 'Spain'],
    candidates: [],
    rivals: ['Russia', 'China', 'NorthKorea'],
    cohesion: 72,
    description:
      'Alianza militar del Atlantico Norte. El articulo 5 convierte un ataque a un miembro en un ataque a todos.',
    effects: { securityBonus: 25, techBonus: 4 },
    rules: [
      'Defensa colectiva: un ataque a un miembro escala la tension de todo el bloque.',
      'Meta de gasto militar del 2% del PBI; incumplirla baja la cohesion.',
      'Ingresar exige relacion >= +40 con todos los miembros y tensa con Rusia y China.'
    ]
  },
  {
    id: 'mercosur',
    name: 'Mercado Comun del Sur',
    short: 'MERCOSUR',
    type: 'aduanera',
    color: '#37c98a',
    founded: 1991,
    members: ['Brazil', 'Argentina', 'Uruguay', 'Paraguay', 'Bolivia'],
    candidates: ['Chile', 'Peru', 'Ecuador', 'Colombia'],
    rivals: [],
    cohesion: 54,
    description:
      'Union aduanera sudamericana: arancel cero entre socios y arancel externo comun frente al resto del mundo.',
    effects: { tradeBonus: 0.5, internalTariff: 0, externalTariff: 14 },
    rules: [
      'Arancel 0% entre socios: mas comercio y crecimiento, menos margen para proteger industria propia.',
      'Arancel externo comun: no podes firmar acuerdos bilaterales sin el visto bueno del bloque.',
      'Salir del bloque cuesta crecimiento y relaciones con todos los socios.'
    ]
  },
  {
    id: 'ue',
    name: 'Union Europea',
    short: 'UE',
    type: 'aduanera',
    color: '#f0c419',
    founded: 1993,
    members: ['France', 'Germany', 'Spain'],
    candidates: [],
    rivals: [],
    cohesion: 78,
    description:
      'Mercado unico y union aduanera con moneda comun. Reglas fiscales estrictas y ancla nominal fuerte.',
    effects: { tradeBonus: 0.6, internalTariff: 0, externalTariff: 5, inflationDrag: 0.3, techBonus: 6 },
    rules: [
      'Deficit fiscal maximo del 3% del PBI: pasarse activa presion de Bruselas.',
      'Ancla nominal: la inflacion converge mas rapido, pero perdes politica monetaria propia.',
      'Las decisiones comerciales se negocian en bloque.'
    ]
  },
  {
    id: 'brics',
    name: 'BRICS+',
    short: 'BRICS',
    type: 'economica',
    color: '#e0603a',
    founded: 2009,
    members: ['Brazil', 'Russia', 'China'],
    candidates: ['Argentina', 'Venezuela', 'Bolivia'],
    rivals: ['USA'],
    cohesion: 48,
    description:
      'Bloque de economias emergentes con agenda de desdolarizacion, banco de desarrollo y comercio en monedas locales.',
    effects: { tradeBonus: 0.35, techBonus: 3 },
    rules: [
      'Acceso a financiamiento alternativo: menos presion de deuda, mas distancia con Washington.',
      'Comercio en monedas locales: amortigua los shocks del dolar.',
      'Ingresar tensa la relacion con Estados Unidos.'
    ]
  },
  {
    id: 'tmec',
    name: 'Tratado entre Mexico, Estados Unidos y Canada',
    short: 'T-MEC',
    type: 'aduanera',
    color: '#5ac8fa',
    founded: 2020,
    members: ['USA', 'Canada', 'Mexico'],
    candidates: [],
    rivals: [],
    cohesion: 66,
    description: 'Zona de libre comercio norteamericana con reglas de origen duras para la industria automotriz.',
    effects: { tradeBonus: 0.55, internalTariff: 0, externalTariff: 8 },
    rules: [
      'Reglas de origen: el contenido regional decide si un producto entra sin arancel.',
      'Revision periodica del tratado: si la relacion con Estados Unidos se degrada, cae la cohesion.'
    ]
  },
  {
    id: 'pacifico',
    name: 'Alianza del Pacifico',
    short: 'AP',
    type: 'economica',
    color: '#9b6cf5',
    founded: 2011,
    members: ['Chile', 'Colombia', 'Peru', 'Mexico'],
    candidates: ['Ecuador', 'Paraguay'],
    rivals: [],
    cohesion: 61,
    description: 'Bloque de integracion profunda orientado al comercio con Asia-Pacifico.',
    effects: { tradeBonus: 0.4, internalTariff: 2, externalTariff: 6 },
    rules: [
      'Apertura comercial agresiva: mas crecimiento, mas exposicion a shocks externos.',
      'Compatible con acuerdos bilaterales propios.'
    ]
  },
  {
    id: 'can',
    name: 'Comunidad Andina',
    short: 'CAN',
    type: 'aduanera',
    color: '#f5a623',
    founded: 1969,
    members: ['Bolivia', 'Colombia', 'Ecuador', 'Peru'],
    candidates: ['Chile', 'Venezuela'],
    rivals: [],
    cohesion: 45,
    description: 'Union aduanera andina con libre circulacion parcial de bienes y personas.',
    effects: { tradeBonus: 0.3, internalTariff: 0, externalTariff: 11 },
    rules: [
      'Libre circulacion de personas entre socios: absorbe y expulsa migracion segun la crisis.',
      'Cohesion baja: los socios firman acuerdos por fuera con frecuencia.'
    ]
  },
  {
    id: 'celac',
    name: 'Comunidad de Estados Latinoamericanos y Caribenos',
    short: 'CELAC',
    type: 'politica',
    color: '#26a69a',
    founded: 2010,
    members: [
      'Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador',
      'Guyana', 'Mexico', 'Paraguay', 'Peru', 'Suriname', 'Uruguay', 'Venezuela'
    ],
    candidates: [],
    rivals: [],
    cohesion: 38,
    description:
      'Foro politico regional sin Estados Unidos ni Canada. Peso diplomatico, cero obligaciones economicas.',
    effects: {},
    rules: [
      'Las cumbres dan peso diplomatico: sirven para mediar conflictos regionales.',
      'Cohesion muy baja: las crisis internas de los socios la rompen facil.'
    ]
  },
  {
    id: 'indopacifico',
    name: 'Alianzas de seguridad del Indo-Pacifico',
    short: 'Indo-Pacifico',
    type: 'militar',
    color: '#00c2d1',
    founded: 1953,
    members: ['USA', 'Japan', 'SouthKorea'],
    candidates: [],
    rivals: ['China', 'NorthKorea', 'Russia'],
    cohesion: 69,
    description: 'Red de tratados bilaterales de seguridad de Estados Unidos en Asia oriental.',
    effects: { securityBonus: 20, techBonus: 5 },
    rules: [
      'Tropas y paraguas nuclear de Estados Unidos en territorio aliado.',
      'Cada prueba de misiles de Corea del Norte sube la tension del bloque.'
    ]
  },
  {
    id: 'opep',
    name: 'OPEP+',
    short: 'OPEP+',
    type: 'economica',
    color: '#8d6e63',
    founded: 2016,
    members: ['Russia', 'Venezuela'],
    candidates: ['Ecuador', 'Brazil', 'Guyana'],
    rivals: [],
    cohesion: 52,
    description: 'Coordinacion de produccion petrolera para sostener el precio del barril.',
    effects: { tradeBonus: 0.2 },
    rules: [
      'Recortar produccion sube el precio del petroleo global: te favorece si exportas, te golpea si importas.',
      'Hacer trampa con las cuotas baja la cohesion del bloque.'
    ]
  }
];

export const blocById = (id: string) => BLOCS.find((b) => b.id === id);

export const blocsOf = (blocs: Bloc[], code: string) => blocs.filter((b) => b.members.includes(code));

export const shareBloc = (blocs: Bloc[], a: string, b: string, type?: Bloc['type']) =>
  blocs.filter((x) => (!type || x.type === type) && x.members.includes(a) && x.members.includes(b));

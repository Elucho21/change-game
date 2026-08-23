import type { GameEvent } from '../types';

export const WORLD_EVENTS_EXTRA: GameEvent[] = [
  {
    id: 'pirateria_aden',
    scope: 'mundial',
    title: 'Ola de pirateria en el Golfo de Aden',
    emoji: '🏴‍☠️',
    tags: ['rutas', 'comercio', 'seguridad'],
    weight: 5,
    duration: 3,
    description:
      'Ataques a buques cerca de Bab el-Mandeb elevan el seguro maritimo y desvian trafico del Mar Rojo.',
    disrupts: ['suez'],
    worldEffects: { inflation: 0.4 },
    worldOngoing: { inflation: 0.1 },
    ongoing: { happiness: -0.3 },
    sectorEffects: { commerce: -10 },
    effects: { global_tension: 4 },
    choices: [
      {
        id: 'escolta',
        label: 'Ofrecer escolta naval a la coalicion',
        detail: 'Gasto y alineamiento de seguridad.',
        cost: { capital: 10, fiscal: 0.3 },
        effects: { fiscal_balance: -0.3, stability: 1, global_tension: -1 },
        relations: [{ target: 'USA', amount: 8 }]
      },
      {
        id: 'observar',
        label: 'Observar sin comprometer medios',
        detail: 'Sin costo militar; el flete sigue caro.',
        effects: { inflation: 0.2, happiness: -1 }
      }
    ]
  },
  {
    id: 'congestion_puertos_usa',
    scope: 'mundial',
    title: 'Congestion extrema en puertos del Pacifico',
    emoji: '📦',
    tags: ['rutas', 'comercio', 'inflacion'],
    weight: 5,
    duration: 3,
    description:
      'Los puertos de la costa oeste de EE.UU. se saturan. El flete transpacifico se duplica y los inventarios se atrasan.',
    worldEffects: { inflation: 0.5 },
    worldOngoing: { inflation: 0.12 },
    ongoing: { happiness: -0.3 },
    sectorEffects: { commerce: -14, industry: -6 },
    effects: { global_tension: 2 },
    choices: [
      {
        id: 'puente_aereo',
        label: 'Subsidiar un puente aereo de insumos criticos',
        detail: 'Caro y parcial. La industria agradece, la caja no.',
        cost: { capital: 8, fiscal: 0.4 },
        effects: { fiscal_balance: -0.4, inflation: -0.2 }
      },
      {
        id: 'esperar_cola',
        label: 'Esperar a que se destape la cola',
        detail: 'Cero costo. Los precios siguen subiendo unas semanas.',
        effects: { inflation: 0.3, happiness: -1 }
      }
    ]
  },
  {
    id: 'guerra_tarifas_navieras',
    scope: 'mundial',
    title: 'Guerra de tarifas navieras',
    emoji: '🛳️',
    tags: ['comercio', 'rutas'],
    weight: 5,
    duration: 3,
    description:
      'Las grandes alianzas navieras se pelean fletes. Primero bajan, despues recortan rutas y dejan puertos chicos sin servicio.',
    worldEffects: { inflation: 0.35 },
    worldOngoing: { inflation: 0.1 },
    sectorEffects: { commerce: -12, tourism: -8 },
    effects: { global_tension: 2 },
    choices: [
      {
        id: 'pacto_naviero',
        label: 'Pactar cupos con una alianza',
        detail: 'Aseguras servicio a costa de concentrar el mercado.',
        cost: { capital: 9 },
        effects: { inflation: -0.15, fiscal_balance: -0.15 },
        relations: [{ target: 'todos', amount: -3 }]
      },
      {
        id: 'dejar_mercado',
        label: 'Dejar que el mercado se reordene',
        detail: 'Exportadores chicos quedan afuera unas semanas.',
        effects: { unemployment: 0.15, happiness: -1 }
      }
    ]
  },
  {
    id: 'accidente_ambiental_puerto',
    scope: 'mundial',
    title: 'Accidente ambiental cierra un puerto grande',
    emoji: '🛢️',
    tags: ['rutas', 'clima', 'comercio'],
    weight: 4,
    duration: 2,
    description:
      'Un derrame obliga a cerrar un hub de contenedores. El trafico se desvia y las primas de seguro saltan.',
    worldEffects: { inflation: 0.4 },
    worldOngoing: { inflation: 0.12 },
    sectorEffects: { commerce: -16, tourism: -6 },
    effects: { global_tension: 3 },
    choices: [
      {
        id: 'ayuda_limpieza',
        label: 'Mandar equipos de limpieza y credito blando',
        detail: 'Gasto visible, reputacion verde.',
        cost: { capital: 7, fiscal: 0.35 },
        effects: { fiscal_balance: -0.35, happiness: 1 },
        relations: [{ target: 'todos', amount: 5 }]
      },
      {
        id: 'no_involucrarse',
        label: 'No involucrarte',
        detail: 'El flete te pega igual y no ganas nada.',
        effects: { inflation: 0.2 }
      }
    ]
  }
];

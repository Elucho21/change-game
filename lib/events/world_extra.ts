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
    worldEffects: { inflation: 0.4, gdp_growth: -0.15 },
    worldOngoing: { inflation: 0.1 },
    ongoing: { happiness: -0.3 },
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
        effects: { gdp_growth: -0.1 }
      }
    ]
  }
];

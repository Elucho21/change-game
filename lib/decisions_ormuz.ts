import type { Decision } from './types';

/** Decisiones solo para Iran (chokepoint Ormuz). Grok / pedido 10. */
export const DECISIONS_ORMUZ: Decision[] = [
  {
    id: 'cerrar_estrecho_ormuz',
    category: 'defensa',
    label: 'Cerrar el Estrecho de Ormuz',
    emoji: '🛢️',
    detail: 'Solo disponible si sos Iran. Disuasion maxima: el barril salta y el mundo te mira.',
    cost: { capital: 28 },
    cooldown: 3,
    when: (c) => c.player.code === 'Iran',
    effects: { global_tension: 12, oil_price: 18, stability: 2, happiness: -2 },
    relations: [{ target: 'USA', amount: -20 }, { target: 'todos', amount: -6 }]
  },
  {
    id: 'reabrir_estrecho_ormuz',
    category: 'defensa',
    label: 'Reabrir el Estrecho de Ormuz',
    emoji: '⛵',
    detail: 'Bajar la apuesta. Alivia tension y precio del petroleo; la calle interna puede leer debilidad.',
    cost: { capital: 12 },
    cooldown: 2,
    when: (c) => c.player.code === 'Iran',
    effects: { global_tension: -6, oil_price: -8, stability: -1, capital: 15 },
    relations: [{ target: 'USA', amount: 8 }, { target: 'todos', amount: 3 }]
  }
];

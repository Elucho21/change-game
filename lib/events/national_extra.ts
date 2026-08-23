import type { GameEvent } from '../types';

/** Eventos de oposicion, campana y comercio (Grok). */
export const NATIONAL_EVENTS_EXTRA: GameEvent[] = [
  {
    id: 'interna_partido',
    scope: 'nacional',
    title: 'Interna abierta en el oficialismo',
    emoji: '⚔️',
    tags: ['oposicion', 'campana', 'liderazgo'],
    weight: 5,
    duration: 2,
    description:
      'Un sector de tu propio espacio cuestiona el rumbo. La pelea se filtra a los medios.',
    when: (c) => (c.politics?.opposition ?? 0) > 45 || (c.politics?.poll ?? 50) < 42,
    ongoing: { stability: -0.5 },
    choices: [
      { id: 'cerrar_filas', label: 'Cerrar filas con cargos y presupuesto', detail: 'Compras paz interna.', cost: { capital: 12 }, effects: { stability: 3, fiscal_balance: -0.4, capital: -4 } },
      { id: 'bancarte', label: 'Bancarte el embate y no ceder', detail: 'Ganas autoridad si aguantas.', cost: { capital: 8 }, effects: { stability: -2, capital: 3, happiness: -2 } },
      { id: 'echar', label: 'Echar a los discolos del bloque', detail: 'Orden en el mensaje.', cost: { capital: 10 }, effects: { stability: 2, happiness: -1 } }
    ]
  },
  {
    id: 'campana_sucia',
    scope: 'nacional',
    title: 'Campana sucia de la oposicion',
    emoji: '📰',
    tags: ['campana', 'oposicion'],
    weight: 6,
    duration: 1,
    description: 'Operetas y filtraciones. Faltan pocos meses para la eleccion.',
    when: (c) => (c.politics?.monthsToElection ?? 99) <= 8,
    choices: [
      { id: 'responder', label: 'Responder con datos y cadena corta', detail: 'Gastas capital y recuperas relato.', cost: { capital: 8 }, effects: { happiness: 2, stability: 1, capital: 2 } },
      { id: 'ignorar', label: 'No entrar en el barro', detail: 'A veces el silencio gana.', effects: { happiness: -2 }, risk: { chance: 0.35, label: 'La opereta escala', effects: { happiness: -5, stability: -3, capital: -4 } } },
      { id: 'contraataque', label: 'Contraatacar con archivo', detail: 'Empate en el barro.', cost: { capital: 10 }, effects: { happiness: -1, stability: -1, capital: 1 } }
    ]
  },
  {
    id: 'promesa_incumplida',
    scope: 'nacional',
    title: 'La promesa de campana que no llego',
    emoji: '📜',
    tags: ['campana', 'oposicion'],
    weight: 5,
    duration: 1,
    description: 'Un compromiso de campana vuelve a la tapa.',
    when: (c) => (c.politics?.honeymoon === false) && ((c.politics?.opposition ?? 0) > 40),
    choices: [
      { id: 'cumplir_parcial', label: 'Anunciar cumplimiento parcial', detail: 'Compra tiempo.', cost: { capital: 10, fiscal: 0.3 }, effects: { happiness: 2, fiscal_balance: -0.3, stability: 1 } },
      { id: 'redefinir', label: 'Redefinir la promesa como proceso', detail: 'Relato debil.', cost: { capital: 6 }, effects: { happiness: -3, capital: -2 } }
    ]
  },
  {
    id: 'desercion_legisladores',
    scope: 'nacional',
    title: 'Desercion de legisladores propios',
    emoji: '🚪',
    tags: ['oposicion', 'parlamento'],
    weight: 4,
    duration: 1,
    description: 'Legisladores amenazan con pasarse a la oposicion.',
    when: (c) => (c.politics?.seats ?? 50) < 45 || (c.politics?.opposition ?? 0) > 55,
    choices: [
      { id: 'negociar', label: 'Negociar reubicaciones', detail: 'Retenes escanos.', cost: { capital: 12 }, effects: { stability: 2, fiscal_balance: -0.35 } },
      { id: 'dejarlos', label: 'Dejarlos ir', detail: 'Menos escanos, mas autoridad.', cost: { capital: 8 }, effects: { stability: 1, happiness: -2 } }
    ]
  },
  {
    id: 'pacto_gobernador',
    scope: 'nacional',
    title: 'Un gobernador pide pacto',
    emoji: '🤝',
    tags: ['campana', 'interior'],
    weight: 4,
    duration: 1,
    description: 'Gobernador ofrece territorio a cambio de obra.',
    when: (c) => (c.politics?.monthsToElection ?? 99) <= 12 || (c.politics?.monthsToMidterm ?? 99) <= 6,
    choices: [
      { id: 'aceptar', label: 'Cerrar el pacto', detail: 'Mas estabilidad, mas deficit.', cost: { capital: 9, fiscal: 0.4 }, effects: { stability: 3, happiness: 1, fiscal_balance: -0.4 } },
      { id: 'rechazar', label: 'Rechazar y priorizar caja', detail: 'Caja ordenada.', cost: { capital: 5 }, effects: { fiscal_balance: 0.2, stability: -2 } }
    ]
  },
  {
    id: 'escandalo_opositor',
    scope: 'nacional',
    title: 'Escandalo en la oposicion',
    emoji: '🔦',
    tags: ['oposicion', 'campana'],
    weight: 4,
    duration: 1,
    description: 'Candidato opositor envuelto en denuncia.',
    when: (c) => (c.politics?.opposition ?? 0) > 35,
    choices: [
      { id: 'capitalizar', label: 'Capitalizar con mesura', detail: 'Subis sin mancharte.', cost: { capital: 4 }, effects: { happiness: 2, capital: 4, stability: 1 } },
      { id: 'sobreactuar', label: 'Ir al choque mediatico', detail: 'Alto riesgo.', cost: { capital: 7 }, effects: { capital: 2 }, risk: { chance: 0.4, label: 'Efecto rebote', effects: { happiness: -3, capital: -5 } } },
      { id: 'silencio', label: 'Dejar que la justicia actue', detail: 'Seriedad institucional.', effects: { stability: 2 } }
    ]
  },
  {
    id: 'socio_en_recesion',
    scope: 'nacional',
    title: 'Tu principal socio entra en recesion',
    emoji: '📉',
    tags: ['comercio', 'economia'],
    weight: 6,
    duration: 3,
    description: 'Cae la demanda del socio principal.',
    when: (c) => (c.trade?.changeVsStart ?? 0) < -8,
    ongoing: { gdp_growth: -0.15, happiness: -0.4 },
    sectorEffects: { commerce: -12 },
    choices: [
      { id: 'diversificar', label: 'Apurar misiones a otros mercados', detail: 'Reduce dependencia.', cost: { capital: 10 }, effects: { gdp_growth: 0.15, fiscal_balance: -0.2 } },
      { id: 'sostener', label: 'Sostener al exportador con credito', detail: 'Empeora la caja.', cost: { capital: 8, fiscal: 0.5 }, effects: { unemployment: -0.2, fiscal_balance: -0.5, happiness: 1 } },
      { id: 'nada', label: 'Dejar que el mercado ajuste', detail: 'Sin costo politico.', effects: { gdp_growth: -0.25, unemployment: 0.3 } }
    ]
  },
  {
    id: 'industria_contra_apertura',
    scope: 'nacional',
    title: 'La industria local contra la apertura',
    emoji: '🏭',
    tags: ['comercio', 'industria'],
    weight: 5,
    duration: 2,
    description: 'Camaras piden proteccion.',
    when: (c) => (c.trade?.changeVsStart ?? 0) > 5 || (c.player.sectors?.industry ?? 0) >= 15,
    ongoing: { stability: -0.3 },
    choices: [
      { id: 'proteger', label: 'Subir proteccion temporal', detail: 'Empleo a costa de precios.', cost: { capital: 10 }, effects: { unemployment: -0.3, inflation: 0.5, gdp_growth: -0.1 }, relations: [{ target: 'todos', amount: -4 }] },
      { id: 'mantener', label: 'Mantener la apertura y compensar', detail: 'Reconversion con gasto.', cost: { capital: 9, fiscal: 0.3 }, effects: { fiscal_balance: -0.3, happiness: -2, gdp_growth: 0.15 } }
    ]
  }
];

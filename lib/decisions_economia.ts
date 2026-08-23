import type { Decision } from './types';

/**
 * Decisiones economicas de CHANGE WORLD GAME 1.0.
 * Formalizacion, impulso por sector e incentivos. Zona Grok.
 *
 * El motor no tiene (todavia) informalidad ni tax buoyancy: los efectos
 * usan desempleo / caja / crecimiento como proxy. Pedido a Opus en
 * docs/PEDIDOS_A_OPUS.md.
 *
 * Trade-off de formalizacion: costo fiscal corto vs cobertura y capital
 * politico a mediano plazo. Si la fiscalizacion es debil, el abuso vuelve
 * el costo permanente (inspeccion vs amnistia).
 */
export const DECISIONS_ECONOMIA: Decision[] = [
  {
    id: 'aportes_nuevos_formales',
    category: 'economia',
    label: 'Bajar aportes a nuevos formales',
    emoji: '🧾',
    detail: '1 a 3 anios de aportes reducidos. La caja duele ahora; el empleo formal aparece despues. Riesgo de que se vuelva permanente.',
    cost: { capital: 12, fiscal: 0.7 },
    cooldown: 3,
    effects: { fiscal_balance: -0.7, unemployment: -0.4, happiness: 2, gdp_growth: 0.15, inflation: 0.1 }
  },
  {
    id: 'credito_fiscal_formal',
    category: 'economia',
    label: 'Credito fiscal por formalizar',
    emoji: '🧮',
    detail: 'El Estado paga parte del costo de blanquear un puesto. Menos recaudo hoy, mas base manana.',
    cost: { capital: 10, fiscal: 0.5 },
    cooldown: 2,
    effects: { fiscal_balance: -0.5, unemployment: -0.3, happiness: 1, gdp_growth: 0.1 }
  },
  {
    id: 'simplificacion_laboral',
    category: 'economia',
    label: 'Simplificar altas y bajas',
    emoji: '🗂️',
    detail: 'Menos tramites para contratar. Barato si el ministro de Trabajo rinde; si no, queda en papel.',
    cost: { capital: 8, fiscal: 0.2 },
    cooldown: 2,
    effects: { fiscal_balance: -0.2, unemployment: -0.25, gdp_growth: 0.2, stability: 1 }
  },
  {
    id: 'amnistia_previsional',
    category: 'economia',
    label: 'Amnistia parcial de deudas previsionales',
    emoji: '🕊️',
    detail: 'Perdonas deuda vieja a cambio de entrar al sistema. Quien pago en regla se siente estafado.',
    cost: { capital: 14 },
    cooldown: 3,
    effects: { fiscal_balance: -0.4, unemployment: -0.2, happiness: 1, stability: -2 }
  },
  {
    id: 'inspeccion_trabajo',
    category: 'economia',
    label: 'Plan de inspeccion laboral',
    emoji: '🔍',
    detail: 'Fiscalizar informalidad. Entra plata y se cierran puestos chicos. La calle lo vive como caza de brujas.',
    cost: { capital: 10 },
    cooldown: 2,
    effects: { fiscal_balance: 0.35, unemployment: 0.25, happiness: -3, stability: -1 }
  },
  {
    id: 'impulso_industria',
    category: 'economia',
    label: 'Impulsar la industria',
    emoji: '🏭',
    detail: 'Credito y energia barata al sector. Mas PBI que empleo: la industria es intensiva en capital.',
    cost: { capital: 12, fiscal: 0.6 },
    cooldown: 2,
    effects: { fiscal_balance: -0.6, gdp_growth: 0.4, unemployment: -0.2, inflation: 0.3, happiness: 1 }
  },
  {
    id: 'impulso_turismo',
    category: 'economia',
    label: 'Impulsar el turismo',
    emoji: '🧳',
    detail: 'Mucho empleo, mucha informalidad. Rinde si hay seguridad y tipo de cambio competitivo.',
    cost: { capital: 10, fiscal: 0.4 },
    cooldown: 2,
    when: (c) => (c.player.sectors?.tourism ?? 0) >= 2 || (c.player.sectors?.services ?? 0) >= 50,
    effects: { fiscal_balance: -0.4, gdp_growth: 0.2, unemployment: -0.45, inflation: 0.15, happiness: 2 }
  },
  {
    id: 'impulso_agro',
    category: 'economia',
    label: 'Impulsar el agro exportador',
    emoji: '🌾',
    detail: 'Dolares y reservas. Poco empleo urbano. El interior festeja, la ciudad no lo siente.',
    cost: { capital: 9, fiscal: 0.3 },
    cooldown: 2,
    when: (c) => (c.player.sectors?.agriculture ?? 0) >= 4,
    effects: { fiscal_balance: -0.3, gdp_growth: 0.3, unemployment: -0.12, gold_reserves_tonnes: 3, happiness: 1 }
  },
  {
    id: 'impulso_servicios',
    category: 'economia',
    label: 'Impulsar servicios y tecnologia',
    emoji: '💻',
    detail: 'Alta productividad, poco volumen de empleo. Los salarios de ese bolsillo suben; el resto no entra.',
    cost: { capital: 11, fiscal: 0.45 },
    cooldown: 2,
    effects: { fiscal_balance: -0.45, gdp_growth: 0.35, unemployment: -0.12, happiness: 1, inflation: 0.1 }
  }
];

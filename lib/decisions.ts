import type { Decision } from './types';

/**
 * Decisiones que el jugador puede tomar en cualquier turno.
 * Cada una cuesta capital politico (0-100, se recupera segun felicidad) y
 * muestra un PREVIEW de impacto antes de confirmar.
 */
export const DECISIONS: Decision[] = [
  // ---------------- ECONOMIA ----------------
  {
    id: 'bajar_impuestos',
    category: 'economia',
    label: 'Bajar impuestos',
    emoji: '📉',
    detail: 'Menos recaudacion, mas consumo y mas humor social. La inflacion mira de reojo.',
    cost: { capital: 8 },
    effects: { fiscal_balance: -1.5, happiness: 3, gdp_growth: 0.3, inflation: 0.4 }
  },
  {
    id: 'subir_impuestos',
    category: 'economia',
    label: 'Subir impuestos',
    emoji: '📈',
    detail: 'Ordena la caja y enfria la actividad. Costo politico inmediato.',
    cost: { capital: 12 },
    effects: { fiscal_balance: 1.2, happiness: -4, gdp_growth: -0.4, stability: -1 }
  },
  {
    id: 'obra_publica',
    category: 'economia',
    label: 'Plan de obra publica',
    emoji: '🏗️',
    detail: 'Empleo y actividad ahora, deficit despues.',
    cost: { capital: 8, fiscal: 1.2 },
    effects: { fiscal_balance: -1.2, happiness: 3, gdp_growth: 0.6, unemployment: -0.4, inflation: 0.3 }
  },
  {
    id: 'ajuste_fiscal',
    category: 'economia',
    label: 'Ajuste fiscal',
    emoji: '✂️',
    detail: 'Recorte de gasto corriente. El mercado lo premia, la calle lo castiga.',
    cost: { capital: 18 },
    effects: { fiscal_balance: 1.8, happiness: -7, gdp_growth: -0.6, unemployment: 0.5, inflation: -1, stability: -3 }
  },
  {
    id: 'subir_tasa',
    category: 'economia',
    label: 'Subir la tasa de interes',
    emoji: '🏦',
    detail: 'Ancla la inflacion y frena el credito.',
    cost: { capital: 6 },
    effects: { inflation: -1.8, gdp_growth: -0.5, unemployment: 0.2 }
  },
  {
    id: 'emitir',
    category: 'economia',
    label: 'Emitir para financiar el gasto',
    emoji: '🖨️',
    detail: 'Resuelve la caja de este mes y te la cobra en precios dentro de tres.',
    cost: { capital: 4 },
    effects: { fiscal_balance: 1, inflation: 2.5, happiness: 1, gdp_growth: 0.2 }
  },
  {
    id: 'comprar_oro',
    category: 'economia',
    label: 'Comprar reservas de oro',
    emoji: '🪙',
    detail: 'Colchon contra la proxima corrida, a costa de la caja de hoy.',
    cost: { capital: 5, fiscal: 0.6 },
    effects: { gold_reserves_tonnes: 6, fiscal_balance: -0.6 }
  },

  // ---------------- INTERIOR ----------------
  {
    id: 'subsidios',
    category: 'interior',
    label: 'Ampliar subsidios y planes sociales',
    emoji: '🤲',
    detail: 'Contiene la conflictividad social y compromete la caja.',
    cost: { capital: 6, fiscal: 0.8 },
    effects: { happiness: 5, stability: 3, fiscal_balance: -0.8, inflation: 0.3 }
  },
  {
    id: 'quitar_subsidios',
    category: 'interior',
    label: 'Quitar subsidios a la energia',
    emoji: '⚡',
    detail: 'Sincera tarifas: ordena la caja, dispara precios y protestas.',
    cost: { capital: 15 },
    effects: { fiscal_balance: 1.4, inflation: 1.5, happiness: -6, stability: -3 }
  },
  {
    id: 'reforma_laboral',
    category: 'interior',
    label: 'Impulsar una reforma laboral',
    emoji: '📜',
    detail: 'Baja el costo de contratar. Los gremios van al choque.',
    cost: { capital: 20 },
    effects: { unemployment: -0.6, gdp_growth: 0.4, happiness: -4, stability: -4 }
  },
  {
    id: 'mesa_dialogo',
    category: 'interior',
    label: 'Convocar mesa de dialogo nacional',
    emoji: '🕊️',
    detail: 'Sentar a gremios, empresarios y oposicion. Baja la temperatura.',
    cost: { capital: 6 },
    effects: { stability: 5, happiness: 2 }
  },
  {
    id: 'referendum',
    category: 'interior',
    label: 'Llamar a referendum',
    emoji: '🗳️',
    detail: 'Le devolves la decision a la gente. Si perdes, quedas sin margen.',
    cost: { capital: 14 },
    effects: { stability: 2, happiness: 3, capital: -5 }
  },
  {
    id: 'seguridad',
    category: 'interior',
    label: 'Plan nacional de seguridad',
    emoji: '🚓',
    detail: 'Mas presencia policial en las grandes ciudades.',
    cost: { capital: 8, fiscal: 0.5 },
    effects: { stability: 4, happiness: 3, fiscal_balance: -0.5 }
  },

  // ---------------- COMERCIO ----------------
  {
    id: 'subir_aranceles',
    category: 'comercio',
    label: 'Subir aranceles a la importacion',
    emoji: '🚢',
    detail: 'Protege la industria local, encarece todo y molesta a tus socios.',
    cost: { capital: 8 },
    effects: { gdp_growth: -0.2, inflation: 0.7, happiness: -1, fiscal_balance: 0.3 },
    relations: [{ target: 'bloc:aduanera', amount: -8 }]
  },
  {
    id: 'abrir_importaciones',
    category: 'comercio',
    label: 'Abrir la importacion',
    emoji: '📦',
    detail: 'Baja precios al consumidor y expone a la industria local.',
    cost: { capital: 10 },
    effects: { inflation: -1, gdp_growth: 0.2, unemployment: 0.4, happiness: 2 },
    relations: [{ target: 'todos', amount: 5 }]
  },
  {
    id: 'tratado_comercial',
    category: 'comercio',
    label: 'Firmar tratado comercial bilateral',
    emoji: '📝',
    detail: 'Acuerdo de libre comercio con un pais puntual.',
    cost: { capital: 12 },
    needsTarget: true,
    effects: { gdp_growth: 0.4, inflation: -0.2 },
    relations: [{ target: 'TARGET', amount: 18 }]
  },
  {
    id: 'sancionar',
    category: 'comercio',
    label: 'Aplicar sanciones economicas',
    emoji: '⛔',
    detail: 'Cortas el comercio con un pais. Duele a los dos.',
    cost: { capital: 15 },
    needsTarget: true,
    effects: { gdp_growth: -0.3, happiness: -1 },
    relations: [{ target: 'TARGET', amount: -30 }]
  },

  // ---------------- DIPLOMACIA ----------------
  {
    id: 'mision_diplomatica',
    category: 'diplomacia',
    label: 'Enviar mision diplomatica',
    emoji: '🤝',
    detail: 'Visita oficial para descomprimir y buscar acuerdos.',
    cost: { capital: 5 },
    needsTarget: true,
    effects: {},
    relations: [{ target: 'TARGET', amount: 12 }]
  },
  {
    id: 'cumbre_regional',
    category: 'diplomacia',
    label: 'Convocar cumbre regional',
    emoji: '🌎',
    detail: 'Reunis a los vecinos y capitalizas el papel de anfitrion.',
    cost: { capital: 10 },
    effects: { capital: 3, stability: 1 },
    relations: [{ target: 'vecinos', amount: 10 }]
  },
  {
    id: 'retirar_embajador',
    category: 'diplomacia',
    label: 'Retirar al embajador',
    emoji: '🚫',
    detail: 'Senal diplomatica fuerte y barata. Escala la tension.',
    cost: { capital: 6 },
    needsTarget: true,
    effects: { global_tension: 2 },
    relations: [{ target: 'TARGET', amount: -20 }]
  },
  {
    id: 'ayuda_humanitaria',
    category: 'diplomacia',
    label: 'Enviar ayuda humanitaria',
    emoji: '🎗️',
    detail: 'Soft power puro: cuesta plata y compra voluntades.',
    cost: { capital: 4, fiscal: 0.3 },
    needsTarget: true,
    effects: { fiscal_balance: -0.3, happiness: 1 },
    relations: [{ target: 'TARGET', amount: 15 }]
  },
  {
    id: 'mediar',
    category: 'diplomacia',
    label: 'Ofrecerte como mediador internacional',
    emoji: '🕊️',
    detail: 'Prestigio si sale bien, ridiculo si nadie te escucha.',
    cost: { capital: 8 },
    effects: { capital: 5, global_tension: -3 },
    relations: [{ target: 'todos', amount: 6 }]
  },

  // ---------------- DEFENSA ----------------
  {
    id: 'aumentar_defensa',
    category: 'defensa',
    label: 'Aumentar el presupuesto militar',
    emoji: '🎖️',
    detail: 'Mas capacidad de disuasion, mas deficit, vecinos nerviosos.',
    cost: { capital: 8, fiscal: 0.8 },
    effects: { military_budget_bn: 2, fiscal_balance: -0.8, stability: 2, happiness: -1 },
    relations: [{ target: 'vecinos', amount: -6 }]
  },
  {
    id: 'recortar_defensa',
    category: 'defensa',
    label: 'Recortar el gasto militar',
    emoji: '🕊️',
    detail: 'Libera caja y debilita tu posicion negociadora.',
    cost: { capital: 10 },
    effects: { military_budget_bn: -1.5, fiscal_balance: 0.6, stability: -2 },
    relations: [{ target: 'vecinos', amount: 5 }]
  },
  {
    id: 'ejercicios_conjuntos',
    category: 'defensa',
    label: 'Ejercicios militares conjuntos',
    emoji: '✈️',
    detail: 'Entrenamiento con un socio: refuerza la alianza y molesta a sus rivales.',
    cost: { capital: 8 },
    needsTarget: true,
    effects: { global_tension: 3, stability: 1 },
    relations: [{ target: 'TARGET', amount: 15 }]
  },
  {
    id: 'movilizacion',
    category: 'defensa',
    label: 'Movilizar tropas a la frontera',
    emoji: '🪖',
    detail: 'Mensaje inequivoco. Muy dificil de desescalar despues.',
    cost: { capital: 20 },
    needsTarget: true,
    effects: { global_tension: 10, stability: -2, happiness: -3, fiscal_balance: -0.5 },
    relations: [{ target: 'TARGET', amount: -35 }, { target: 'vecinos', amount: -10 }]
  }
];

export const decisionsByCategory = (cat: Decision['category']) =>
  DECISIONS.filter((d) => d.category === cat);

export const CATEGORIES: { id: Decision['category']; label: string; emoji: string }[] = [
  { id: 'economia', label: 'Economia', emoji: '💰' },
  { id: 'interior', label: 'Interior', emoji: '🏛️' },
  { id: 'comercio', label: 'Comercio', emoji: '🚢' },
  { id: 'diplomacia', label: 'Diplomacia', emoji: '🤝' },
  { id: 'defensa', label: 'Defensa', emoji: '🎖️' }
];

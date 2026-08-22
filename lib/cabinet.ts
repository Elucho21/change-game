import type { Decision, Delta, GameEvent } from './types';

/**
 * Gabinete de cinco sillas.
 *
 * Cada ministro es una apuesta chica y permanente: suma un pasivo todos los
 * meses y abarata (o encarece) una categoria de decisiones. Ninguno es el
 * mejor: el ortodoxo te ordena la macro y te hunde el humor social, el
 * operador te consigue votos y te cuesta plata.
 *
 * Sentar a alguien de la oposicion arma una COALICION: mas encuesta, mas
 * estabilidad y escanos prestados, a cambio de que cada tanto te pase una
 * factura que no vas a querer pagar.
 *
 * Este archivo tiene la mecanica y un catalogo minimo de referencia.
 * El catalogo completo lo carga Grok (ver docs/PEDIDOS_A_GROK.md).
 */

export type CabinetSeat = 'economia' | 'interior' | 'exterior' | 'defensa' | 'jefatura';

export type MinisterParty = 'oficialismo' | 'aliado' | 'oposicion';

export interface Minister {
  id: string;
  name: string;
  seat: CabinetSeat;
  party: MinisterParty;
  /** como lo conocen: "La ortodoxa", "El operador" */
  title: string;
  description: string;
  /** lo que aporta o quita cada mes, en chico */
  passive: Delta & { capitalPerTurn?: number };
  /** abarata o encarece una categoria de decisiones (0.8 = 20% mas barato) */
  discount?: { category: Decision['category']; factor: number };
  /** cuanto mueve la intencion de voto */
  voteBonus?: number;
  /** escanos que aporta si viene de otro partido */
  seats?: number;
}

export const SEATS: { id: CabinetSeat; label: string; hint: string }[] = [
  { id: 'economia', label: 'Economia', hint: 'Define el tono de la macro y abarata las medidas economicas.' },
  { id: 'interior', label: 'Interior', hint: 'Calle, gobernadores y conflicto social.' },
  { id: 'exterior', label: 'Exterior', hint: 'Relaciones, bloques y negociacion.' },
  { id: 'defensa', label: 'Defensa', hint: 'Fuerzas armadas y seguridad.' },
  { id: 'jefatura', label: 'Jefatura de Gabinete', hint: 'Coordina: capital politico y estabilidad.' }
];

export const SEAT_LABEL: Record<CabinetSeat, string> = {
  economia: 'Economia',
  interior: 'Interior',
  exterior: 'Exterior',
  defensa: 'Defensa',
  jefatura: 'Jefatura de Gabinete'
};

/** Costo politico de mover una silla. Echar sale mas caro que nombrar. */
export const APPOINT_COST = 8;
export const DISMISS_COST = 12;

/**
 * Catalogo de referencia: dos opciones por silla, una de ellas opositora.
 * Grok lo amplia; la mecanica no cambia.
 */
export const MINISTERS: Minister[] = [
  // ---------------------------------------------------------- economia
  {
    id: 'eco_ortodoxa',
    name: 'C. Aramburu',
    seat: 'economia',
    party: 'oficialismo',
    title: 'La ortodoxa',
    description: 'Viene del sector privado. Ordena la macro y no le tiembla el pulso con el ajuste.',
    passive: { inflation: -0.35, happiness: -0.3 },
    discount: { category: 'economia', factor: 0.8 },
    voteBonus: -1
  },
  {
    id: 'eco_desarrollista',
    name: 'R. Ledesma',
    seat: 'economia',
    party: 'oficialismo',
    title: 'El desarrollista',
    description: 'Cree que se sale creciendo. Empuja la actividad y convive con precios mas altos.',
    passive: { gdp_growth: 0.12, inflation: 0.2, happiness: 0.2 },
    discount: { category: 'economia', factor: 0.9 }
  },
  {
    id: 'eco_opositor',
    name: 'M. Salgado',
    seat: 'economia',
    party: 'oposicion',
    title: 'El tecnico de la oposicion',
    description: 'Lo aceptan los mercados y tu propia tropa lo mira de reojo. Trae votos prestados.',
    passive: { inflation: -0.25, stability: 0.2 },
    voteBonus: 3,
    seats: 8
  },

  // ---------------------------------------------------------- interior
  {
    id: 'int_operador',
    name: 'J. Brizuela',
    seat: 'interior',
    party: 'oficialismo',
    title: 'El operador',
    description: 'Conoce a cada intendente por su nombre. La calle se ordena; la caja se resiente.',
    passive: { stability: 0.4, capitalPerTurn: 0.8, fiscal_balance: -0.05 },
    discount: { category: 'interior', factor: 0.85 }
  },
  {
    id: 'int_dura',
    name: 'P. Ocanto',
    seat: 'interior',
    party: 'oficialismo',
    title: 'La mano dura',
    description: 'Orden ante todo. Sube la sensacion de seguridad y tensa con los movimientos sociales.',
    passive: { stability: 0.6, happiness: -0.25 },
    discount: { category: 'interior', factor: 0.9 }
  },

  // ---------------------------------------------------------- exterior
  {
    id: 'ext_carrera',
    name: 'S. Uriburu',
    seat: 'exterior',
    party: 'oficialismo',
    title: 'La diplomatica de carrera',
    description: 'Treinta anios en la cancilleria. Abre puertas que no se abren con una llamada.',
    passive: {},
    discount: { category: 'diplomacia', factor: 0.75 }
  },
  {
    id: 'ext_comercial',
    name: 'A. Vidal',
    seat: 'exterior',
    party: 'aliado',
    title: 'El negociador comercial',
    description: 'Piensa la politica exterior como una mesa de negocios. Los tratados salen mas baratos.',
    passive: { gdp_growth: 0.08 },
    discount: { category: 'comercio', factor: 0.8 },
    seats: 4
  },

  // ---------------------------------------------------------- defensa
  {
    id: 'def_general',
    name: 'H. Ferrari',
    seat: 'defensa',
    party: 'oficialismo',
    title: 'El general retirado',
    description: 'Le da tranquilidad al cuartel. Cuesta plata sostener lo que promete.',
    passive: { stability: 0.35, fiscal_balance: -0.08 },
    discount: { category: 'defensa', factor: 0.85 }
  },
  {
    id: 'def_civil',
    name: 'L. Rearte',
    seat: 'defensa',
    party: 'oficialismo',
    title: 'La civil',
    description: 'Control civil de las fuerzas. Ahorra presupuesto y genera ruido interno.',
    passive: { fiscal_balance: 0.1, stability: -0.15 }
  },

  // ---------------------------------------------------------- jefatura
  {
    id: 'jef_armador',
    name: 'D. Pizarro',
    seat: 'jefatura',
    party: 'oficialismo',
    title: 'El armador',
    description: 'Junta los pedazos todos los dias. Lo que rinde es capital politico.',
    passive: { capitalPerTurn: 1.5 },
    discount: { category: 'interior', factor: 0.95 }
  },
  {
    id: 'jef_coalicion',
    name: 'V. Alcorta',
    seat: 'jefatura',
    party: 'oposicion',
    title: 'La jefa de la coalicion',
    description: 'Su bloque acompana en el Congreso mientras la trates bien. Y va a pedir.',
    passive: { capitalPerTurn: 0.8, stability: 0.3 },
    voteBonus: 4,
    seats: 12
  }
];

export type Cabinet = Partial<Record<CabinetSeat, string>>;

export const ministerById = (id?: string) => MINISTERS.find((m) => m.id === id);

export const ministersFor = (seat: CabinetSeat) => MINISTERS.filter((m) => m.seat === seat);

/** Ministros efectivamente sentados. */
export function seatedMinisters(cabinet: Cabinet): Minister[] {
  return (Object.values(cabinet) as (string | undefined)[])
    .map((id) => ministerById(id))
    .filter((m): m is Minister => !!m);
}

/** Suma de los pasivos mensuales del gabinete. */
export function cabinetPassive(cabinet: Cabinet): Delta & { capitalPerTurn: number } {
  const out: Delta & { capitalPerTurn: number } = { capitalPerTurn: 0 };
  for (const m of seatedMinisters(cabinet)) {
    for (const [k, v] of Object.entries(m.passive)) {
      if (v === undefined) continue;
      if (k === 'capitalPerTurn') out.capitalPerTurn += v;
      else {
        const key = k as keyof Delta;
        out[key] = Math.round(((out[key] ?? 0) + v) * 100) / 100;
      }
    }
  }
  return out;
}

/** Multiplicador de costo para una categoria de decisiones. */
export function cabinetCostFactor(cabinet: Cabinet, category: Decision['category']): number {
  let factor = 1;
  for (const m of seatedMinisters(cabinet)) {
    if (m.discount?.category === category) factor *= m.discount.factor;
  }
  return Math.round(factor * 100) / 100;
}

/** Cuanto suma el gabinete a la intencion de voto. */
export const cabinetVoteBonus = (cabinet: Cabinet) =>
  seatedMinisters(cabinet).reduce((s, m) => s + (m.voteBonus ?? 0), 0);

/** Escanos prestados por socios de coalicion. */
export const coalitionSeats = (cabinet: Cabinet) =>
  seatedMinisters(cabinet)
    .filter((m) => m.party !== 'oficialismo')
    .reduce((s, m) => s + (m.seats ?? 0), 0);

/** Ministros que no son del oficialismo: son los que arman la coalicion. */
export const coalitionPartners = (cabinet: Cabinet) =>
  seatedMinisters(cabinet).filter((m) => m.party !== 'oficialismo');

export const hasCoalition = (cabinet: Cabinet) => coalitionPartners(cabinet).length > 0;

// ------------------------------------------------------------------
// La factura de la coalicion
// ------------------------------------------------------------------

/** Cada cuantos meses el socio pasa a cobrar. */
export const DEMAND_EVERY = 7;

/**
 * El socio de coalicion pide algo. Siempre incomodo, siempre negociable.
 *
 * Decir que si cuesta plata o humor social. Decir que no lo saca del gabinete
 * y te deja sin sus escanos, que es justo lo que te estaba sosteniendo las
 * medidas grandes en el Congreso.
 */
export function coalitionDemand(partner: Minister, turn: number): GameEvent {
  const pedidos = [
    {
      id: 'obra',
      label: `Aprobar el plan de obras que pide ${partner.name}`,
      detail: 'Obra publica en los distritos de su partido. Cuesta caja y sostiene la alianza.',
      effects: { fiscal_balance: -0.6, happiness: 1.5 } as Delta
    },
    {
      id: 'cargo',
      label: 'Darle dos secretarias mas a su espacio',
      detail: 'Reparto de cargos. Tu propia tropa lo lee como una entrega.',
      effects: { stability: -2, happiness: -1 } as Delta
    },
    {
      id: 'ley',
      label: 'Bancar su proyecto de ley aunque no sea tu agenda',
      detail: 'Gastas capital politico propio en algo que no era tu prioridad.',
      effects: { capital: -12 } as Delta
    }
  ];
  const pedido = pedidos[Math.floor(Math.random() * pedidos.length)];

  return {
    id: `coalicion_${pedido.id}_${turn}`,
    scope: 'nacional',
    title: `${partner.name} pasa factura`,
    emoji: '🤝',
    tags: ['coalicion', 'oposicion', 'negociacion'],
    weight: 0,
    duration: 1,
    description:
      `${partner.name} (${partner.title}) recuerda que su bloque te viene acompanando en el Congreso `
      + 'y que la sociedad no es gratis. Si le decis que no, se va y se lleva sus escanos.',
    choices: [
      {
        id: pedido.id,
        label: pedido.label,
        detail: pedido.detail,
        effects: pedido.effects
      },
      {
        id: 'romper',
        label: 'Decirle que no',
        detail: 'Se va del gabinete con su bloque. Recuperas autonomia y perdes votos en el Congreso.',
        effects: { stability: -3, happiness: -1 }
      }
    ]
  };
}

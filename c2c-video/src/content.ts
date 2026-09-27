// ─────────────────────────────────────────────────────────────────────
// TODO EL TEXTO DEL VIDEO VIVE ACÁ.
// Editá copy sin tocar animaciones. **texto** = énfasis (color de marca).
// Reglas de contenido: ver README.md (sección "Reglas de contenido").
// ─────────────────────────────────────────────────────────────────────

export const URL_CTA = 'impulseworld.pro';
export const WORDMARK = 'IMPULSE WORLD';

/** Duración de cada escena en frames (30 fps). Las transiciones se solapan. */
export const SCENE_DURATIONS = {
  hook: 165,
  queEs: 255,
  pasos: 375,
  compraValida: 315,
  escalera: 750,
  ritmo: 330,
  partner: 255,
  cta: 300,
} as const;

export const hook = {
  badge: 'Client-to-Client',
  heroLine1: 'Tus amigos tradean.',
  heroLine2: '**Vos ganás.**',
  sub: 'Programa C2C · Impulse World',
};

export const queEs = {
  eyebrow: 'Qué es el C2C',
  statement: 'El C2C es el programa de referidos **exclusivo para clientes** de Impulse World.',
  lines: [
    'Recomendás con tu código. Cada amigo que compra te hace subir de hito.',
    '**10 hitos.** Premios reales. Al final, la invitación a **Partner.**',
  ],
};

export const pasos = {
  eyebrow: 'Cómo participar',
  title: '3 pasos',
  steps: [
    'Sé cliente de Impulse World y pedí tu código C2C.',
    'Compartilo: tu amigo tiene **10% OFF** en su primera compra.',
    'Cada compra válida suma **un hito** a tu escalera.',
  ],
};

export const compraValida = {
  eyebrow: 'Qué cuenta',
  title: 'Una compra válida es:',
  items: [
    'Primera compra de tu amigo, con tu código',
    'Orden de **USD 99 o más** (no se suman órdenes chicas)',
    'Tu amigo completa su **KYC**',
  ],
  finePrint:
    'No cuentan autocompras ni cuentas del mismo titular. Cada persona puede ser referida una sola vez.',
};

export type Milestone = {
  id: string;
  prize: boolean;
  title: string;
  detail?: string;
};

export const escalera = {
  eyebrow: 'La escalera de premios',
  title: '10 hitos. Cada uno, **una sola vez.**',
  fillerLabel: 'Seguís subiendo',
  milestones: [
    {id: 'H1', prize: true, title: '**25% OFF** en tu próxima compra'},
    {id: 'H2', prize: true, title: '**3 pases** Elevate', detail: 'Month + Classic + Night'},
    {id: 'H3', prize: true, title: 'Cuenta **100K Una Fase** gratis', detail: 'Objetivo 18% · DD\u00A05/10'},
    {id: 'H4', prize: false, title: 'Seguís subiendo'},
    {id: 'H5', prize: true, title: '**40% OFF** en tu próxima compra'},
    {id: 'H6', prize: false, title: 'Seguís subiendo'},
    {id: 'H7', prize: true, title: '**100% del profit split**', detail: 'En tu próximo retiro'},
    {id: 'H8', prize: true, title: 'Cuenta **300K Una Fase** gratis', detail: 'Objetivo 18% · DD\u00A04/8'},
    {id: 'H9', prize: false, title: 'Seguís subiendo'},
    {
      id: 'H10',
      prize: true,
      title: '**10% cashback** en cripto',
      detail: 'Tope USD 1.000 + invitación a **Partner**',
    },
  ] satisfies Milestone[],
  finePrint: [
    'H1/H5: uso único, 30 días; no aplican a Prime 1MM, Prime 2MM ni Fondeo Directo 100K.',
    'H3/H8: intransferibles, 90 días para activar.',
    'H7: cuentas Una Fase o Dos Fases hasta 100K, excepto Fondeo Directo.',
  ],
  /** Ritmo de la escalera (frames). */
  timing: {start: 40, prizeGap: 62, fillerGap: 24, finePrintDelay: 24},
};

export const ritmo = {
  title: 'Mantené el ritmo.',
  rule: 'Necesitás al menos **1 venta válida por mes calendario**.',
  counterLabel: 'Hitos',
  months: [
    {label: 'Mes 1', sales: 1},
    {label: 'Mes 2', sales: 2},
    {label: 'Mes 3', sales: 1},
    {label: 'Mes 4', sales: 0},
  ],
  salesLabel: (n: number) => (n === 1 ? '1 venta' : `${n} ventas`),
  reset: 'Si un mes cierra en cero, tu progreso vuelve a 0.',
  keep: 'Los premios que ya recibiste **son tuyos**.',
};

export const partner = {
  ringLabel: '10/10',
  badge: 'Partner',
  statement: 'Completá los 10 hitos y te invitamos a ser **Partner** de Impulse World.',
  finePrint: 'La invitación es única. El C2C es solo para clientes: los Partners no participan.',
};

export const cta = {
  hero: 'Sé parte del **C2C.**',
  sub: 'Códigos disponibles desde el **30 de septiembre · 21:00 (Lima)**',
  button: 'Quiero mi código',
  url: URL_CTA,
};

/** Catalogo ampliado (Grok). Se concatena a MINISTERS en cabinet.ts. */
export const EXTRA_MINISTERS = [
  {
    id: 'eco_sindical',
    name: 'H. Pereyra',
    seat: 'economia' as const,
    party: 'aliado' as const,
    title: 'El economista sindical',
    description: 'Defiende salario y empleo publico. La calle lo aplaude; el deficit lo sufre.',
    passive: { happiness: 0.35, unemployment: -0.05, fiscal_balance: -0.08 },
    discount: { category: 'interior' as const, factor: 0.9 },
    voteBonus: 2,
    seats: 7
  },
  {
    id: 'eco_liberal',
    name: 'L. Koren',
    seat: 'economia' as const,
    party: 'oficialismo' as const,
    title: 'La liberal de libros',
    description: 'Quiere superavit y reglas. Premia la caja y castiga el gasto facil.',
    passive: { fiscal_balance: 0.12, inflation: -0.2, happiness: -0.25 },
    discount: { category: 'economia' as const, factor: 0.82 },
    voteBonus: -2
  },
  {
    id: 'int_dialoguista',
    name: 'N. Quiroga',
    seat: 'interior' as const,
    party: 'oficialismo' as const,
    title: 'El dialoguista',
    description: 'Mesa con gobernadores y sindicatos. Compra paz social con caja.',
    passive: { happiness: 0.3, stability: 0.25, fiscal_balance: -0.06 },
    discount: { category: 'interior' as const, factor: 0.88 }
  },
  {
    id: 'int_opositor',
    name: 'D. Funes',
    seat: 'interior' as const,
    party: 'oposicion' as const,
    title: 'El intendente prestado',
    description: 'Trae territorio y escanos. Cada tanto pide obra en su distrito.',
    passive: { stability: 0.25, capitalPerTurn: 0.4 },
    voteBonus: 3,
    seats: 9
  },
  {
    id: 'ext_duro',
    name: 'G. Roldan',
    seat: 'exterior' as const,
    party: 'oficialismo' as const,
    title: 'El halcon',
    description: 'Habla fuerte afuera. Gana prestigio con aliados duros y tensa con el resto.',
    passive: { capitalPerTurn: 0.3 },
    discount: { category: 'defensa' as const, factor: 0.9 },
    voteBonus: 1
  },
  {
    id: 'def_profesional',
    name: 'C. Beltran',
    seat: 'defensa' as const,
    party: 'oficialismo' as const,
    title: 'El profesional de carrera',
    description: 'Prioriza doctrina y presupuesto estable. Poco show, menos improvisacion.',
    passive: { stability: 0.2 },
    discount: { category: 'defensa' as const, factor: 0.85 }
  },
  {
    id: 'def_opositor',
    name: 'I. Marquez',
    seat: 'defensa' as const,
    party: 'oposicion' as const,
    title: 'El general retirado',
    description: 'Suma escanos del centro-derecha. Pide modernizacion o se enoja.',
    passive: { stability: 0.15 },
    voteBonus: 2,
    seats: 6
  },
  {
    id: 'jef_comunicador',
    name: 'E. Soria',
    seat: 'jefatura' as const,
    party: 'oficialismo' as const,
    title: 'El armador de relato',
    description: 'Coordina mensajes y agenda. Capital politico a cambio de menos foco en la calle real.',
    passive: { capitalPerTurn: 1.0, happiness: 0.15, stability: -0.1 },
    discount: { category: 'comunicacion' as const, factor: 0.8 }
  }
] as const;

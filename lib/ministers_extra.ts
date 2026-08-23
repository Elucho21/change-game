/** Catalogo ampliado (Grok). Se concatena a MINISTERS en cabinet.ts.
 *
 * Reglas de balance (no romper):
 * - Pasivos 0.1–0.6 por métrica, capitalPerTurn hasta 1.5. Se aplican TODOS los meses.
 * - Todo ministro bueno en algo es malo en otra. Ninguno es el obvio.
 * - discount 0.75–0.95. Menos de 0.75 vuelve gratis la categoría.
 * - Opositores/aliados: 6–14 escaños y voteBonus 2–5 (pasan factura cada 7 meses).
 *
 * Impacto ideologico (pedido cerrado en PEDIDOS_A_OPUS.md, cableado en
 * lib/cabinet.ts + lib/simulation.ts + lib/store.ts):
 *   alignment, relationDrift, investmentMod, unionPower, diplomaticCapitalBonus
 */
export const EXTRA_MINISTERS = [
  // ---------------------------------------------------------- economia
  {
    id: 'eco_sindical',
    name: 'H. Pereyra',
    seat: 'economia' as const,
    party: 'aliado' as const,
    title: 'El economista sindical',
    description: 'Defiende salario y empleo publico. La calle lo aplaude; el deficit y la inversion lo sufren.',
    passive: { happiness: 0.35, unemployment: -0.08, fiscal_balance: -0.1, gdp_growth: -0.05 },
    discount: { category: 'interior' as const, factor: 0.9 },
    voteBonus: 2,
    seats: 7,
    unionPower: 0.3,
    investmentMod: -0.15
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
    voteBonus: -2,
    investmentMod: 0.12,
    unionPower: -0.1
  },
  {
    id: 'eco_promercado',
    name: 'F. Belmonte',
    seat: 'economia' as const,
    party: 'oficialismo' as const,
    title: 'El pro-mercado',
    description: 'Atrae inversion y ordena precios. La calle y los sindicatos lo odian.',
    passive: { gdp_growth: 0.15, inflation: -0.15, fiscal_balance: 0.08, happiness: -0.35, unemployment: 0.05 },
    discount: { category: 'economia' as const, factor: 0.78 },
    voteBonus: -3,
    investmentMod: 0.25,
    unionPower: -0.2
  },
  {
    id: 'eco_socialista',
    name: 'M. Cardozo',
    seat: 'economia' as const,
    party: 'aliado' as const,
    title: 'La socialista de la mesa',
    description: 'Potencia sindicatos y gasto social. El deficit crece y el capital se va.',
    passive: { happiness: 0.4, unemployment: -0.1, fiscal_balance: -0.15, gdp_growth: -0.1, inflation: 0.15 },
    discount: { category: 'interior' as const, factor: 0.85 },
    voteBonus: 3,
    seats: 8,
    unionPower: 0.4,
    investmentMod: -0.25
  },
  {
    id: 'eco_desarrollista_extra',
    name: 'T. Varela',
    seat: 'economia' as const,
    party: 'oficialismo' as const,
    title: 'El industrialista',
    description: 'Apoya la industria nacional con credito y proteccion. Crece, pero los precios suben.',
    passive: { gdp_growth: 0.18, inflation: 0.25, fiscal_balance: -0.06, happiness: 0.15 },
    discount: { category: 'comercio' as const, factor: 0.88 }
  },

  // ---------------------------------------------------------- interior
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
    id: 'int_mano_dura',
    name: 'R. Salinas',
    seat: 'interior' as const,
    party: 'oficialismo' as const,
    title: 'La mano dura de provincia',
    description: 'Orden y seguridad primero. Baja el delito percibido y tensa con la calle.',
    passive: { stability: 0.5, happiness: -0.3 },
    discount: { category: 'interior' as const, factor: 0.85 },
    voteBonus: -1
  },
  {
    id: 'int_sindicalista',
    name: 'A. Figueroa',
    seat: 'interior' as const,
    party: 'aliado' as const,
    title: 'El sindicalista de carrera',
    description: 'La CGT le responde. Paz social cara: gasto y menos flexibilidad laboral.',
    passive: { happiness: 0.35, stability: 0.2, fiscal_balance: -0.08, gdp_growth: -0.05 },
    discount: { category: 'interior' as const, factor: 0.82 },
    voteBonus: 2,
    seats: 6,
    unionPower: 0.35
  },

  // ---------------------------------------------------------- exterior
  {
    id: 'ext_duro',
    name: 'G. Roldan',
    seat: 'exterior' as const,
    party: 'oficialismo' as const,
    title: 'El halcon',
    description: 'Habla fuerte afuera. Gana prestigio con aliados duros y tensa con el resto.',
    passive: { capitalPerTurn: 0.3 },
    discount: { category: 'defensa' as const, factor: 0.9 },
    voteBonus: 1,
    alignment: 'west' as const,
    diplomaticCapitalBonus: 0.1
  },
  {
    id: 'ext_atlantista',
    name: 'C. Villanueva',
    seat: 'exterior' as const,
    party: 'oficialismo' as const,
    title: 'La atlantista',
    description: 'Prioriza EE.UU., OTAN y el G7. Las puertas del Norte se abren; el Sur y China se enfrian.',
    passive: { capitalPerTurn: 0.5, gdp_growth: 0.05 },
    discount: { category: 'diplomacia' as const, factor: 0.75 },
    voteBonus: 1,
    alignment: 'west' as const,
    relationDrift: [{ target: 'USA', amount: 0.4 }, { target: 'China', amount: -0.25 }],
    diplomaticCapitalBonus: 0.2
  },
  {
    id: 'ext_multipolar',
    name: 'L. Zhao',
    seat: 'exterior' as const,
    party: 'aliado' as const,
    title: 'El multipolar',
    description: 'Mira a China, BRICS y el Sur Global. Comercio e infraestructura; los mercados occidentales miran de reojo.',
    passive: { gdp_growth: 0.12, capitalPerTurn: 0.2 },
    discount: { category: 'comercio' as const, factor: 0.8 },
    seats: 5,
    alignment: 'east' as const,
    relationDrift: [{ target: 'China', amount: 0.4 }, { target: 'USA', amount: -0.2 }],
    diplomaticCapitalBonus: 0.1
  },
  {
    id: 'ext_regional',
    name: 'S. Almiron',
    seat: 'exterior' as const,
    party: 'oficialismo' as const,
    title: 'El regionalista',
    description: 'MERCOSUR, CELAC y la vecindad primero. Integra la region; el Norte queda en segundo plano.',
    passive: { stability: 0.15, capitalPerTurn: 0.35 },
    discount: { category: 'comercio' as const, factor: 0.78 },
    voteBonus: 1,
    alignment: 'regional' as const,
    relationDrift: [{ target: 'bloc:mercosur', amount: 0.3 }],
    diplomaticCapitalBonus: 0.15
  },
  {
    id: 'ext_noalineado',
    name: 'P. Benitez',
    seat: 'exterior' as const,
    party: 'oficialismo' as const,
    title: 'El no alineado',
    description: 'Equilibrio entre potencias. Menos regalos, menos enemigos. Capital diplomatico estable.',
    passive: { capitalPerTurn: 0.4, stability: 0.1 },
    discount: { category: 'diplomacia' as const, factor: 0.85 },
    alignment: 'nonaligned' as const,
    diplomaticCapitalBonus: 0.08
  },

  // ---------------------------------------------------------- defensa
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
    title: 'El general retirado de la oposicion',
    description: 'Suma escanos del centro-derecha. Pide modernizacion o se enoja.',
    passive: { stability: 0.15 },
    voteBonus: 2,
    seats: 6
  },
  {
    id: 'def_presupuesto',
    name: 'J. Montes',
    seat: 'defensa' as const,
    party: 'oficialismo' as const,
    title: 'El de presupuesto',
    description: 'Mas plata a las fuerzas, menos a otras areas. El cuartel contento, la caja menos.',
    passive: { stability: 0.3, fiscal_balance: -0.1 },
    discount: { category: 'defensa' as const, factor: 0.8 }
  },
  {
    id: 'def_civilista',
    name: 'A. Rios',
    seat: 'defensa' as const,
    party: 'oficialismo' as const,
    title: 'La civilista',
    description: 'Control civil estricto y recorte de gastos militares. Ahorra, genera ruido interno.',
    passive: { fiscal_balance: 0.12, stability: -0.2 },
    discount: { category: 'defensa' as const, factor: 0.95 }
  },

  // ---------------------------------------------------------- jefatura
  {
    id: 'jef_comunicador',
    name: 'E. Soria',
    seat: 'jefatura' as const,
    party: 'oficialismo' as const,
    title: 'El armador de relato',
    description: 'Coordina mensajes y agenda. Capital politico a cambio de menos foco en la calle real.',
    passive: { capitalPerTurn: 1.0, happiness: 0.15, stability: -0.1 },
    discount: { category: 'comunicacion' as const, factor: 0.8 }
  },
  {
    id: 'jef_operador_duro',
    name: 'M. Cordoba',
    seat: 'jefatura' as const,
    party: 'oficialismo' as const,
    title: 'El operador de hierro',
    description: 'Mantiene la disciplina interna a cualquier costo. Capital y estabilidad, humor social en baja.',
    passive: { capitalPerTurn: 1.2, stability: 0.25, happiness: -0.2 },
    discount: { category: 'interior' as const, factor: 0.9 }
  },
  {
    id: 'jef_coalicion_extra',
    name: 'V. Rucci',
    seat: 'jefatura' as const,
    party: 'oposicion' as const,
    title: 'El socio de la mesa chica',
    description: 'Bloque grande en el Congreso. Cada 7 meses cobra. Mientras tanto, te sostiene.',
    passive: { capitalPerTurn: 0.7, stability: 0.25 },
    voteBonus: 4,
    seats: 11
  }
] as const;

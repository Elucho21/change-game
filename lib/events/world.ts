import type { GameEvent } from '../types';

/**
 * Eventos MUNDIALES: le pasan al planeta, no a vos.
 * `worldEffects` se aplica a TODOS los paises; `effects` solo al jugador.
 * Muchos mueven variables globales (precio del petroleo, tension global).
 *
 * Efectos que duran: `worldOngoing` / `ongoing` se repiten CADA TURNO durante
 * `duration` turnos. `sectorEffects` golpea sectores concretos y pega distinto
 * en cada pais segun su estructura productiva.
 * Los tres eventos de abajo con estos campos son la referencia; el resto los
 * carga Grok (docs/PEDIDOS_A_GROK.md).
 */
export const WORLD_EVENTS: GameEvent[] = [
  {
    id: 'shock_petroleo',
    scope: 'mundial',
    title: 'Shock petrolero en el Golfo',
    emoji: '🛢️',
    tags: ['energia', 'crisis'],
    weight: 9,
    duration: 3,
    description:
      'Ataques a instalaciones petroleras sacan del mercado varios millones de barriles diarios. El barril salta 15%.',
    worldEffects: { inflation: 0.8 },
    worldOngoing: { inflation: 0.2 },
    sectorEffects: { industry: -12 },
    effects: { oil_price: 12, global_tension: 5 }
  },
  {
    id: 'recesion_global',
    scope: 'mundial',
    title: 'Recesion global sincronizada',
    emoji: '📉',
    tags: ['economia', 'crisis'],
    weight: 6,
    duration: 4,
    description:
      'Las principales economias entran en contraccion al mismo tiempo. Cae el comercio mundial y se secan los mercados de credito.',
    worldEffects: { unemployment: 0.5, fiscal_balance: -0.4 },
    // la recesion no es un golpe y listo: cobra todos los meses que dura
    worldOngoing: { gdp_growth: -0.25, unemployment: 0.15 },
    ongoing: { happiness: -1 },
    sectorEffects: { industry: -12, commerce: -8 },
    effects: { global_tension: 4 }
  },
  {
    id: 'pandemia',
    scope: 'mundial',
    title: 'Brote viral con potencial pandemico',
    emoji: '🦠',
    tags: ['salud', 'crisis'],
    weight: 4,
    duration: 4,
    description:
      'Un nuevo virus respiratorio se expande desde Asia. Los mercados descuentan restricciones de movilidad.',
    worldEffects: { happiness: -3, fiscal_balance: -0.5 },
    worldOngoing: { happiness: -1.2, fiscal_balance: -0.2 },
    ongoing: { stability: -0.8 },
    sectorEffects: { tourism: -35, services: -10 },
    effects: { global_tension: 3 },
    choices: [
      {
        id: 'cerrar_fronteras',
        label: 'Cerrar fronteras de inmediato',
        detail: 'Contenes el contagio y frenas el turismo y el comercio.',
        cost: { capital: 10 },
        effects: { happiness: -2, gdp_growth: -0.6, stability: 3 },
        relations: [{ target: 'vecinos', amount: -8 }]
      },
      {
        id: 'vacunas',
        label: 'Comprar vacunas por adelantado',
        detail: 'Fuerte desembolso ahora para no llegar tarde despues.',
        cost: { capital: 6, fiscal: 0.8 },
        effects: { fiscal_balance: -0.8, happiness: 3, stability: 2 }
      },
      {
        id: 'esperar',
        label: 'Esperar la evidencia antes de actuar',
        detail: 'Cero costo hoy. Si escala, llegas tarde.',
        effects: {},
        risk: { chance: 0.5, label: 'El brote escala antes de que reacciones', effects: { happiness: -6, gdp_growth: -0.8, stability: -5 } }
      }
    ]
  },
  {
    id: 'guerra_comercial',
    scope: 'mundial',
    title: 'Guerra comercial entre potencias',
    emoji: '⚔️',
    tags: ['comercio', 'aranceles'],
    weight: 7,
    duration: 4,
    description:
      'Estados Unidos y China se aplican aranceles cruzados. Las cadenas de suministro se reordenan y todos eligen bando.',
    worldEffects: { inflation: 0.5 },
    worldOngoing: { inflation: 0.12, unemployment: 0.08 },
    sectorEffects: { commerce: -18, industry: -8 },
    effects: { global_tension: 6 },
    choices: [
      {
        id: 'alinear_usa',
        label: 'Alinearte con Estados Unidos',
        detail: 'Acceso preferencial a su mercado, portazo del otro lado.',
        cost: { capital: 10 },
        effects: { gdp_growth: 0.3 },
        relations: [
          { target: 'USA', amount: 15 },
          { target: 'China', amount: -20 }
        ]
      },
      {
        id: 'alinear_china',
        label: 'Profundizar el vinculo con China',
        detail: 'Inversion y swap de monedas a cambio de mirar distinto a Washington.',
        cost: { capital: 10 },
        effects: { gdp_growth: 0.35, gold_reserves_tonnes: 4 },
        relations: [
          { target: 'China', amount: 15 },
          { target: 'USA', amount: -18 }
        ]
      },
      {
        id: 'no_alineado',
        label: 'Mantenerte no alineado',
        detail: 'Vendes a los dos y ninguno te protege.',
        effects: { gdp_growth: -0.2 },
        relations: [{ target: 'todos', amount: 3 }]
      }
    ]
  },
  {
    id: 'guerra_regional',
    scope: 'mundial',
    title: 'Estalla una guerra regional',
    emoji: '💥',
    tags: ['conflicto', 'militar'],
    weight: 5,
    duration: 5,
    description:
      'Un conflicto armado escala en otra region del mundo. Suben la energia, los granos y el gasto militar global.',
    worldEffects: { inflation: 0.6, military_budget_bn: 0.5 },
    worldOngoing: { inflation: 0.15, military_budget_bn: 0.1 },
    ongoing: { happiness: -0.4 },
    sectorEffects: { industry: -6, agriculture: -8 },
    effects: { global_tension: 12, oil_price: 8 },
    choices: [
      {
        id: 'condenar',
        label: 'Condenar la invasion en Naciones Unidas',
        detail: 'Alineamiento occidental claro.',
        cost: { capital: 5 },
        effects: {},
        relations: [
          { target: 'USA', amount: 10 },
          { target: 'Russia', amount: -15 }
        ]
      },
      {
        id: 'neutral',
        label: 'Declarar neutralidad activa y ofrecerte como mediador',
        detail: 'Ganas prestigio diplomatico si el conflicto se negocia.',
        cost: { capital: 8 },
        effects: { capital: 10 },
        relations: [{ target: 'todos', amount: 5 }]
      },
      {
        id: 'vender_armas',
        label: 'Vender insumos y alimentos a ambos bandos',
        detail: 'Negocio redondo, costo reputacional alto.',
        effects: { gdp_growth: 0.6, fiscal_balance: 0.5, happiness: -2 },
        relations: [{ target: 'todos', amount: -6 }]
      }
    ]
  },
  {
    id: 'cierre_ormuz',
    scope: 'mundial',
    title: 'Cierre del Estrecho de Ormuz',
    emoji: '⛴️',
    tags: ['energia', 'rutas', 'crisis'],
    weight: 5,
    duration: 3,
    description:
      'Un incidente naval cierra el Estrecho de Ormuz. Una quinta parte del petroleo del mundo deja de pasar y los seguros maritimos se disparan.',
    disrupts: ['ormuz'],
    worldEffects: { inflation: 1.2 },
    worldOngoing: { inflation: 0.3 },
    sectorEffects: { industry: -15, commerce: -8 },
    effects: { global_tension: 9, oil_price: 18 }
  },
  {
    id: 'bloqueo_suez',
    scope: 'mundial',
    title: 'Bloqueo del Canal de Suez',
    emoji: '🚢',
    tags: ['rutas', 'comercio'],
    weight: 5,
    duration: 2,
    description:
      'Un portacontenedores encallado bloquea el canal. Los buques entre Asia y Europa deben rodear Africa: dos semanas mas de viaje.',
    disrupts: ['suez'],
    worldEffects: { inflation: 0.6 },
    worldOngoing: { inflation: 0.15 },
    sectorEffects: { commerce: -14 },
    effects: { global_tension: 3 }
  },
  {
    id: 'sequia_panama',
    scope: 'mundial',
    title: 'Sequia en el Canal de Panama',
    emoji: '🏜️',
    tags: ['rutas', 'clima', 'comercio'],
    weight: 5,
    duration: 4,
    description:
      'La bajante de los lagos obliga a limitar el calado y el numero de cruces diarios. Se forma una cola de buques de semanas.',
    disrupts: ['panama'],
    worldEffects: { inflation: 0.4 },
    worldOngoing: { inflation: 0.1 },
    sectorEffects: { commerce: -10 },
    effects: { global_tension: 2 }
  },
  {
    id: 'incidente_malaca',
    scope: 'mundial',
    title: 'Incidente en el Estrecho de Malaca',
    emoji: '⚓',
    tags: ['rutas', 'seguridad', 'comercio'],
    weight: 4,
    duration: 2,
    description:
      'Ataques a buques mercantes en Malaca frenan el trafico asiatico. Las navieras desvian rutas y suben tarifas.',
    disrupts: ['malaca'],
    worldEffects: { inflation: 0.7 },
    worldOngoing: { inflation: 0.15 },
    sectorEffects: { commerce: -12, industry: -6 },
    effects: { global_tension: 6, oil_price: 7 },
    choices: [
      {
        id: 'escoltar',
        label: 'Sumarte a la fuerza naval multinacional de escolta',
        detail: 'Aportas buques para reabrir la ruta. Caro, visible y bien visto por los socios comerciales.',
        cost: { capital: 12, fiscal: 0.4 },
        effects: { fiscal_balance: -0.4, global_tension: -2 },
        relations: [{ target: 'todos', amount: 7 }]
      },
      {
        id: 'esperar_malaca',
        label: 'No involucrarte y esperar',
        detail: 'Cero costo militar, pero el flete se te encarece igual.',
        effects: { inflation: 0.4 }
      }
    ]
  },
  {
    id: 'ciberataque',
    scope: 'mundial',
    title: 'Ciberataque a infraestructura critica',
    emoji: '🖥️',
    tags: ['tecnologia', 'seguridad'],
    weight: 6,
    duration: 2,
    description:
      'Una ola coordinada de ataques golpea bancos, puertos y redes electricas en varios paises. Nadie asume la autoria.',
    worldEffects: { stability: -2 },
    worldOngoing: { stability: -0.4 },
    sectorEffects: { services: -18, commerce: -8 },
    effects: { global_tension: 5 }
  },
  {
    id: 'cumbre_climatica',
    scope: 'mundial',
    title: 'Cumbre climatica mundial',
    emoji: '🌍',
    tags: ['clima', 'negociacion'],
    weight: 6,
    duration: 2,
    description:
      'Se negocia un acuerdo de metas de emisiones con financiamiento para paises en desarrollo.',
    choices: [
      {
        id: 'firmar',
        label: 'Firmar metas ambiciosas',
        detail: 'Acceso a fondos verdes y costos para tu industria pesada.',
        cost: { capital: 8 },
        effects: { gdp_growth: -0.2, fiscal_balance: 0.4, happiness: 2 },
        relations: [{ target: 'todos', amount: 8 }]
      },
      {
        id: 'firmar_light',
        label: 'Firmar metas moderadas',
        detail: 'Compromiso realista, aplauso tibio.',
        effects: { happiness: 1 },
        relations: [{ target: 'todos', amount: 3 }]
      },
      {
        id: 'rechazar',
        label: 'No firmar y proteger tu industria',
        detail: 'Cero costo interno, aislamiento diplomatico.',
        effects: { gdp_growth: 0.2 },
        relations: [{ target: 'todos', amount: -8 }]
      }
    ]
  },
  {
    id: 'ampliacion_otan',
    scope: 'mundial',
    title: 'La OTAN abre una ronda de ampliacion',
    emoji: '🛡️',
    tags: ['alianzas', 'militar'],
    weight: 4,
    duration: 3,
    description:
      'La alianza atlantica anuncia que estudiara nuevas incorporaciones. Moscu advierte que responderia con despliegues.',
    effects: { global_tension: 7 }
  },
  {
    id: 'cumbre_brics',
    scope: 'mundial',
    title: 'Cumbre BRICS+ y desdolarizacion',
    emoji: '🤝',
    tags: ['alianzas', 'economia'],
    weight: 5,
    duration: 2,
    description:
      'El bloque anuncia una nueva moneda de comercio y amplia su banco de desarrollo. Se abren invitaciones.',
    effects: { global_tension: 3 }
  },
  {
    id: 'crisis_migratoria',
    scope: 'mundial',
    title: 'Crisis migratoria global',
    emoji: '🚶',
    tags: ['migracion', 'crisis'],
    weight: 5,
    duration: 3,
    description:
      'Millones de personas se desplazan por conflictos y sequias. Los paises receptores endurecen sus fronteras.',
    worldEffects: { stability: -2, happiness: -2 },
    worldOngoing: { stability: -0.5, happiness: -0.5 },
    ongoing: { stability: -0.4 },
    effects: { global_tension: 4 }
  },
  {
    id: 'boom_ia',
    scope: 'mundial',
    title: 'Salto tecnologico en IA y semiconductores',
    emoji: '🤖',
    tags: ['tecnologia'],
    weight: 6,
    duration: 4,
    description:
      'Una nueva generacion de chips cambia el balance productivo. Los paises que invierten se despegan del resto.',
    worldEffects: { gdp_growth: 0.2 },
    worldOngoing: { gdp_growth: 0.05 },
    effects: { global_tension: 2 },
    choices: [
      {
        id: 'invertir',
        label: 'Plan nacional de semiconductores e IA',
        detail: 'Apuesta cara de retorno lento y enorme.',
        cost: { capital: 12, fiscal: 1 },
        effects: { fiscal_balance: -1, gdp_growth: 0.8, unemployment: -0.3 }
      },
      {
        id: 'importar',
        label: 'Importar tecnologia y capacitar mano de obra',
        detail: 'Barato y rapido, sin soberania tecnologica.',
        cost: { capital: 5, fiscal: 0.3 },
        effects: { fiscal_balance: -0.3, gdp_growth: 0.3 }
      },
      {
        id: 'nada',
        label: 'No hacer nada por ahora',
        detail: 'La brecha con los que invierten se agranda cada turno.',
        effects: { gdp_growth: -0.2 }
      }
    ]
  },
  {
    id: 'colapso_commodities',
    scope: 'mundial',
    title: 'Derrumbe de los precios de commodities',
    emoji: '📊',
    tags: ['economia', 'crisis'],
    weight: 6,
    duration: 3,
    description:
      'La demanda china se enfria y los precios de metales y granos se derrumban. Los exportadores primarios sufren.',
    worldOngoing: { unemployment: 0.1, fiscal_balance: -0.1 },
    sectorEffects: { agriculture: -20, industry: -8 },
    effects: { oil_price: -10 }
  },
  {
    id: 'crisis_deuda_emergentes',
    scope: 'mundial',
    title: 'Crisis de deuda en emergentes',
    emoji: '🏚️',
    tags: ['economia', 'deuda'],
    weight: 5,
    duration: 3,
    description:
      'La suba de tasas en el mundo desarrollado dispara defaults en cadena. El credito para emergentes se cierra.',
    worldEffects: { debt_to_gdp: 2, inflation: 0.4 },
    worldOngoing: { gdp_growth: -0.1, unemployment: 0.1, debt_to_gdp: 0.4 },
    effects: { global_tension: 3 }
  },
  {
    id: 'desastre_climatico',
    scope: 'mundial',
    title: 'Temporada extrema de desastres climaticos',
    emoji: '🌀',
    tags: ['clima', 'crisis'],
    weight: 6,
    duration: 2,
    description:
      'Huracanes, inundaciones e incendios golpean varias regiones al mismo tiempo. Reconstruccion cara en todas partes.',
    worldEffects: { fiscal_balance: -0.3, happiness: -2 },
    worldOngoing: { fiscal_balance: -0.1, happiness: -0.5 },
    sectorEffects: { agriculture: -18, tourism: -12 },
    effects: { global_tension: 2 }
  }
];

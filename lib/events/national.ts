import type { GameEvent } from '../types';

/**
 * Eventos NACIONALES y PERSONALES.
 * Cada evento tiene `when` (condicion para poder dispararse) y `weight` (peso
 * relativo en el sorteo). Los eventos con `choices` frenan el turno y esperan
 * la decision del jugador; los que no, se aplican solos.
 *
 * Para agregar uno nuevo: copia un bloque, cambia el id (unico) y sumalo al array.
 */
export const NATIONAL_EVENTS: GameEvent[] = [
  {
    id: 'piquete',
    scope: 'nacional',
    title: 'Piquetes y cortes de ruta',
    emoji: '🚧',
    tags: ['protesta', 'interior', 'sindicatos'],
    weight: 10,
    duration: 2,
    description:
      'Organizaciones sociales cortan los accesos a la capital y las rutas troncales. La logistica esta paralizada y las camaras empresarias reclaman al gobierno.',
    when: (c) => c.player.population.happiness < 62 || c.player.economy.unemployment > 8,
    ongoing: { gdp_growth: -0.08, happiness: -0.5 },
    choices: [
      {
        id: 'reprimir',
        label: 'Despejar las rutas con fuerzas federales',
        detail: 'Orden restablecido en 48 horas, pero la imagen del operativo da la vuelta al mundo.',
        cost: { capital: 15 },
        effects: { stability: 4, happiness: -6, gdp_growth: 0.1 },
        groupEffects: { alta: 1, obrera: -3 },
        risk: {
          chance: 0.3,
          label: 'Un manifestante herido convierte la protesta en crisis nacional',
          effects: { stability: -12, happiness: -8 }
        }
      },
      {
        id: 'negociar',
        label: 'Abrir una mesa de negociacion con los dirigentes',
        detail: 'Se levantan los cortes a cambio de ampliar planes sociales. Cuesta plata y autoridad.',
        cost: { capital: 8, fiscal: 0.4 },
        effects: { happiness: 3, stability: 1, fiscal_balance: -0.4, inflation: 0.2 },
        groupEffects: { obrera: 2 }
      },
      {
        id: 'ignorar',
        label: 'No ceder y esperar a que se desgasten',
        detail: 'Sin represion ni concesiones. El conflicto se estira y la economia lo paga.',
        effects: { happiness: -3, stability: -3, gdp_growth: -0.3 },
        groupEffects: { obrera: -1, claseMedia: -1 }
      }
    ]
  },
  {
    id: 'paro_general',
    scope: 'nacional',
    title: 'Paro general de la central sindical',
    emoji: '✊',
    tags: ['protesta', 'sindicatos', 'economia'],
    weight: 8,
    duration: 1,
    description:
      'La central obrera convoca a un paro de 24 horas contra el rumbo economico. Transporte, bancos y escuelas sin actividad.',
    when: (c) => c.player.economy.inflation > 12 || c.player.economy.unemployment > 9,
    choices: [
      {
        id: 'paritaria',
        label: 'Convocar a paritarias de emergencia',
        detail: 'Aumento salarial por encima de la inflacion proyectada. Calma la calle, alimenta la nominalidad.',
        cost: { capital: 10 },
        effects: { happiness: 5, stability: 3, inflation: 1.2, fiscal_balance: -0.5 },
        groupEffects: { obrera: 3, empresarios: -2 }
      },
      {
        id: 'firmeza',
        label: 'Sostener el plan sin cambios',
        detail: 'El gobierno no se mueve. Los mercados aplauden, la calle no.',
        cost: { capital: 12 },
        effects: { happiness: -5, stability: -4, inflation: -0.4, fiscal_balance: 0.3 },
        groupEffects: { empresarios: 2, obrera: -3 }
      },
      {
        id: 'bono',
        label: 'Bono compensatorio por unica vez',
        detail: 'Un pago extraordinario que no entra al salario base. Parche de corto plazo.',
        cost: { capital: 5, fiscal: 0.6 },
        effects: { happiness: 3, stability: 1, fiscal_balance: -0.6, inflation: 0.4 },
        groupEffects: { obrera: 1 }
      }
    ]
  },
  {
    id: 'marcha_opositora',
    scope: 'nacional',
    title: 'Marcha opositora masiva',
    emoji: '📣',
    tags: ['oposicion', 'politica'],
    weight: 8,
    duration: 1,
    description:
      'La oposicion llena la plaza central y exige un cambio de gabinete. La cobertura mediatica es total.',
    when: (c) => c.player.population.happiness < 58,
    choices: [
      {
        id: 'gabinete',
        label: 'Cambiar el gabinete economico',
        detail: 'Gesto fuerte de reaccion, pero admite que el rumbo fallaba.',
        cost: { capital: 12 },
        effects: { happiness: 4, stability: 2 },
        risk: {
          chance: 0.25,
          label: 'La interna del oficialismo estalla por las designaciones',
          effects: { stability: -8, happiness: -3 }
        }
      },
      {
        id: 'dialogo',
        label: 'Convocar a una mesa de dialogo nacional',
        detail: 'Sentar a oposicion, empresarios e iglesia. Lento, pero baja la temperatura.',
        cost: { capital: 8 },
        effects: { happiness: 2, stability: 4 }
      },
      {
        id: 'confrontar',
        label: 'Confrontar publicamente con la oposicion',
        detail: 'Polarizar consolida al nucleo duro y expulsa al votante moderado.',
        effects: { happiness: -4, stability: -2, capital: 5 }
      }
    ]
  },
  {
    id: 'juicio_politico',
    scope: 'nacional',
    title: 'La oposicion pide juicio politico',
    emoji: '⚖️',
    tags: ['oposicion', 'institucional'],
    weight: 5,
    duration: 3,
    description:
      'El bloque opositor reune firmas para iniciar un juicio politico. Necesitas votos propios y ajenos para frenarlo.',
    when: (c) => c.player.population.stability < 45,
    ongoing: { stability: -0.8, happiness: -0.4 },
    choices: [
      {
        id: 'negociar_votos',
        label: 'Negociar con gobernadores a cambio de fondos',
        detail: 'Los votos se consiguen, la caja se resiente y la prensa lo cuenta.',
        cost: { capital: 18, fiscal: 0.8 },
        effects: { stability: 8, fiscal_balance: -0.8, happiness: -2 }
      },
      {
        id: 'apelar_calle',
        label: 'Convocar a la militancia a defender el gobierno',
        detail: 'Movilizacion propia frente al Congreso. Alta apuesta.',
        cost: { capital: 10 },
        effects: { stability: 2, happiness: -1 },
        risk: {
          chance: 0.35,
          label: 'Choques entre militancias frente al Congreso',
          effects: { stability: -10, happiness: -6 }
        }
      },
      {
        id: 'dejar_correr',
        label: 'Dejar que el proceso siga su curso institucional',
        detail: 'Respeto por las formas. Meses de desgaste y titulares.',
        effects: { stability: -6, happiness: -2, capital: 4 }
      }
    ]
  },
  {
    id: 'corrupcion',
    scope: 'nacional',
    title: 'Escandalo de corrupcion en el gobierno',
    emoji: '💼',
    tags: ['escandalo', 'oposicion'],
    weight: 7,
    duration: 3,
    description:
      'Filtraciones comprometen a funcionarios de primera linea en la obra publica. La oposicion pide comision investigadora.',
    ongoing: { happiness: -0.6, stability: -0.4 },
    choices: [
      {
        id: 'echar',
        label: 'Echar a los involucrados de inmediato',
        detail: 'Corte rapido del sangrado, a costa de perder cuadros propios.',
        cost: { capital: 10 },
        effects: { happiness: 2, stability: 2 },
        groupEffects: { claseMedia: 1 }
      },
      {
        id: 'defender',
        label: 'Defenderlos y hablar de persecucion mediatica',
        detail: 'Se sostiene la tropa, pero la sociedad lo lee como encubrimiento.',
        effects: { happiness: -7, stability: -4, capital: 3 },
        groupEffects: { alta: 1, claseMedia: -2 }
      },
      {
        id: 'auditoria',
        label: 'Abrir una auditoria externa e independiente',
        detail: 'Transparencia total: te expone hoy, te fortalece si sobrevivis.',
        cost: { capital: 6 },
        effects: { happiness: 4, stability: -2 },
        groupEffects: { claseMedia: 2, alta: -1 },
        risk: {
          chance: 0.4,
          label: 'La auditoria encuentra mas de lo esperado',
          effects: { happiness: -6, stability: -6 }
        }
      }
    ]
  },
  {
    id: 'corrida_cambiaria',
    scope: 'nacional',
    title: 'Corrida cambiaria',
    emoji: '💸',
    tags: ['economia', 'crisis'],
    weight: 9,
    duration: 2,
    description:
      'El tipo de cambio se dispara, las reservas caen y los importadores frenan operaciones. El mercado testea al Banco Central.',
    when: (c) =>
      c.player.economy.inflation > 20
      || c.player.economy.fiscal_balance < -3.5
      || (c.fx ?? 100) >= 115,
    ongoing: { inflation: 0.3, happiness: -0.5 },
    choices: [
      {
        id: 'tasa',
        label: 'Subir fuerte la tasa de interes',
        detail: 'Frena la corrida y frena tambien la actividad. La tasa del Banco Central sube 3 puntos y pega desde el mes que viene.',
        cost: { capital: 8 },
        effects: { gdp_growth: -0.8, unemployment: 0.4, happiness: -3 },
        groupEffects: { empresarios: -1 },
        rateEffect: 3
      },
      {
        id: 'vender_reservas',
        label: 'Vender reservas para sostener el tipo de cambio',
        detail: 'Calma inmediata, municion cada vez mas escasa.',
        effects: { gold_reserves_tonnes: -8, inflation: -1, happiness: 1 },
        groupEffects: { alta: 1 },
        risk: {
          chance: 0.45,
          label: 'El mercado detecta la debilidad y la corrida se acelera',
          effects: { inflation: 3, gold_reserves_tonnes: -10, stability: -5 }
        }
      },
      {
        id: 'cepo',
        label: 'Imponer controles de cambio',
        detail: 'Freno administrativo: la brecha aparece y el comercio se complica.',
        cost: { capital: 12 },
        effects: { inflation: -1.5, gdp_growth: -0.5, stability: 2, happiness: -4 },
        groupEffects: { alta: -3, empresarios: -2 }
      }
    ]
  },
  {
    id: 'fmi_watch',
    scope: 'nacional',
    title: 'El FMI pone al pais bajo observacion',
    emoji: '🔎',
    tags: ['economia', 'deuda', 'fmi'],
    weight: 7,
    duration: 1,
    description:
      'El staff del Fondo publica un reporte. Todavia no hay mision, pero los mercados ya lo leen como una senal.',
    when: (c) => c.imf?.stage === 'watch',
    choices: [
      {
        id: 'anticipar',
        label: 'Anticipar un ajuste para salir del radar',
        detail: 'Corta el riesgo. Cuesta humor y actividad.',
        cost: { capital: 10 },
        effects: { fiscal_balance: 0.8, happiness: -4, gdp_growth: -0.3 },
        groupEffects: { empresarios: 1 }
      },
      {
        id: 'dialogo_tecnico',
        label: 'Recibir a los tecnicos y ganar tiempo',
        detail: 'Senal de cooperacion, sin compromiso fiscal duro.',
        cost: { capital: 6 },
        effects: { stability: 1, inflation: 0.2 }
      },
      {
        id: 'ignorar_reporte',
        label: 'Ignorar el reporte y seguir el rumbo',
        detail: 'Soberania retorica. El mercado cobra un recargo.',
        effects: { happiness: 2, inflation: 0.5, fiscal_balance: -0.2 },
        groupEffects: { empresarios: -1 }
      }
    ]
  },
  {
    id: 'fmi',
    scope: 'nacional',
    title: 'Vencimiento con el FMI',
    emoji: '🏦',
    tags: ['economia', 'deuda', 'negociacion'],
    weight: 6,
    duration: 2,
    description:
      'Se acerca un vencimiento grande con el Fondo. La mision tecnica pide metas fiscales mas duras para liberar el desembolso.',
    when: (c) => c.imf ? c.imf.weight >= 5 : c.player.economy.debt_to_gdp > 60,
    ongoing: { inflation: 0.15, happiness: -0.3 },
    choices: [
      {
        id: 'acordar',
        label: 'Firmar el acuerdo con metas de ajuste',
        detail: 'Entran los dolares, entra tambien el programa de ajuste.',
        cost: { capital: 14 },
        effects: { fiscal_balance: 1.2, debt_to_gdp: -2, happiness: -6, gdp_growth: -0.4, inflation: -1 },
        groupEffects: { empresarios: 2, obrera: -3, claseMedia: -1 }
      },
      {
        id: 'renegociar',
        label: 'Renegociar plazos sin nuevas metas',
        detail: 'Ganas tiempo. El mercado descuenta que el problema sigue ahi.',
        cost: { capital: 10 },
        effects: { debt_to_gdp: 1, inflation: 0.5 }
      },
      {
        id: 'default',
        label: 'Declarar que no se paga',
        detail: 'Alivio de caja inmediato y salida del credito internacional.',
        cost: { capital: 25 },
        effects: { fiscal_balance: 1.5, debt_to_gdp: -6, inflation: 4, gdp_growth: -1.5, happiness: -5, stability: -8 },
        groupEffects: { empresarios: -3, alta: -2 },
        relations: [{ target: 'todos', amount: -12 }]
      }
    ]
  },
  {
    id: 'sequia',
    scope: 'nacional',
    title: 'Sequia severa en la zona agricola',
    emoji: '🌵',
    tags: ['clima', 'economia'],
    weight: 6,
    duration: 3,
    description:
      'La falta de lluvias castiga la cosecha. Caen las exportaciones y la recaudacion por retenciones.',
    when: (c) => (c.player.sectors?.agriculture ?? 0) >= 5,
    // el golpe va por sector: castiga a los paises agricolas y no a los demas
    sectorEffects: { agriculture: -25 },
    ongoing: { fiscal_balance: -0.15, inflation: 0.2 },
    effects: { happiness: -2 }
  },
  {
    id: 'boom_commodities',
    scope: 'nacional',
    title: 'Boom de precios de commodities',
    emoji: '🌾',
    tags: ['economia', 'suerte'],
    weight: 6,
    duration: 3,
    description:
      'Los precios internacionales de tus principales exportaciones se disparan. Entran dolares frescos.',
    when: (c) => (c.player.sectors?.agriculture ?? 0) >= 5,
    ongoing: { gdp_growth: 0.15, fiscal_balance: 0.1 },
    choices: [
      {
        id: 'ahorrar',
        label: 'Acumular reservas con la lluvia de dolares',
        detail: 'Colchon para la proxima crisis. Nadie te lo agradece hoy.',
        effects: { gold_reserves_tonnes: 12, fiscal_balance: 0.8, gdp_growth: 0.5 }
      },
      {
        id: 'gastar',
        label: 'Volcar el extra a obra publica y salarios',
        detail: 'Actividad y humor social arriba, ancla fiscal abajo.',
        effects: { happiness: 6, gdp_growth: 0.9, inflation: 0.8, fiscal_balance: -0.3 },
        groupEffects: { obrera: 2, claseMedia: 1 }
      },
      {
        id: 'retenciones',
        label: 'Bajar retenciones para incentivar la siembra',
        detail: 'El campo festeja, la caja pierde.',
        cost: { capital: 6 },
        effects: { gdp_growth: 0.7, fiscal_balance: -0.7, happiness: 2 },
        groupEffects: { empresarios: 3 }
      }
    ]
  },
  {
    id: 'motin_policial',
    scope: 'nacional',
    title: 'Motin policial por salarios',
    emoji: '🚔',
    tags: ['seguridad', 'crisis', 'sindicatos'],
    weight: 4,
    duration: 2,
    description:
      'Efectivos policiales se acuartelan y reclaman aumentos. Las calles quedan sin control preventivo.',
    when: (c) => c.player.population.stability < 55 && c.player.economy.inflation > 8,
    ongoing: { stability: -0.6, happiness: -0.4 },
    choices: [
      {
        id: 'ceder',
        label: 'Otorgar el aumento reclamado',
        detail: 'Se levanta el motin y todos los gremios toman nota.',
        cost: { capital: 12, fiscal: 0.5 },
        effects: { stability: 5, fiscal_balance: -0.5, happiness: -2, inflation: 0.3 }
      },
      {
        id: 'militar',
        label: 'Desplegar al ejercito para cubrir la seguridad',
        detail: 'Medida excepcional que la region mira con atencion.',
        cost: { capital: 15 },
        effects: { stability: 3, happiness: -5 },
        relations: [{ target: 'vecinos', amount: -5 }]
      }
    ]
  },
  {
    id: 'apagon',
    scope: 'nacional',
    title: 'Apagon electrico nacional',
    emoji: '🔌',
    tags: ['infraestructura', 'crisis'],
    weight: 5,
    duration: 1,
    description:
      'Una falla en la red deja sin energia a millones de personas durante horas. La industria para.',
    sectorEffects: { industry: -8, services: -6 },
    effects: { happiness: -5, stability: -3 }
  },
  {
    id: 'inseguridad',
    scope: 'nacional',
    title: 'Ola de inseguridad y narcotrafico',
    emoji: '🔫',
    tags: ['seguridad', 'interior'],
    weight: 6,
    duration: 2,
    description:
      'Una serie de hechos violentos en la principal ciudad portuaria instala la inseguridad como tema numero uno.',
    ongoing: { happiness: -0.7, stability: -0.5 },
    choices: [
      {
        id: 'mano_dura',
        label: 'Plan de mano dura con despliegue federal',
        detail: 'Resultados visibles rapido, denuncias por abusos despues.',
        cost: { capital: 10, fiscal: 0.4 },
        effects: { happiness: 4, stability: 3, fiscal_balance: -0.4 },
        risk: { chance: 0.3, label: 'Denuncias de abusos empanan el operativo', effects: { happiness: -5, stability: -3 } }
      },
      {
        id: 'cooperacion',
        label: 'Pedir cooperacion regional contra el narcotrafico',
        detail: 'Inteligencia compartida con los vecinos. Resultados lentos y solidos.',
        cost: { capital: 6 },
        effects: { stability: 2, happiness: 1 },
        relations: [{ target: 'vecinos', amount: 8 }]
      }
    ]
  },
  {
    id: 'elecciones_medio_termino',
    scope: 'nacional',
    title: 'Elecciones de medio termino',
    emoji: '🗳️',
    tags: ['politica', 'oposicion'],
    weight: 3,
    duration: 1,
    description:
      'Se renueva parte del Congreso. El resultado define cuanto poder real te queda para gobernar.',
    when: (c) => c.turn > 10 && c.turn % 24 === 0,
    effects: { capital: 0 }
  },
  {
    id: 'ola_migratoria',
    scope: 'nacional',
    title: 'Ingreso masivo de migrantes',
    emoji: '🧳',
    tags: ['migracion', 'interior', 'region'],
    weight: 5,
    duration: 2,
    description:
      'La crisis de un pais vecino empuja una ola migratoria hacia tus provincias fronterizas.',
    ongoing: { stability: -0.3, happiness: -0.3 },
    choices: [
      {
        id: 'recibir',
        label: 'Abrir la frontera con plan de integracion',
        detail: 'Costo fiscal hoy, fuerza laboral manana, tension social en el medio.',
        cost: { capital: 8, fiscal: 0.5 },
        effects: { fiscal_balance: -0.5, happiness: -3, gdp_growth: 0.3 },
        relations: [{ target: 'vecinos', amount: 10 }]
      },
      {
        id: 'cerrar',
        label: 'Militarizar la frontera',
        detail: 'La opinion publica interna acompana, la region no.',
        cost: { capital: 10 },
        effects: { happiness: 3, stability: 1 },
        relations: [{ target: 'vecinos', amount: -12 }]
      }
    ]
  },
  {
    id: 'huelga_docente',
    scope: 'nacional',
    title: 'Huelga docente al inicio de clases',
    emoji: '🏫',
    tags: ['sindicatos', 'protesta'],
    weight: 6,
    duration: 2,
    description: 'Los gremios docentes no aceptan la oferta salarial y el ciclo lectivo no arranca.',
    when: (c) => c.player.economy.inflation > 6,
    ongoing: { happiness: -0.5, stability: -0.3 },
    choices: [
      {
        id: 'mejorar_oferta',
        label: 'Mejorar la oferta salarial',
        detail: 'Las clases arrancan; el resto de los gremios pide lo mismo.',
        cost: { capital: 6, fiscal: 0.4 },
        effects: { happiness: 4, fiscal_balance: -0.4, inflation: 0.3 }
      },
      {
        id: 'descontar',
        label: 'Descontar los dias de paro',
        detail: 'Firmeza fiscal, conflicto largo.',
        cost: { capital: 8 },
        effects: { happiness: -4, stability: -2, fiscal_balance: 0.2 }
      }
    ]
  },
  {
    id: 'inversion_extranjera',
    scope: 'nacional',
    title: 'Oleada de inversion extranjera',
    emoji: '🏗️',
    tags: ['economia', 'suerte'],
    weight: 5,
    duration: 3,
    description: 'Anuncios de nuevas plantas y proyectos energeticos elevan las expectativas del mercado.',
    when: (c) => c.player.population.stability > 55,
    ongoing: { gdp_growth: 0.15, unemployment: -0.08 },
    effects: { gdp_growth: 0.6, happiness: 2, stability: 2, unemployment: -0.3 }
  },

  // ---------- Eventos personales / de liderazgo ----------
  {
    id: 'salud_lider',
    scope: 'personal',
    title: 'Problema de salud del jefe de Estado',
    emoji: '🩺',
    tags: ['liderazgo'],
    weight: 3,
    duration: 2,
    description: 'Una internacion imprevista dispara rumores sobre la continuidad del gobierno.',
    ongoing: { stability: -0.4 },
    choices: [
      {
        id: 'transparencia',
        label: 'Publicar el parte medico completo',
        detail: 'Transparencia total: corta el rumor, muestra fragilidad.',
        effects: { stability: 2, happiness: 1, capital: -3 }
      },
      {
        id: 'silencio',
        label: 'Minimizar el tema y seguir la agenda',
        detail: 'Si se filtra algo peor, el costo se multiplica.',
        effects: { stability: -2 },
        risk: { chance: 0.4, label: 'Se filtra un diagnostico mas grave', effects: { stability: -8, happiness: -4 } }
      }
    ]
  },
  {
    id: 'crisis_gabinete',
    scope: 'personal',
    title: 'Crisis de gabinete',
    emoji: '🚪',
    tags: ['liderazgo', 'interna'],
    weight: 4,
    duration: 2,
    description: 'Renuncias en cadena y filtraciones internas obligan a reorganizar el gobierno.',
    ongoing: { stability: -0.5 },
    effects: { stability: -4, happiness: -2, capital: -5 }
  },
  {
    id: 'discurso_exitoso',
    scope: 'personal',
    title: 'Discurso que moviliza al pais',
    emoji: '🎙️',
    tags: ['liderazgo'],
    weight: 4,
    duration: 1,
    description: 'Un mensaje bien puesto en cadena nacional recompone la expectativa social.',
    when: (c) => c.player.population.happiness > 40,
    effects: { happiness: 4, stability: 2, capital: 6 }
  },
  {
    id: 'filtracion',
    scope: 'personal',
    title: 'Filtracion de audios privados',
    emoji: '📼',
    tags: ['escandalo', 'liderazgo'],
    weight: 3,
    duration: 2,
    description: 'Audios internos del circulo presidencial llegan a la prensa y dominan la agenda por semanas.',
    ongoing: { happiness: -0.5, stability: -0.4 },
    effects: { happiness: -4, stability: -3, capital: -6 }
  }
];

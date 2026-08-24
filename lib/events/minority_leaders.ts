import type { GameEvent } from '../types';

/**
 * Los 3 lideres minoritarios (Gustavo Comun, Amalia Verde, Jhon el Duro),
 * Change World Game v1.1, Sistema Moral.
 *
 * A diferencia de Enrique, estas 12 cartas SI pasan por el pool normal de
 * `rollEvents` (lib/engine.ts, scope 'nacional') — el doc no les pide el
 * tratamiento de pantalla completa. Se agregan a NATIONAL_EVENTS via
 * lib/boot_content.ts, mismo mecanismo que el resto del contenido de Grok.
 *
 * "Pobreza" e "Indices Ambientales"/"Inseguridad" no existen como KPIs en
 * el motor: Gustavo usa desempleo+felicidad como proxy; Amalia y Jhon leen
 * `ctx.moral?.environmentIndex`/`securityIndex` (dos diales livianos nuevos
 * de lib/moral.ts), disponibles recien despues del onboarding de Enrique.
 */
export const MINORITY_LEADER_EVENTS: GameEvent[] = [
  // ---------------------------------------------------------- Gustavo Comun
  {
    id: 'gc_toma_de_la_plaza',
    scope: 'nacional',
    title: 'Toma de la Plaza',
    emoji: '📢',
    tags: ['gustavo', 'protesta'],
    weight: 8,
    duration: 1,
    characterId: 'gustavo_comun',
    description:
      'Gustavo Comun: "¡El pueblo tomo la plaza porque ustedes no escuchan! O abren dialogo real o esto se va a poner mucho peor."',
    when: (c) => !!c.moral?.onboarded && c.player.economy.unemployment > 12,
    choices: [
      {
        id: 'negociar_ceder',
        label: 'Negociar y ceder algo social',
        detail: 'Compra paz a cambio de gasto.',
        effects: { happiness: 4, fiscal_balance: -0.4 },
        moralEffects: { gustavoApoyo: 1.5 }
      },
      {
        id: 'reprimir_desalojar',
        label: 'Reprimir y desalojar',
        detail: 'Orden restablecido. La imagen no ayuda.',
        effects: { happiness: -6, capital: 2 },
        moralEffects: { gustavoApoyo: 2 }
      },
      {
        id: 'ignorar_plaza',
        label: 'Ignorar',
        detail: 'El conflicto sigue su curso.',
        effects: {},
        moralEffects: { gustavoApoyo: 1, investigacion: 2 }
      }
    ]
  },
  {
    id: 'gc_huelga_general',
    scope: 'nacional',
    title: 'Huelga General',
    emoji: '✊',
    tags: ['gustavo', 'sindicatos'],
    weight: 7,
    duration: 1,
    characterId: 'gustavo_comun',
    description: 'Gustavo Comun: "Paramos el pais. O hay respuesta o hay mas paro."',
    when: (c) => !!c.moral?.onboarded && c.player.economy.unemployment > 10,
    choices: [
      {
        id: 'ceder_salarios',
        label: 'Ceder en salarios / subsidios',
        detail: 'La caja lo siente. La calle respira.',
        effects: { fiscal_balance: -0.8, happiness: 5 },
        moralEffects: { gustavoApoyo: -0.3 }
      },
      {
        id: 'aguantar_huelga',
        label: 'Aguantar la huelga',
        detail: 'El PBI del mes se resiente.',
        effects: { gdp_growth: -0.4, capital: -4 },
        moralEffects: { gustavoApoyo: 1.5 }
      },
      {
        id: 'dividir_movimiento',
        label: 'Dividir al movimiento (negociar con algunos sindicatos)',
        detail: 'Funciona a medias. Deja mal sabor.',
        effects: {},
        moralEffects: { corruption: 4, gustavoApoyo: -1 }
      }
    ]
  },
  {
    id: 'gc_nacionalizacion',
    scope: 'nacional',
    title: 'Propuesta de Nacionalizacion',
    emoji: '🏭',
    tags: ['gustavo'],
    weight: 5,
    duration: 1,
    characterId: 'gustavo_comun',
    description: 'Gustavo Comun: "Esa empresa tiene que ser del pueblo. Nacionalicen o van a tener el conflicto de sus vidas."',
    when: (c) => !!c.moral?.onboarded && c.player.economy.unemployment > 9,
    choices: [
      {
        id: 'anunciar_estudio',
        label: 'Anunciar estudio de nacionalizacion',
        detail: 'Los mercados se ponen nerviosos.',
        effects: { capital: -5, gdp_growth: -0.2 },
        moralEffects: { gustavoApoyo: 2 }
      },
      {
        id: 'rechazar_nacionalizacion',
        label: 'Rechazar de plano',
        detail: 'Los inversores respiran.',
        effects: { capital: 1 },
        moralEffects: { gustavoApoyo: 1.5 }
      },
      {
        id: 'participacion_parcial',
        label: 'Ofrecer participacion estatal parcial',
        detail: 'Un termino medio, caro pero menos ruidoso.',
        effects: { fiscal_balance: -0.3 },
        moralEffects: { gustavoApoyo: 0.8 }
      }
    ]
  },
  {
    id: 'gc_ataque_reforma_previsional',
    scope: 'nacional',
    title: 'Ataque a la Reforma Previsional',
    emoji: '👴',
    tags: ['gustavo', 'previsional'],
    weight: 6,
    duration: 1,
    characterId: 'gustavo_comun',
    description: 'Gustavo Comun: "Quieren robarle a los jubilados para pagarles a los bancos. ¡Esto no lo vamos a permitir!"',
    when: (c) => !!c.moral?.onboarded && c.player.economy.unemployment > 8,
    effects: { capital: -2 },
    moralEffects: { gustavoApoyo: 2 }
  },

  // ---------------------------------------------------------- Amalia Verde
  {
    id: 'av_bloqueo_mina',
    scope: 'nacional',
    title: 'Bloqueo a la Mina',
    emoji: '⛏️',
    tags: ['amalia', 'ambiente'],
    weight: 5,
    duration: 1,
    characterId: 'amalia_verde',
    description: 'Amalia Verde: "Ese proyecto es un crimen ambiental. Lo vamos a frenar en la calle, en la justicia y en los medios internacionales."',
    when: (c) => !!c.moral?.onboarded && (c.moral?.environmentIndex ?? 100) < 55,
    choices: [
      {
        id: 'suspender_proyecto',
        label: 'Suspender / reformular el proyecto',
        detail: 'Retraso economico, gana imagen ambiental.',
        effects: { gdp_growth: -0.2 },
        moralEffects: { amaliaApoyo: 1.5, environmentIndex: 4 }
      },
      {
        id: 'seguir_desalojar',
        label: 'Seguir adelante y desalojar',
        detail: 'Posible daño de imagen internacional.',
        effects: { capital: -3 },
        moralEffects: { amaliaApoyo: 2, environmentIndex: -3 }
      },
      {
        id: 'compensaciones_ambientales',
        label: 'Negociar compensaciones ambientales fuertes',
        detail: 'El proyecto avanza mas lento, cuesta caja.',
        effects: { fiscal_balance: -0.3 },
        moralEffects: { amaliaApoyo: 0.7, environmentIndex: 2 }
      }
    ]
  },
  {
    id: 'av_ley_proteccion_radical',
    scope: 'nacional',
    title: 'Ley de Proteccion Radical',
    emoji: '📜',
    tags: ['amalia'],
    weight: 4,
    duration: 1,
    characterId: 'amalia_verde',
    description: 'Amalia Verde: "Presentamos una ley que cambia las reglas del juego. O la apoyan o quedan del lado de los que destruyen."',
    when: (c) => !!c.moral?.onboarded && (c.moral?.environmentIndex ?? 100) < 60,
    choices: [
      {
        id: 'apoyar_ley',
        label: 'Apoyar la ley',
        detail: 'Imagen internacional sube, flexibilidad economica baja.',
        effects: { gdp_growth: -0.15 },
        moralEffects: { amaliaApoyo: 2, environmentIndex: 5 }
      },
      {
        id: 'diluir_ley',
        label: 'Diluir la ley en el Parlamento',
        detail: 'Queda en poco. Alguien lo nota.',
        effects: {},
        moralEffects: { amaliaApoyo: 0.5, corruption: 3 }
      },
      {
        id: 'rechazar_ley',
        label: 'Rechazar',
        detail: 'El descontento ambiental sube.',
        effects: {},
        moralEffects: { amaliaApoyo: 1.5, environmentIndex: -3 }
      }
    ]
  },
  {
    id: 'av_campana_internacional',
    scope: 'nacional',
    title: 'Campaña Internacional',
    emoji: '🌍',
    tags: ['amalia'],
    weight: 3,
    duration: 1,
    characterId: 'amalia_verde',
    urgency: 'important',
    description: 'Amalia Verde: "Ya estamos hablando con organismos internacionales. Esto no se queda en el pais."',
    when: (c) => !!c.moral?.onboarded && (c.moral?.environmentIndex ?? 100) < 40 && (c.moral?.corruption ?? 0) > 45,
    effects: { capital: -5 },
    moralEffects: { amaliaApoyo: 1 }
  },
  {
    id: 'av_oferta_imagen_limpia',
    scope: 'nacional',
    title: 'Oferta de Imagen Limpia',
    emoji: '🍃',
    tags: ['amalia'],
    weight: 4,
    duration: 1,
    characterId: 'amalia_verde',
    description: 'Amalia Verde: "Podemos ayudarlos a limpiar su imagen. A cambio de gestos ambientales reales, no de discurso."',
    when: (c) => !!c.moral?.onboarded && (c.moral?.corruption ?? 0) > 40,
    choices: [
      {
        id: 'aceptar_paquete_verde',
        label: 'Aceptar paquete de medidas verdes',
        detail: 'Corrupcion percibida baja un poco, cuesta caja.',
        effects: { fiscal_balance: -0.3 },
        moralEffects: { amaliaApoyo: 2, environmentIndex: 3, corruption: -2 }
      },
      {
        id: 'rechazar_oferta_amalia',
        label: 'Rechazar',
        detail: 'Se pierde la oportunidad.',
        effects: {},
        moralEffects: {}
      }
    ]
  },

  // ---------------------------------------------------------- Jhon el Duro
  {
    id: 'jd_marcha_seguridad',
    scope: 'nacional',
    title: 'Marcha por la Seguridad',
    emoji: '🚨',
    tags: ['jhon', 'seguridad'],
    weight: 8,
    duration: 1,
    characterId: 'jhon_el_duro',
    description: 'Jhon el Duro: "La gente esta en la calle porque ustedes no la protegen. O ponen orden o lo ponemos nosotros."',
    when: (c) => !!c.moral?.onboarded && (c.moral?.securityIndex ?? 0) > 55,
    choices: [
      {
        id: 'paquete_duro_seguridad',
        label: 'Anunciar paquete duro de seguridad',
        detail: 'Base dura contenta, tension con DDHH.',
        effects: { capital: 3, stability: 2 },
        moralEffects: { jhonApoyo: 2, securityIndex: -4 }
      },
      {
        id: 'discurso_blando',
        label: 'Ignorar / discurso blando',
        detail: 'Los sectores medios lo sienten.',
        effects: { happiness: -4 },
        moralEffects: { jhonApoyo: 2.5 }
      },
      {
        id: 'cooptar_discurso_jd',
        label: 'Cooptar el discurso (medidas con control civil)',
        detail: 'Mas equilibrado, menos vistoso.',
        effects: { stability: 1 },
        moralEffects: { jhonApoyo: 1, securityIndex: -2 }
      }
    ]
  },
  {
    id: 'jd_expulsion_masiva',
    scope: 'nacional',
    title: 'Propuesta de Expulsion Masiva',
    emoji: '🛂',
    tags: ['jhon', 'inmigracion'],
    weight: 5,
    duration: 1,
    characterId: 'jhon_el_duro',
    description: 'Jhon el Duro: "Hay que expulsar a los que delinquen y cerrar la frontera de verdad. Basta de discursos."',
    when: (c) => !!c.moral?.onboarded && (c.moral?.securityIndex ?? 0) > 50,
    choices: [
      {
        id: 'politica_dura_expulsion',
        label: 'Adoptar politica dura de expulsiones',
        detail: 'Posible conflicto diplomatico.',
        effects: {},
        moralEffects: { jhonApoyo: 2.5 }
      },
      {
        id: 'politica_intermedia_jd',
        label: 'Politica intermedia (solo delincuentes graves)',
        detail: 'Mas manejable.',
        effects: {},
        moralEffects: { jhonApoyo: 1 }
      },
      {
        id: 'rechazar_jd',
        label: 'Rechazar',
        detail: 'Jhon se radicaliza mas.',
        effects: {},
        moralEffects: { jhonApoyo: 1.5, securityIndex: 2 }
      }
    ]
  },
  {
    id: 'jd_llamado_cuarteles',
    scope: 'nacional',
    title: 'Llamado a los Cuarteles',
    emoji: '🪖',
    tags: ['jhon'],
    weight: 3,
    duration: 1,
    characterId: 'jhon_el_duro',
    urgency: 'important',
    description: 'Jhon el Duro: "Las Fuerzas Armadas estan para defender a la patria, tambien de adentro. La gente lo sabe."',
    when: (c) => !!c.moral?.onboarded && (c.moral?.securityIndex ?? 0) > 70,
    effects: { global_tension: 5, capital: 2 },
    moralEffects: { jhonApoyo: 2.5 }
  },
  {
    id: 'jd_apoyo_condicionado',
    scope: 'nacional',
    title: 'Oferta de Apoyo Condicionado',
    emoji: '🤝',
    tags: ['jhon'],
    weight: 4,
    duration: 1,
    characterId: 'jhon_el_duro',
    description: 'Jhon el Duro: "Podemos bancarlos. Pero no con discursos. Con hechos. Quiero ver mano dura de verdad."',
    when: (c) => !!c.moral?.onboarded && (c.moral?.securityIndex ?? 0) > 45,
    choices: [
      {
        id: 'aceptar_pacto_jd',
        label: 'Aceptar el pacto',
        detail: 'Se compromete a medidas duras a cambio de apoyo.',
        effects: { capital: 4 },
        moralEffects: { jhonApoyo: 1, securityIndex: -3 }
      },
      {
        id: 'rechazar_pacto_jd',
        label: 'Rechazar',
        detail: 'Jhon se vuelve mas agresivo en el discurso.',
        effects: {},
        moralEffects: { jhonApoyo: 0.5 }
      }
    ]
  }
];

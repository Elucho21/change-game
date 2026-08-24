import type { GameEvent } from '../types';
import type { MoralState } from '../moral';

/**
 * Enrique Grook — Subsecretario de la Subsecretaria de Presidencia.
 * Change World Game v1.1, Sistema Moral.
 *
 * Estas 14 cartas NO pasan por `rollEvents` (lib/engine.ts): tienen su
 * propio selector, `enriqueEvents()`, mas abajo — mismo patron que
 * `campaignEvents`/`crisisEvents` (weight 0, elegidas por condicion propia,
 * no por sorteo ponderado). Por eso `when` queda sin usar en estas cartas:
 * la elegibilidad la resuelve `enriqueEvents()` leyendo `MoralState`
 * directo, no `EventContext` (que no carga el sistema moral).
 *
 * Simplificacion respecto del doc: "corrupcion subio >8 en el trimestre"
 * no se trackea (no hay historial trimestral); se cubre con los otros
 * cuatro disparadores (investigacion, escandalo, favor pendiente, roll base).
 */
export const ENRIQUE_EVENTS: GameEvent[] = [
  {
    id: 'enrique_contrato_amigo',
    scope: 'personal',
    title: 'El Contrato Amigo',
    emoji: '🤝',
    tags: ['enrique', 'corrupcion'],
    weight: 0,
    duration: 1,
    description:
      'Mire que coincidencia... resulta que el primo del ministro de Obras tiene una empresa constructora excelente. '
      + 'No es la mas barata, claro. Pero es... confiable. Muy confiable. '
      + 'Podemos hacer las cosas "transparentes" y que gane el mas barato... o podemos hacerlas "inteligentes". '
      + 'Usted decide. Yo solo traigo el cafe y las opciones.',
    choices: [
      {
        id: 'adjudicar_amigo',
        label: 'Adjudicar al amigo',
        detail: 'La obra sale mas cara, pero el circulo cercano queda contento.',
        effects: { capital: 4, fiscal_balance: -0.3 },
        moralEffects: { corruption: 12, investigacion: 6 }
      },
      {
        id: 'licitacion_limpia',
        label: 'Hacer licitacion limpia',
        detail: 'Gana el mas barato. Los aliados internos lo sienten como una traicion chica.',
        effects: { capital: -2, happiness: 2 },
        moralEffects: { corruption: -3 }
      },
      {
        id: 'amigo_con_cobertura',
        label: 'Adjudicar al amigo pero con "cobertura" mediatica',
        detail: 'Un termino medio: menos ruido, pero no gratis.',
        effects: { capital: 2, fiscal_balance: -0.2 },
        moralEffects: { corruption: 8, investigacion: 3 }
      }
    ]
  },
  {
    id: 'enrique_nombramiento_familiar',
    scope: 'personal',
    title: 'El Nombramiento Familiar',
    emoji: '👔',
    tags: ['enrique', 'corrupcion'],
    weight: 0,
    duration: 1,
    description:
      'Hay un puesto libre. Y fijese que casualidad... su cuñado, el hijo de su ministro, el yerno de alguien importante esta "disponible". '
      + 'Podemos poner a alguien competente y que duerma tranquilo, o podemos poner a alguien de la familia y que duerma todavia mas tranquilo. '
      + 'Yo no juzgo. Yo solo administro la realidad.',
    choices: [
      {
        id: 'nombrar_familiar',
        label: 'Nombrar al familiar',
        detail: 'Lealtad garantizada. Competencia, no tanto.',
        effects: { capital: 5 },
        moralEffects: { corruption: 10, investigacion: 5 }
      },
      {
        id: 'nombrar_merito',
        label: 'Nombrar por merito',
        detail: 'El organismo funciona mejor. Adentro no cae tan bien.',
        effects: { capital: -3 },
        moralEffects: { corruption: -2 }
      },
      {
        id: 'nombrar_tecnico_cuerda',
        label: 'Nombrar a un "tecnico" que en realidad es de la cuerda',
        detail: 'Queda bien en el comunicado. No cambia mucho por dentro.',
        effects: { capital: 2 },
        moralEffects: { corruption: 6, investigacion: 2 }
      }
    ]
  },
  {
    id: 'enrique_silencio_mediatico',
    scope: 'personal',
    title: 'El Silencio Mediatico',
    emoji: '🤐',
    tags: ['enrique', 'corrupcion'],
    weight: 0,
    duration: 1,
    description:
      'Hay un periodista, o un medio, que esta oliendo algo que no deberia oler. '
      + 'Podemos dejarlo investigar y rezar. Podemos comprarle el silencio, caro pero efectivo. '
      + 'O podemos tirarle un escandalo personal encima y que se distraiga. '
      + 'Yo ya tengo los numeros. Usted elige el metodo.',
    choices: [
      {
        id: 'dejar_investigar',
        label: 'Dejar que investigue',
        detail: 'El riesgo es publico, no privado.',
        effects: {},
        moralEffects: { investigacion: 12 }
      },
      {
        id: 'comprar_silencio',
        label: 'Comprar el silencio',
        detail: 'Sale caro. Sale efectivo, por ahora.',
        effects: { capital: -1, fiscal_balance: -0.3 },
        moralEffects: { corruption: 9, investigacion: -8 }
      },
      {
        id: 'operacion_distraccion',
        label: 'Operacion de distraccion',
        detail: 'Un escandalo personal ajeno tapa el propio. Si se descubre, se paga caro.',
        effects: { happiness: -3 },
        moralEffects: { corruption: 7, investigacion: -5 }
      }
    ]
  },
  {
    id: 'enrique_tirar_por_la_borda',
    scope: 'personal',
    title: 'Tirar a Alguien por la Borda',
    emoji: '⚓',
    tags: ['enrique', 'corrupcion'],
    weight: 0,
    duration: 1,
    description:
      'La Comision esta tirando del hilo. Y el hilo llega hasta nosotros. '
      + 'Hay dos caminos clasicos: nos hacemos los ofendidos y sacrificamos a alguien, o intentamos enterrar todo y cruzamos los dedos. '
      + 'Historicamente, el sacrificio funciona mejor. Duele, pero limpia. ¿A quien tiramos?',
    choices: [
      {
        id: 'sacrificar_propio',
        label: 'Sacrificar a un ministro o funcionario cercano',
        detail: 'Duele adentro. Se ve bien afuera.',
        effects: { capital: -6, happiness: 4 },
        moralEffects: { corruption: -8, investigacion: -15 }
      },
      {
        id: 'enterrar_asunto',
        label: 'Intentar enterrar el asunto',
        detail: 'Arriesgado: si explota despues, explota peor.',
        effects: {},
        moralEffects: { corruption: 5, investigacion: 10 }
      },
      {
        id: 'sacrificar_oposicion',
        label: 'Sacrificar a alguien de la oposicion (si hay oportunidad)',
        detail: 'Mancha a un rival y limpia algo propio. Se cobra en enemistad.',
        effects: { capital: 2 },
        moralEffects: { corruption: 3, investigacion: -8 }
      }
    ]
  },
  {
    id: 'enrique_favores_a_la_corte',
    scope: 'personal',
    title: 'Favores a la Corte',
    emoji: '⚖️',
    tags: ['enrique', 'corte'],
    weight: 0,
    duration: 1,
    description:
      'La Corte tiene vacantes, o jueces que todavia no decidieron de que lado esta el sol. '
      + 'Podemos dejar que el Parlamento elija (democratico y peligroso), empujar a un amigo '
      + '(caro en corrupcion, barato en dolores de cabeza), o hacer un acuerdo transversal (caro en favores). '
      + 'Yo solo le recuerdo que los jueces duran mas que los gobiernos.',
    choices: [
      {
        id: 'candidato_propio',
        label: 'Empujar candidato propio',
        detail: 'La Corte queda leal. Tambien queda menos independiente, y se nota.',
        effects: { capital: -4 },
        moralEffects: { corruption: 11, corteIntegrity: -12, corteLealtad: 15 }
      },
      {
        id: 'acuerdo_transversal',
        label: 'Acuerdo transversal con la oposicion',
        detail: 'Mas estable, mas caro en favores cruzados.',
        effects: { capital: -6 },
        moralEffects: { corruption: 4, corteIntegrity: -5, favoresActivos: 6 }
      },
      {
        id: 'parlamento_libre',
        label: 'Dejar que el Parlamento decida libremente',
        detail: 'La Corte gana independencia real. Puede tocarte un juez hostil.',
        effects: {},
        moralEffects: { corruption: -1, corteIntegrity: 8 }
      }
    ]
  },
  {
    id: 'enrique_operacion_archivo',
    scope: 'personal',
    title: 'Operacion Archivo',
    emoji: '🗄️',
    tags: ['enrique', 'corrupcion'],
    weight: 0,
    duration: 1,
    description:
      'Hay carpetas. Hay expedientes. Hay testigos que todavia no hablaron. '
      + 'Podemos acelerar el archivo de algunas causas, o dejar que el tiempo haga su trabajo. '
      + 'El tiempo, curiosamente, suele ser mas caro que un buen favor. ¿Cuanto esta dispuesto a invertir en olvido?',
    choices: [
      {
        id: 'archivo_agresivo',
        label: 'Operacion Archivo agresiva',
        detail: 'Baja mucho, arriesga mucho si se descubre.',
        effects: { capital: -3 },
        moralEffects: { corruption: 14, investigacion: -20 }
      },
      {
        id: 'archivo_selectivo',
        label: 'Archivo selectivo (solo lo mas peligroso)',
        detail: 'Mas seguro, menos efectivo.',
        effects: {},
        moralEffects: { corruption: 7, investigacion: -10 }
      },
      {
        id: 'no_hacer_nada',
        label: 'No hacer nada',
        detail: 'El expediente sigue su curso natural.',
        effects: {},
        moralEffects: { investigacion: 5 }
      }
    ]
  },
  {
    id: 'enrique_limpieza_emergencia',
    scope: 'personal',
    title: 'La Limpieza de Emergencia',
    emoji: '🧹',
    tags: ['enrique', 'corrupcion'],
    weight: 0,
    duration: 1,
    description:
      'El pueblo esta empezando a oler. Y cuando el pueblo huele, la Comision se pone nerviosa. '
      + 'Podemos hacer una "limpieza de emergencia": destituir a tres o cuatro, anunciar transparencia, llorar un poco en camara. '
      + 'O podemos seguir como si nada y esperar que la gente se distraiga con el futbol. '
      + 'Historicamente, el futbol funciona... hasta que deja de funcionar.',
    choices: [
      {
        id: 'limpieza_destituciones',
        label: 'Limpieza mediatica + destituciones',
        detail: 'Cuesta caro adentro. Se nota afuera.',
        effects: { capital: -8, happiness: 6 },
        moralEffects: { corruption: -12, investigacion: -10 }
      },
      {
        id: 'limpieza_solo_mediatica',
        label: 'Limpieza solo mediatica',
        detail: 'Un gesto sin sangre. El efecto no dura.',
        effects: { capital: -2, happiness: 2 },
        moralEffects: { corruption: -4 }
      },
      {
        id: 'ignorar_esperar',
        label: 'Ignorar y esperar',
        detail: 'El silencio tambien es una respuesta. No una buena.',
        effects: { happiness: -5 },
        moralEffects: { corruption: 3, investigacion: 8 }
      }
    ]
  },
  {
    id: 'enrique_fondo_reservado',
    scope: 'personal',
    title: 'El Fondo Reservado',
    emoji: '💼',
    tags: ['enrique', 'corrupcion'],
    weight: 0,
    duration: 1,
    description:
      'Existen partidas. No estan en el presupuesto oficial. Se llaman de muchas formas elegantes. Yo las llamo "el colchon". '
      + 'Podemos usarlas para cosas discretas, o dejarlas quietas y dormir con la conciencia limpia. '
      + 'Aunque, entre nosotros, la conciencia limpia es un lujo de los que no tienen que gobernar.',
    choices: [
      {
        id: 'fondo_operaciones',
        label: 'Usar el fondo para operaciones politicas / silencios',
        detail: 'Flexibilidad alta. Riesgo alto si se sabe.',
        effects: { capital: 6 },
        moralEffects: { corruption: 10, investigacion: 7 }
      },
      {
        id: 'fondo_clientelismo',
        label: 'Usar el fondo para gastos sociales discretos',
        detail: 'Compra apoyo en el barrio. No entra en ningun informe.',
        effects: { capital: 3, happiness: 5 },
        moralEffects: { corruption: 6 }
      },
      {
        id: 'no_tocar_fondo',
        label: 'No tocar el fondo',
        detail: 'Menos flexibilidad. Menos para explicar despues.',
        effects: {},
        moralEffects: { corruption: -1 }
      }
    ]
  },
  {
    id: 'enrique_advertencia_comision',
    scope: 'personal',
    title: 'Advertencia de la Comision',
    emoji: '📋',
    tags: ['enrique', 'comision'],
    weight: 0,
    duration: 1,
    description:
      'Le traigo malas noticias, o buenas, segun como se mire. La Comision esta mas cerca de lo que le gustaria. '
      + 'Tienen nombres. Tienen fechas. Tienen entusiasmo. '
      + 'Podemos acelerar los favores, preparar el sacrificio, o hacer como que no pasa nada y sonreir en las fotos.',
    choices: [
      {
        id: 'intensificar_favores',
        label: 'Intensificar favores a parlamentarios clave',
        detail: 'Compra tiempo. No compra perdon.',
        effects: { capital: -4 },
        moralEffects: { corruption: 9, investigacion: -12, favoresActivos: 10 }
      },
      {
        id: 'sacrificio_preventivo',
        label: 'Preparar sacrificio preventivo',
        detail: 'Se corta antes de que llegue al hueso.',
        effects: { capital: -7 },
        moralEffects: { corruption: -5, investigacion: -18 }
      },
      {
        id: 'negar_atacar',
        label: 'Negar todo y atacar a la Comision',
        detail: 'La tropa propia lo festeja. Afuera, no tanto.',
        effects: { capital: 3, happiness: -4 },
        moralEffects: { corruption: 4, investigacion: 10 }
      }
    ]
  },
  {
    id: 'enrique_amigo_en_la_comision',
    scope: 'personal',
    title: 'El Amigo en la Comision',
    emoji: '🕴️',
    tags: ['enrique', 'comision'],
    weight: 0,
    duration: 1,
    description:
      'Tenemos gente adentro. No muchos, pero suficientes. Podemos pedirles que diluyan, que pidan mas pruebas, '
      + 'que archiven, o que simplemente se enfermen el dia de la votacion. Eso si: cada favor se cobra, y se cobra caro. '
      + '¿Cuanto vale un trimestre mas de tranquilidad?',
    choices: [
      {
        id: 'diluir_fuerte',
        label: 'Usar a los amigos para diluir fuerte',
        detail: 'Efecto grande. Debilita a la Comision misma.',
        effects: {},
        moralEffects: { corruption: 8, investigacion: -15 }
      },
      {
        id: 'solo_retrasar',
        label: 'Usar solo para retrasar',
        detail: 'Un respiro chico, sin quemar tanto.',
        effects: {},
        moralEffects: { corruption: 4, investigacion: -7 }
      },
      {
        id: 'no_quemar_amigos',
        label: 'No quemar a los amigos todavia',
        detail: 'Guarda la carta para mas adelante.',
        effects: {},
        moralEffects: {}
      }
    ]
  },
  {
    id: 'enrique_precio_tranquilidad',
    scope: 'personal',
    title: 'El Precio de la Tranquilidad',
    emoji: '☕',
    tags: ['enrique', 'corrupcion'],
    weight: 0,
    duration: 1,
    description:
      'Todo esta relativamente calmado. Eso es peligroso: la calma es cuando mas se acumula. '
      + '¿Quiere que empecemos a mover algunas piezas preventivas? O prefiere seguir disfrutando de la ilusion '
      + 'de que esto se sostiene solo. Yo cobro igual. Usted elige el nivel de estres futuro.',
    choices: [
      {
        id: 'mover_piezas',
        label: 'Mover piezas preventivas (favores + silencios)',
        detail: 'Compra tranquilidad a cuenta de mas adelante.',
        effects: { capital: -2 },
        moralEffects: { corruption: 6, investigacion: -5 }
      },
      {
        id: 'ahorrar_nada',
        label: 'Ahorrar y no hacer nada',
        detail: 'La proxima crisis puede llegar mas fuerte.',
        effects: {},
        moralEffects: {}
      },
      {
        id: 'mini_limpieza',
        label: 'Empezar una mini-limpieza preventiva',
        detail: 'Gesto chico, pero de buena fe.',
        effects: { capital: -4, happiness: 2 },
        moralEffects: { corruption: -5 }
      }
    ]
  },
  {
    id: 'enrique_chiste_negro',
    scope: 'personal',
    title: 'Chiste Negro Historico',
    emoji: '🕯️',
    tags: ['enrique', 'ambientacion'],
    weight: 0,
    duration: 1,
    description:
      '¿Sabe que le paso al presidente de hace doce años? Tambien tenia un Enrique. '
      + 'Tambien penso que controlaba la Comision. Tambien creyo que los jueces eran "suyos". '
      + 'Hoy escribe columnas desde el exterior, cuando no esta respondiendo expedientes. '
      + 'Solo se lo cuento para que tenga contexto. Yo, personalmente, prefiero que usted termine el mandato. Se gana mejor.',
    choices: [
      {
        id: 'tomar_nota',
        label: 'Tomar nota y seguir',
        detail: 'Bueno... vuelvo a mi oficina. Cualquier cosa, usted sabe donde encontrarme.',
        effects: {},
        moralEffects: { investigacion: 3 }
      }
    ]
  },
  {
    id: 'enrique_oferta_final',
    scope: 'personal',
    title: 'La Oferta Final',
    emoji: '🔚',
    tags: ['enrique', 'crisis'],
    weight: 0,
    duration: 1,
    description:
      'Llegamos al momento en que las opciones se reducen. Ya no hay maquillaje. Ya no hay tiempo. Quedan tres caminos: '
      + 'el sacrificio grande, el ataque total a la Comision y a la Corte, o el acuerdo secreto y caro con los que todavia se pueden comprar. '
      + 'Yo ya no le traigo cafe. Le traigo el menu de supervivencia.',
    choices: [
      {
        id: 'sacrificio_grande',
        label: 'Sacrificio grande',
        detail: 'Varios ministros caen. Usted asume responsabilidad parcial.',
        effects: { capital: -15, happiness: 8 },
        moralEffects: { corruption: -20, investigacion: -30 }
      },
      {
        id: 'guerra_institucional',
        label: 'Guerra institucional',
        detail: 'Ataque frontal a la Comision y a la Corte. Alto riesgo de crisis constitucional.',
        effects: { capital: 5, happiness: -12 },
        moralEffects: { corruption: 8, corteIntegrity: -10, investigacion: -5 }
      },
      {
        id: 'acuerdo_secreto',
        label: 'Acuerdo secreto y caro',
        detail: 'Compra tiempo. Deja una deuda de favores permanente.',
        effects: { capital: -8, fiscal_balance: -1 },
        moralEffects: { corruption: 18, investigacion: -25 }
      }
    ]
  }
];

/**
 * Onboarding de Enrique: NO es una carta con `choices` (seccion 4.2 del doc,
 * secuencia de 2 pasos: dialogo + panel informativo). El texto vive en
 * components/EnriqueModal.tsx (es UI, no una GameEvent).
 */
export const ENRIQUE_ONBOARDING_TURN = 4;

/**
 * Condiciones de elegibilidad por carta (no usan `when`/EventContext:
 * el sistema moral no esta en EventContext, y estas cartas no pasan por
 * `rollEvents`). Cartas sin entrada aca son "de relleno", siempre elegibles.
 */
const ENRIQUE_CONDITIONS: Record<string, (m: MoralState) => boolean> = {
  enrique_tirar_por_la_borda: (m) => m.investigacion > 40,
  enrique_favores_a_la_corte: (m) => m.corteIntegrity < 70,
  enrique_limpieza_emergencia: (m) => m.corruption > 55,
  enrique_advertencia_comision: (m) => m.investigacion > 50,
  enrique_amigo_en_la_comision: (m) => m.investigacion > 30,
  enrique_precio_tranquilidad: (m) => m.corruption >= 30 && m.corruption <= 60,
  enrique_chiste_negro: (m) => m.corruption >= 40,
  enrique_oferta_final: (m) => m.investigacion > 75 && m.corruption > 60
};

const eligible = (m: MoralState) => ENRIQUE_EVENTS.filter((e) => (ENRIQUE_CONDITIONS[e.id] ?? (() => true))(m));

/**
 * Selector propio de Enrique (no pasa por `rollEvents`). Aparece si:
 * investigacion > 35, hay un escandalo activo, quedan favores pendientes
 * de cobrarse, o por un roll base ~30% (equivalente a "cada 4-6 meses").
 * Devuelve como mucho una carta por mes.
 */
export function enriqueEvents(moral: MoralState, onboarded: boolean): GameEvent[] {
  if (!onboarded) return [];
  const forced = moral.investigacion > 35 || moral.scandalFactor > 0 || moral.favoresActivos > 15;
  if (!forced && Math.random() >= 0.3) return [];

  const pool = eligible(moral);
  if (pool.length === 0) return [];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return [pick];
}

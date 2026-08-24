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
    effects: { fiscal_balance: -1.2, happiness: 3, gdp_growth: 0.6, unemployment: -0.4, inflation: 0.3, opposition: -2 }
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
    detail: 'El Banco Central sube la tasa 2 puntos: ancla la inflacion via el motor monetario y frena el credito desde el mes que viene.',
    cost: { capital: 6 },
    effects: { unemployment: 0.15, happiness: -0.5 }
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
    effects: { happiness: 5, stability: 3, fiscal_balance: -0.8, inflation: 0.3 },
    groupEffects: { deregulationIndex: -3, obrera: 2 }
  },
  {
    id: 'quitar_subsidios',
    category: 'interior',
    label: 'Quitar subsidios a la energia',
    emoji: '⚡',
    detail: 'Sincera tarifas: ordena la caja, dispara precios y protestas.',
    cost: { capital: 15 },
    effects: { fiscal_balance: 1.4, inflation: 1.5, happiness: -6, stability: -3 },
    groupEffects: { deregulationIndex: 4, empresarios: 2, obrera: -2 }
  },
  {
    id: 'reforma_laboral',
    category: 'interior',
    label: 'Impulsar una reforma laboral',
    emoji: '📜',
    detail: 'Baja el costo de contratar. Los gremios van al choque.',
    cost: { capital: 20 },
    effects: { unemployment: -0.6, gdp_growth: 0.4, happiness: -4, stability: -4 },
    groupEffects: { deregulationIndex: 6, empresarios: 4, alta: 3, obrera: -5 }
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

  // ---------------- ANTICORRUPCION (siempre disponibles, sin esperar a Enrique) ----------------
  {
    id: 'ley_transparencia',
    category: 'interior',
    label: 'Ley de transparencia y acceso a la informacion',
    emoji: '🔍',
    detail: 'Obliga a publicar contratos publicos y declaraciones juradas. Corta el margen para arreglos bajo la mesa.',
    cost: { capital: 9 },
    effects: { stability: 1 },
    moralEffects: { corruption: -5, investigacion: 3 }
  },
  {
    id: 'organismo_control_gasto',
    category: 'interior',
    label: 'Crear organismo de control del gasto publico',
    emoji: '🕵️',
    detail: 'Auditorias independientes de compras y obra publica. A la casta le molesta; el votante lo aplaude despacio.',
    cost: { capital: 11, fiscal: 0.3 },
    effects: { happiness: 1 },
    moralEffects: { corruption: -7, favoresActivos: -4 }
  },
  {
    id: 'independencia_judicial',
    category: 'interior',
    label: 'Fortalecer la independencia judicial',
    emoji: '⚖️',
    detail: 'Concursos publicos para jueces, menos discrecionalidad del Ejecutivo. Un activo a largo plazo, un dolor de cabeza hoy.',
    cost: { capital: 13 },
    effects: { stability: 1 },
    moralEffects: { corteIntegrity: 8, corteLealtad: -6 }
  },
  {
    id: 'proteccion_denunciantes',
    category: 'interior',
    label: 'Ley de proteccion a denunciantes',
    emoji: '📢',
    detail: 'Blindaje legal y anonimato para quien denuncia corrupcion desde adentro del propio gobierno.',
    cost: { capital: 8 },
    effects: {},
    moralEffects: { corruption: -4, investigacion: 5 }
  },
  {
    id: 'auditoria_compras_publicas',
    category: 'interior',
    label: 'Auditoria de compras publicas',
    emoji: '📋',
    detail: 'Revision retroactiva de contratos y licitaciones. Incomoda a mas de uno de tu propio espacio.',
    cost: { capital: 10 },
    effects: { happiness: 1, stability: -1 },
    moralEffects: { corruption: -6, favoresActivos: -3, investigacion: 4 }
  },
  {
    id: 'declaraciones_juradas',
    category: 'interior',
    label: 'Declaraciones juradas obligatorias para funcionarios',
    emoji: '🖋️',
    detail: 'Patrimonio de funcionarios publico y auditable. Barato en plata, caro en enemigos internos.',
    cost: { capital: 8 },
    effects: {},
    moralEffects: { corruption: -4 }
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
    effects: { capital: 13, stability: 1 },
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
    effects: { capital: 10, global_tension: -3 },
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
  },
  // ---------------- ECONOMIA (ampliacion) ----------------
  {
    id: 'blanqueo',
    category: 'economia',
    label: 'Blanqueo de capitales',
    emoji: '🏦',
    detail: 'Amnistia fiscal para repatriar fondos. Entra plata rapido y el que pago siempre se siente estafado.',
    cost: { capital: 10 },
    cooldown: 3,
    effects: { fiscal_balance: 1.2, gold_reserves_tonnes: 5, happiness: -2 },
    groupEffects: { alta: 4, claseMedia: -2 }
  },
  {
    id: 'plan_vivienda',
    category: 'economia',
    label: 'Plan nacional de vivienda',
    emoji: '🏘️',
    detail: 'Credito y construccion a gran escala. Empleo inmediato, deficit por varios anios.',
    cost: { capital: 12, fiscal: 1 },
    cooldown: 3,
    effects: { fiscal_balance: -1, happiness: 5, unemployment: -0.5, gdp_growth: 0.4 }
  },
  {
    id: 'congelar_precios',
    category: 'economia',
    label: 'Congelar precios de la canasta basica',
    emoji: '🧊',
    detail: 'Acuerdo forzado con las cadenas. Alivio en la gondola hoy, faltante y remarcacion despues.',
    cost: { capital: 12 },
    cooldown: 3,
    effects: { inflation: -2, happiness: 4, gdp_growth: -0.3 },
    groupEffects: { deregulationIndex: -4, empresarios: -2, claseMedia: 2 }
  },
  {
    id: 'devaluar',
    category: 'economia',
    label: 'Devaluar la moneda',
    emoji: '📉',
    detail: 'Mejora la competitividad de un saque y se traslada a precios en semanas.',
    cost: { capital: 15 },
    cooldown: 3,
    effects: { inflation: 3.5, gdp_growth: 0.7, happiness: -5, fiscal_balance: 0.6 }
  },
  {
    id: 'auditoria_gasto',
    category: 'economia',
    label: 'Auditoria del gasto publico',
    emoji: '🔍',
    detail: 'Revision fina de contratos y subsidios. Recorta sin motosierra y tarda en verse.',
    cost: { capital: 6 },
    cooldown: 2,
    effects: { fiscal_balance: 0.5, stability: 1 }
  },

  // ---------------- INTERIOR (ampliacion) ----------------
  {
    id: 'paritaria_nacional',
    category: 'interior',
    label: 'Convocar paritaria nacional',
    emoji: '🤝',
    detail: 'Sentas a sindicatos y empresarios a acordar salarios. Baja la conflictividad y empuja precios.',
    cost: { capital: 8 },
    cooldown: 3,
    effects: { happiness: 4, stability: 3, inflation: 0.8 }
  },
  {
    id: 'plan_salud',
    category: 'interior',
    label: 'Plan de emergencia sanitaria',
    emoji: '🏥',
    detail: 'Insumos, camas y personal. Se nota en la calle y se nota en la caja.',
    cost: { capital: 8, fiscal: 0.7 },
    cooldown: 3,
    effects: { happiness: 5, fiscal_balance: -0.7, stability: 2 }
  },
  {
    id: 'obra_provincias',
    category: 'interior',
    label: 'Repartir fondos a las provincias',
    emoji: '🗺️',
    detail: 'Plata a los gobernadores. Se compran voluntades que despues hay que sostener.',
    cost: { capital: 6, fiscal: 0.8 },
    cooldown: 2,
    effects: { fiscal_balance: -0.8, stability: 4, capital: 8 }
  },
  {
    id: 'reforma_educativa',
    category: 'interior',
    label: 'Reforma educativa',
    emoji: '🎓',
    detail: 'Cambio de contenidos y evaluacion docente. Los gremios resisten; el resultado llega en anios.',
    cost: { capital: 16 },
    cooldown: 3,
    effects: { happiness: -3, stability: -2, gdp_growth: 0.2 }
  },
  {
    id: 'estado_emergencia',
    category: 'interior',
    label: 'Declarar la emergencia',
    emoji: '🚨',
    detail: 'Poderes excepcionales para gobernar por decreto. Rapido, efectivo y caro en legitimidad.',
    cost: { capital: 20 },
    // el motor limita los cooldowns normales a 1-4 meses (ver tests/engine.test.ts),
    // asi que "una vez por mandato" no se puede modelar como cooldown largo:
    // queda once por partida, coherente con el resto de las estructurales
    once: true,
    cooldown: 3,
    effects: { stability: 6, happiness: -6, capital: 25 }
  },

  // ---------------- COMERCIO (ampliacion) ----------------
  {
    id: 'zona_franca',
    category: 'comercio',
    label: 'Crear zonas francas',
    emoji: '🏭',
    detail: 'Beneficios impositivos para exportadores. Atrae inversion y resigna recaudacion.',
    cost: { capital: 10, fiscal: 0.4 },
    once: true,
    effects: { gdp_growth: 0.5, fiscal_balance: -0.4, unemployment: -0.3 }
  },
  {
    id: 'retenciones_export',
    category: 'comercio',
    label: 'Subir retenciones a la exportacion',
    emoji: '🌾',
    detail: 'Recaudacion inmediata sobre lo que se vende afuera. El campo lo toma como declaracion de guerra.',
    cost: { capital: 14 },
    cooldown: 3,
    effects: { fiscal_balance: 1.3, happiness: -4, gdp_growth: -0.4 }
  },
  {
    id: 'mision_comercial',
    category: 'comercio',
    label: 'Mision comercial al exterior',
    emoji: '✈️',
    detail: 'Empresarios y funcionarios a buscar mercados. Barato y de rendimiento lento.',
    cost: { capital: 5 },
    cooldown: 2,
    needsTarget: true,
    effects: { gdp_growth: 0.2 },
    relations: [{ target: 'TARGET', amount: 8 }]
  },
  {
    id: 'proteger_industria',
    category: 'comercio',
    label: 'Proteger la industria nacional',
    emoji: '🛡️',
    detail: 'Cupos y licencias no automaticas. Sostiene empleo y encarece todo lo importado.',
    cost: { capital: 10 },
    cooldown: 2,
    effects: { unemployment: -0.4, inflation: 0.6, gdp_growth: -0.2 },
    relations: [{ target: 'bloc:aduanera', amount: -6 }]
  },
  {
    id: 'swap_monedas',
    category: 'comercio',
    label: 'Acordar un swap de monedas',
    emoji: '💱',
    detail: 'Linea de respaldo con otro banco central. Aire para las reservas a cambio de alineamiento.',
    cost: { capital: 12 },
    cooldown: 3,
    needsTarget: true,
    effects: { gold_reserves_tonnes: 10, inflation: -0.5 },
    relations: [{ target: 'TARGET', amount: 12 }]
  },

  // ---------------- DIPLOMACIA (ampliacion) ----------------
  {
    id: 'cumbre_bilateral',
    category: 'diplomacia',
    label: 'Cumbre bilateral',
    emoji: '🤵',
    detail: 'Visita de Estado con agenda amplia. Cuesta preparacion y deja fotos que sirven.',
    cost: { capital: 8 },
    cooldown: 3,
    needsTarget: true,
    effects: { capital: 10 },
    relations: [{ target: 'TARGET', amount: 16 }]
  },
  {
    id: 'apoyo_onu',
    category: 'diplomacia',
    label: 'Buscar apoyo en Naciones Unidas',
    emoji: '🕊️',
    detail: 'Rondas de negociacion para juntar votos en el organismo. Prestigio sin costo material.',
    cost: { capital: 7 },
    cooldown: 3,
    effects: { capital: 9, global_tension: -2 },
    relations: [{ target: 'todos', amount: 4 }]
  },
  {
    id: 'reconocer_gobierno',
    category: 'diplomacia',
    label: 'Reconocer un gobierno en disputa',
    emoji: '📜',
    detail: 'Tomas partido en una crisis ajena. Ganas un amigo y te haces un enemigo.',
    cost: { capital: 10 },
    cooldown: 3,
    needsTarget: true,
    effects: { global_tension: 3 },
    relations: [{ target: 'TARGET', amount: 20 }, { target: 'vecinos', amount: -6 }]
  },
  {
    id: 'acuerdo_migratorio',
    category: 'diplomacia',
    label: 'Firmar acuerdo migratorio',
    emoji: '🛂',
    detail: 'Libre circulacion regulada con otro pais. Mano de obra y tension social.',
    cost: { capital: 8 },
    cooldown: 3,
    needsTarget: true,
    effects: { gdp_growth: 0.2, happiness: -1 },
    relations: [{ target: 'TARGET', amount: 14 }]
  },
  {
    id: 'expulsar_diplomaticos',
    category: 'diplomacia',
    label: 'Expulsar diplomaticos',
    emoji: '📤',
    detail: 'Respuesta dura y visible a un agravio. La opinion publica interna lo festeja.',
    cost: { capital: 6 },
    cooldown: 2,
    needsTarget: true,
    effects: { happiness: 2, global_tension: 4 },
    relations: [{ target: 'TARGET', amount: -25 }]
  },

  // ---------------- DEFENSA (ampliacion) ----------------
  {
    id: 'modernizar_fuerzas',
    category: 'defensa',
    label: 'Modernizar las fuerzas armadas',
    emoji: '🛩️',
    detail: 'Compra de equipamiento y capacitacion. Disuasion real, factura larga.',
    cost: { capital: 12, fiscal: 1 },
    cooldown: 3,
    effects: { military_budget_bn: 3, fiscal_balance: -1, stability: 3 }
  },
  {
    id: 'servicio_civico',
    category: 'defensa',
    label: 'Crear un servicio civico voluntario',
    emoji: '🎽',
    detail: 'Formacion para jovenes sin trabajo. Ocupa manos y divide opiniones.',
    cost: { capital: 8, fiscal: 0.4 },
    once: true,
    unlocks: 'desmantelar_servicio_civico',
    effects: { unemployment: -0.4, stability: 2, happiness: -1, fiscal_balance: -0.4 }
  },
  {
    id: 'ciberdefensa',
    category: 'defensa',
    label: 'Crear la agencia de ciberdefensa',
    emoji: '🖥️',
    detail: 'Proteccion de infraestructura critica. Invisible hasta el dia que la necesitas.',
    cost: { capital: 7, fiscal: 0.3 },
    once: true,
    effects: { stability: 2, fiscal_balance: -0.3 }
  },
  {
    id: 'patrullaje_fronteras',
    category: 'defensa',
    label: 'Reforzar el patrullaje de fronteras',
    emoji: '🚁',
    detail: 'Control sobre contrabando y trafico. Los vecinos lo miran con desconfianza.',
    cost: { capital: 7, fiscal: 0.3 },
    cooldown: 2,
    effects: { stability: 3, fiscal_balance: -0.3 },
    relations: [{ target: 'vecinos', amount: -4 }]
  },
  {
    id: 'tratado_no_agresion',
    category: 'defensa',
    label: 'Firmar tratado de no agresion',
    emoji: '📄',
    detail: 'Compromiso formal de no atacarse. Baja la tension y te ata las manos.',
    cost: { capital: 10 },
    cooldown: 3,
    needsTarget: true,
    effects: { global_tension: -5, stability: 1 },
    relations: [{ target: 'TARGET', amount: 22 }]
  },
  {
    id: 'desmantelar_servicio_civico',
    category: 'defensa',
    label: 'Desmantelar el servicio civico',
    emoji: '🚫',
    detail: 'Se cierra el programa. Libera caja, pero pierde lo que ya construyo en participacion y estabilidad.',
    cost: { capital: 10 },
    once: true,
    requires: 'servicio_civico',
    effects: { unemployment: 0.3, stability: -1, fiscal_balance: 0.3, happiness: 1 }
  },

  // ---------------- COMUNICACION ----------------
  // Actos de gobierno que no cambian la economia: cambian como la gente la
  // vive. Enfriamiento de 4 meses en todos: el gesto se gasta si lo repetis.
  {
    id: 'cadena_nacional',
    category: 'comunicacion',
    label: 'Cadena nacional',
    emoji: '📺',
    detail: 'Hablarle al pais de frente. Ordena el relato cuando la situacion todavia se puede explicar.',
    cost: { capital: 5 },
    cooldown: 4,
    effects: { happiness: 4, stability: 2, capital: 9, opposition: -2 }
  },
  {
    id: 'acto_masivo',
    category: 'comunicacion',
    label: 'Acto masivo con militancia',
    emoji: '🎪',
    detail: 'Plaza llena y escenario. Consolida a los propios y le recuerda al resto que estan enfrente.',
    cost: { capital: 8, fiscal: 0.2 },
    cooldown: 4,
    effects: { happiness: 5, stability: -1, capital: 13, fiscal_balance: -0.2, opposition: -3 }
  },
  {
    id: 'gira_provincias',
    category: 'comunicacion',
    label: 'Gira por el interior',
    emoji: '🚌',
    detail: 'Semanas recorriendo pueblos y obras. Rinde despacio y rinde parejo.',
    cost: { capital: 7 },
    cooldown: 4,
    effects: { happiness: 3, stability: 3, capital: 11, opposition: -2 }
  },
  {
    id: 'entrevista_incomoda',
    category: 'comunicacion',
    label: 'Dar una entrevista incomoda',
    emoji: '🎤',
    detail: 'Sentarte con un periodista hostil. Si salis bien parado, ganas respeto hasta del que no te vota.',
    cost: { capital: 4 },
    cooldown: 4,
    effects: { happiness: 3, capital: 8, opposition: -1 }
  },
  {
    id: 'campana_logros',
    category: 'comunicacion',
    label: 'Campana publicitaria de gestion',
    emoji: '📰',
    detail: 'Pauta en todos lados contando lo que se hizo. Funciona si algo se hizo.',
    cost: { capital: 5, fiscal: 0.4 },
    cooldown: 4,
    effects: { happiness: 4, fiscal_balance: -0.4, opposition: -2 }
  },
  {
    id: 'pedir_disculpas',
    category: 'comunicacion',
    label: 'Pedir disculpas publicamente',
    emoji: '🙇',
    detail: 'Reconocer un error de frente. Cuesta orgullo y desactiva mas conflicto del que parece.',
    cost: { capital: 6 },
    cooldown: 4,
    effects: { happiness: 5, stability: 4, capital: -2, opposition: -1 }
  },

  // ---------------------------------------------------------- previsional (Change World Game v1.0)
  // El coste de capital de cada reforma sale de lib/pension.ts
  // (PENSION_REFORM_BASE_COST + pensionReformCostMultiplier en lib/store.ts,
  // igual que el resto de las categorias en decisionCost). Los efectos
  // fiscales/de empleo de fondo los calcula el tick de lib/pension.ts y
  // lib/employment.ts turno a turno; lo que va aca es el golpe politico
  // inmediato del anuncio.
  {
    id: 'subir_edad_jubilacion',
    category: 'previsional',
    label: 'Subir la edad de jubilacion',
    emoji: '👴',
    detail: '+2 anios para hombres y mujeres. Mejora el sistema a mediano plazo; los activos cercanos al retiro lo sienten ya.',
    cost: { capital: 4 },
    once: true,
    effects: { happiness: -2, stability: -1 }
  },
  {
    id: 'igualar_edad_hm',
    category: 'previsional',
    label: 'Igualar edad de jubilacion entre generos',
    emoji: '⚖️',
    detail: 'La edad de las mujeres sube a la de los hombres. Correcto en el papel, caro en votos de un dia para el otro.',
    cost: { capital: 7 },
    once: true,
    effects: { happiness: -3, stability: -1 }
  },
  {
    id: 'subir_aporte_trabajador',
    category: 'previsional',
    label: 'Subir el aporte del trabajador',
    emoji: '💸',
    detail: '+2 puntos porcentuales. El trabajador lo siente en el bolsillo de inmediato; con el tiempo empuja informalidad.',
    cost: { capital: 6 },
    effects: { happiness: -3 }
  },
  {
    id: 'subir_aporte_empleador',
    category: 'previsional',
    label: 'Subir el aporte del empleador',
    emoji: '🏭',
    detail: '+2 puntos porcentuales. Menos ruido politico inmediato que subirselo al trabajador, pero encarece contratar formal.',
    cost: { capital: 5 },
    effects: { happiness: -1, gdp_growth: -0.05 }
  },
  {
    id: 'bajar_tasa_reemplazo',
    category: 'previsional',
    label: 'Bajar la tasa de reemplazo',
    emoji: '📉',
    detail: '-10 puntos sobre el ultimo salario. La reforma mas dura de la caja: mejora la cuenta, pero los futuros jubilados no perdonan.',
    cost: { capital: 11 },
    once: true,
    effects: { happiness: -4, stability: -1 }
  },
  {
    id: 'mejorar_fiscalizacion',
    category: 'previsional',
    label: 'Mejorar la fiscalizacion previsional',
    emoji: '🔍',
    detail: 'Baja la morosidad y la evasion. Requiere capacidad estatal, pero no le pide sacrificio directo a nadie.',
    cost: { capital: 3 },
    effects: { fiscal_balance: 0.05 }
  },
  {
    id: 'eliminar_privilegios',
    category: 'previsional',
    label: 'Eliminar jubilaciones de privilegio',
    emoji: '👑',
    detail: 'Popular en la poblacion general, odio intenso en el grupo afectado. Dificultad tecnica y judicial alta.',
    cost: { capital: 7 },
    once: true,
    effects: { happiness: 2, stability: 1 }
  },
  {
    id: 'aumentar_cobertura',
    category: 'previsional',
    label: 'Plan de formalizacion y cobertura',
    emoji: '📋',
    detail: 'La unica reforma previsional que suma Capital Politico neto: mas gente aportando, mas empleo formal, sin sacarle nada a nadie.',
    cost: { capital: 1 },
    effects: { capital: 4, happiness: 1, opposition: -2 }
  }
];

export const decisionsByCategory = (cat: Decision['category']) =>
  DECISIONS.filter((d) => d.category === cat);

export const CATEGORIES: { id: Decision['category']; label: string; emoji: string }[] = [
  { id: 'economia', label: 'Economia', emoji: '💰' },
  { id: 'interior', label: 'Interior', emoji: '🏛️' },
  { id: 'comercio', label: 'Comercio', emoji: '🚢' },
  { id: 'diplomacia', label: 'Diplomacia', emoji: '🤝' },
  { id: 'defensa', label: 'Defensa', emoji: '🎖️' },
  { id: 'comunicacion', label: 'Comunicacion', emoji: '📣' },
  { id: 'previsional', label: 'Previsional', emoji: '👴' }
];

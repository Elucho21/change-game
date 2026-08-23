import type { GameEvent } from '../types';

/** Eventos de oposicion, campana y comercio (Grok). */
export const NATIONAL_EVENTS_EXTRA: GameEvent[] = [
  {
    id: 'interna_partido',
    scope: 'nacional',
    title: 'Interna abierta en el oficialismo',
    emoji: '⚔️',
    tags: ['oposicion', 'campana', 'liderazgo'],
    weight: 5,
    duration: 2,
    description:
      'Un sector de tu propio espacio cuestiona el rumbo. La pelea se filtra a los medios.',
    when: (c) => (c.politics?.opposition ?? 0) > 45 || (c.politics?.poll ?? 50) < 42,
    ongoing: { stability: -0.5 },
    choices: [
      { id: 'cerrar_filas', label: 'Cerrar filas con cargos y presupuesto', detail: 'Compras paz interna.', cost: { capital: 12 }, effects: { stability: 3, fiscal_balance: -0.4, capital: -4 } },
      { id: 'bancarte', label: 'Bancarte el embate y no ceder', detail: 'Ganas autoridad si aguantas.', cost: { capital: 8 }, effects: { stability: -2, capital: 10, happiness: -2 } },
      { id: 'echar', label: 'Echar a los discolos del bloque', detail: 'Orden en el mensaje.', cost: { capital: 10 }, effects: { stability: 2, happiness: -1 } }
    ]
  },
  {
    id: 'campana_sucia',
    scope: 'nacional',
    title: 'Campana sucia de la oposicion',
    emoji: '📰',
    tags: ['campana', 'oposicion'],
    weight: 6,
    duration: 1,
    description: 'Operetas y filtraciones. Faltan pocos meses para la eleccion.',
    when: (c) => (c.politics?.monthsToElection ?? 99) <= 8,
    choices: [
      { id: 'responder', label: 'Responder con datos y cadena corta', detail: 'Gastas capital y recuperas relato.', cost: { capital: 8 }, effects: { happiness: 2, stability: 1, capital: 10 } },
      { id: 'ignorar', label: 'No entrar en el barro', detail: 'A veces el silencio gana.', effects: { happiness: -2 }, risk: { chance: 0.35, label: 'La opereta escala', effects: { happiness: -5, stability: -3, capital: -4 } } },
      { id: 'contraataque', label: 'Contraatacar con archivo', detail: 'Empate en el barro.', cost: { capital: 10 }, effects: { happiness: -1, stability: -1, capital: 13 } }
    ]
  },
  {
    id: 'promesa_incumplida',
    scope: 'nacional',
    title: 'La promesa de campana que no llego',
    emoji: '📜',
    tags: ['campana', 'oposicion'],
    weight: 5,
    duration: 1,
    description: 'Un compromiso de campana vuelve a la tapa.',
    when: (c) => (c.politics?.honeymoon === false) && ((c.politics?.opposition ?? 0) > 40),
    choices: [
      { id: 'cumplir_parcial', label: 'Anunciar cumplimiento parcial', detail: 'Compra tiempo.', cost: { capital: 10, fiscal: 0.3 }, effects: { happiness: 2, fiscal_balance: -0.3, stability: 1 } },
      { id: 'redefinir', label: 'Redefinir la promesa como proceso', detail: 'Relato debil.', cost: { capital: 6 }, effects: { happiness: -3, capital: -2 } }
    ]
  },
  {
    id: 'desercion_legisladores',
    scope: 'nacional',
    title: 'Desercion de legisladores propios',
    emoji: '🚪',
    tags: ['oposicion', 'parlamento'],
    weight: 4,
    duration: 1,
    description: 'Legisladores amenazan con pasarse a la oposicion.',
    when: (c) => (c.politics?.seats ?? 50) < 45 || (c.politics?.opposition ?? 0) > 55,
    choices: [
      { id: 'negociar', label: 'Negociar reubicaciones', detail: 'Retenes escanos.', cost: { capital: 12 }, effects: { stability: 2, fiscal_balance: -0.35 } },
      { id: 'dejarlos', label: 'Dejarlos ir', detail: 'Menos escanos, mas autoridad.', cost: { capital: 8 }, effects: { stability: 1, happiness: -2 } }
    ]
  },
  {
    id: 'pacto_gobernador',
    scope: 'nacional',
    title: 'Un gobernador pide pacto',
    emoji: '🤝',
    tags: ['campana', 'interior'],
    weight: 4,
    duration: 1,
    description: 'Gobernador ofrece territorio a cambio de obra.',
    when: (c) => (c.politics?.monthsToElection ?? 99) <= 12 || (c.politics?.monthsToMidterm ?? 99) <= 6,
    choices: [
      { id: 'aceptar', label: 'Cerrar el pacto', detail: 'Mas estabilidad, mas deficit.', cost: { capital: 9, fiscal: 0.4 }, effects: { stability: 3, happiness: 1, fiscal_balance: -0.4 } },
      { id: 'rechazar', label: 'Rechazar y priorizar caja', detail: 'Caja ordenada.', cost: { capital: 5 }, effects: { fiscal_balance: 0.2, stability: -2 } }
    ]
  },
  {
    id: 'escandalo_opositor',
    scope: 'nacional',
    title: 'Escandalo en la oposicion',
    emoji: '🔦',
    tags: ['oposicion', 'campana'],
    weight: 4,
    duration: 1,
    description: 'Candidato opositor envuelto en denuncia.',
    when: (c) => (c.politics?.opposition ?? 0) > 35,
    choices: [
      { id: 'capitalizar', label: 'Capitalizar con mesura', detail: 'Subis sin mancharte.', cost: { capital: 4 }, effects: { happiness: 2, capital: 7, stability: 1 } },
      { id: 'sobreactuar', label: 'Ir al choque mediatico', detail: 'Alto riesgo.', cost: { capital: 7 }, effects: { capital: 9 }, risk: { chance: 0.4, label: 'Efecto rebote', effects: { happiness: -3, capital: -5 } } },
      { id: 'silencio', label: 'Dejar que la justicia actue', detail: 'Seriedad institucional.', effects: { stability: 2 } }
    ]
  },
  {
    id: 'socio_en_recesion',
    scope: 'nacional',
    title: 'Tu principal socio entra en recesion',
    emoji: '📉',
    tags: ['comercio', 'economia'],
    weight: 6,
    duration: 3,
    description: 'Cae la demanda del socio principal.',
    when: (c) => (c.trade?.changeVsStart ?? 0) < -8,
    ongoing: { gdp_growth: -0.15, happiness: -0.4 },
    sectorEffects: { commerce: -12 },
    choices: [
      { id: 'diversificar', label: 'Apurar misiones a otros mercados', detail: 'Reduce dependencia.', cost: { capital: 10 }, effects: { gdp_growth: 0.15, fiscal_balance: -0.2 } },
      { id: 'sostener', label: 'Sostener al exportador con credito', detail: 'Empeora la caja.', cost: { capital: 8, fiscal: 0.5 }, effects: { unemployment: -0.2, fiscal_balance: -0.5, happiness: 1 } },
      { id: 'nada', label: 'Dejar que el mercado ajuste', detail: 'Sin costo politico.', effects: { gdp_growth: -0.25, unemployment: 0.3 } }
    ]
  },
  {
    id: 'industria_contra_apertura',
    scope: 'nacional',
    title: 'La industria local contra la apertura',
    emoji: '🏭',
    tags: ['comercio', 'industria'],
    weight: 5,
    duration: 2,
    description: 'Camaras piden proteccion.',
    when: (c) => (c.trade?.changeVsStart ?? 0) > 5 || (c.player.sectors?.industry ?? 0) >= 15,
    ongoing: { stability: -0.3 },
    choices: [
      { id: 'proteger', label: 'Subir proteccion temporal', detail: 'Empleo a costa de precios.', cost: { capital: 10 }, effects: { unemployment: -0.3, inflation: 0.5, gdp_growth: -0.1 }, relations: [{ target: 'todos', amount: -4 }] },
      { id: 'mantener', label: 'Mantener la apertura y compensar', detail: 'Reconversion con gasto.', cost: { capital: 9, fiscal: 0.3 }, effects: { fiscal_balance: -0.3, happiness: -2, gdp_growth: 0.15 } }
    ]
  },
  {
    id: 'competidor_desplaza_asia',
    scope: 'nacional',
    title: 'Un competidor te desplaza en Asia',
    emoji: '🧭',
    tags: ['comercio', 'economia'],
    weight: 5,
    duration: 3,
    description:
      'Un vecino gana tu cuota en el mercado asiatico con precio y trato preferencial. Tus exportadores piden reaccion.',
    when: (c) => (c.trade?.changeVsStart ?? 0) < -6 || (c.trade?.topPartner === 'China'),
    ongoing: { unemployment: 0.08 },
    sectorEffects: { commerce: -10, industry: -6 },
    choices: [
      {
        id: 'bajar_precio',
        label: 'Compensar con reintegro exportador',
        detail: 'Recuperas cuota, la caja sangra.',
        cost: { capital: 10, fiscal: 0.45 },
        effects: { fiscal_balance: -0.45, unemployment: -0.15, gdp_growth: 0.1 }
      },
      {
        id: 'tratar_socio',
        label: 'Pedir trato al socio principal',
        detail: 'Dependes de su humor. Puede salir bien o como favor caro.',
        cost: { capital: 8 },
        effects: { stability: 1 },
        relations: [{ target: 'todos', amount: 2 }],
        risk: {
          chance: 0.4,
          label: 'El socio te pide alineamiento politico a cambio',
          effects: { capital: -4, happiness: -2 }
        }
      },
      {
        id: 'aceptar_cuota',
        label: 'Aceptar la perdida de cuota',
        detail: 'Sin costo politico hoy. El empleo industrial se encoge.',
        effects: { unemployment: 0.25, happiness: -2 }
      }
    ]
  },
  {
    id: 'deflacion_leve',
    scope: 'nacional',
    title: 'Deflacion leve: el poder de compra sube solo',
    emoji: '❄️',
    tags: ['economia', 'deflacion', 'salarios'],
    weight: 6,
    duration: 2,
    description:
      'Los precios ceden un poco. Si los salarios no caen, la calle lo siente como un aumento. Las reservas se fortalecen solas.',
    when: (c) => c.player.economy.inflation < 0 && c.player.economy.inflation >= -1.5,
    effects: { happiness: 3, gold_reserves_tonnes: 2, capital: 4 },
    ongoing: { happiness: 0.6 }
  },
  {
    id: 'trampa_deflacion',
    scope: 'nacional',
    title: 'Trampa suave de deflacion',
    emoji: '🧊',
    tags: ['economia', 'deflacion', 'crisis'],
    weight: 5,
    duration: 4,
    description:
      'Los precios caen de verdad. Familias y empresas postergan gasto a la espera de que sigan bajando. La deuda privada se vuelve mas pesada.',
    when: (c) => c.player.economy.inflation < -2,
    ongoing: { gdp_growth: -0.2, unemployment: 0.12, happiness: -0.4 },
    choices: [
      {
        id: 'gastar_contra_deflacion',
        label: 'Plan de gasto para romper expectativas',
        detail: 'Calentas demanda. Riesgo de volver a inflacion si te pasas.',
        cost: { capital: 12, fiscal: 0.8 },
        effects: { fiscal_balance: -0.8, gdp_growth: 0.4, inflation: 0.8, happiness: 2 }
      },
      {
        id: 'bajar_tasa',
        label: 'Bajar fuerte la tasa',
        detail: 'Barato politicamente. Si no hay credito, no pasa nada.',
        cost: { capital: 6 },
        effects: { gdp_growth: 0.2, inflation: 0.4, gold_reserves_tonnes: -2 }
      },
      {
        id: 'esperar_deflacion',
        label: 'Bancarte el ajuste de precios',
        detail: 'Reservas y superavit se fortalecen. El empleo tarda.',
        cost: { capital: 10 },
        effects: { gold_reserves_tonnes: 4, unemployment: 0.3, happiness: -3, fiscal_balance: 0.3 }
      }
    ]
  },
  {
    id: 'informalidad_galopante',
    scope: 'nacional',
    title: 'La informalidad se come el empleo',
    emoji: '🛠️',
    tags: ['empleo', 'economia', 'interior'],
    weight: 7,
    duration: 3,
    description:
      'El trabajo no desaparece: se va a negro. Cae la cobertura previsional y la recaudacion, aunque el desempleo oficial no explote.',
    when: (c) => c.player.economy.unemployment > 8 || c.player.economy.gdp_growth < 0.5,
    ongoing: { fiscal_balance: -0.12, happiness: -0.3 },
    choices: [
      {
        id: 'incentivar',
        label: 'Incentivar el blanqueo de puestos',
        detail: 'Costo fiscal ahora, cobertura despues. Si no fiscalizas, se abusa.',
        cost: { capital: 11, fiscal: 0.5 },
        effects: { fiscal_balance: -0.5, unemployment: -0.25, happiness: 2 }
      },
      {
        id: 'inspeccionar',
        label: 'Inspeccion masiva',
        detail: 'Entra plata y se cierran changas. La calle se calienta.',
        cost: { capital: 10 },
        effects: { fiscal_balance: 0.4, unemployment: 0.3, happiness: -4, stability: -2 }
      },
      {
        id: 'mirar_a_otro_lado',
        label: 'Dejar correr el trabajo en negro',
        detail: 'Paz social barata. El sistema previsional se ahoga en silencio.',
        effects: { happiness: 1, fiscal_balance: -0.3, unemployment: -0.1 }
      }
    ]
  },
  {
    id: 'recaudacion_cae_pbi',
    scope: 'nacional',
    title: 'La recaudacion cae mas que el PBI',
    emoji: '📉',
    tags: ['economia', 'impuestos'],
    weight: 6,
    duration: 3,
    description:
      'La economia se contrae y la caja cae mas que proporcional (elasticidad > 1). El superavit se complica solo.',
    when: (c) => c.player.economy.gdp_growth < 0,
    ongoing: { fiscal_balance: -0.2 },
    choices: [
      {
        id: 'subir_tasa_impositiva',
        label: 'Subir alicuotas para tapar el agujero',
        detail: 'Caja ya. Actividad y formalizacion despues, para mal.',
        cost: { capital: 12 },
        effects: { fiscal_balance: 0.7, gdp_growth: -0.35, happiness: -4, unemployment: 0.2 }
      },
      {
        id: 'bajar_para_crecer',
        label: 'Bajar impuestos y apostar al rebote',
        detail: 'Duele 2 a 4 anios. Si no hay credibilidad, solo perdes caja.',
        cost: { capital: 10 },
        effects: { fiscal_balance: -0.8, gdp_growth: 0.25, happiness: 3, unemployment: -0.1 }
      },
      {
        id: 'recortar_gasto',
        label: 'Recortar gasto a la par',
        detail: 'Cuentas ordenadas, calle enojada.',
        cost: { capital: 14 },
        effects: { fiscal_balance: 0.5, happiness: -5, stability: -3, unemployment: 0.25 }
      }
    ]
  },
  {
    id: 'reforma_jubilatoria_calle',
    scope: 'nacional',
    title: 'La calle sale contra la reforma previsional',
    emoji: '🧓',
    tags: ['previsional', 'protesta', 'economia'],
    weight: 5,
    duration: 2,
    description:
      'Cualquier reforma que alargue edad o baje haber tiene costo politico real. Los gremios y los jubilados llenan la avenida.',
    when: (c) =>
      c.player.economy.fiscal_balance < -2
      || c.player.economy.debt_to_gdp > 70
      || (c.street?.streetWeight ?? 0) >= 4,
    ongoing: { stability: -0.5, happiness: -0.4 },
    choices: [
      {
        id: 'suavizar',
        label: 'Suavizar la reforma y comprar tiempo',
        detail: 'Baja el conflicto, la caja no se ordena.',
        cost: { capital: 12 },
        effects: { happiness: 3, stability: 2, fiscal_balance: -0.3 }
      },
      {
        id: 'sostener_reforma',
        label: 'Sostener la reforma',
        detail: 'Sostenibilidad contra capital politico. Nunca es gratis.',
        cost: { capital: 18 },
        effects: { fiscal_balance: 0.8, happiness: -6, stability: -4, unemployment: 0.15 }
      },
      {
        id: 'compensar_haberes',
        label: 'Compensar haberes con bono',
        detail: 'Parche. La reforma queda a medias y el deficit vuelve.',
        cost: { capital: 10, fiscal: 0.5 },
        effects: { fiscal_balance: -0.5, happiness: 2, inflation: 0.3 }
      }
    ]
  }
];


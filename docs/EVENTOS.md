# Catálogo de eventos

El catálogo vivo está en el juego (pestaña **📚 Eventos**). Este documento es la referencia para editarlo.

- **Mundiales** → `lib/events/world.ts`. Le pasan al planeta. `worldEffects` aplica a todos los países.
- **Nacionales** y **de liderazgo** → `lib/events/national.ts`. Se disparan por tu situación interna.

Probabilidad por turno (igual que el motor Python original): **25%** mundial, **35%** nacional, **15%** liderazgo. Dentro de cada categoría se sortea por `weight`, filtrando por `when` y descartando los 8 últimos eventos ocurridos para que no se repitan.

Si un evento tiene `choices`, frena el turno y espera tu decisión. Si lo ignorás y avanzás de mes, se aplica el efecto por defecto **más una penalidad de estabilidad**: la inacción también es una decisión.

---

## Eventos mundiales (14)

| Evento | Se dispara | Qué mueve | Opciones |
|---|---|---|---|
| 🛢️ Shock petrolero en el Golfo | siempre | inflación mundial +0.8, petróleo +12 | — |
| 📉 Recesión global sincronizada | siempre | crecimiento −0.9, desempleo +0.5 en todo el mundo | — |
| 🦠 Brote viral con potencial pandémico | siempre | crecimiento −0.5, felicidad −3 global | cerrar fronteras / comprar vacunas / esperar (50% de que escale) |
| ⚔️ Guerra comercial entre potencias | siempre | crecimiento −0.4, inflación +0.5 | alinearte con EE.UU. / con China / no alineado |
| 💥 Estalla una guerra regional | siempre | tensión +12, petróleo +8, gasto militar global | condenar en la ONU / mediar / venderle a los dos |
| 🖥️ Ciberataque a infraestructura crítica | siempre | crecimiento −0.2, estabilidad −2 | — |
| 🌍 Cumbre climática mundial | siempre | — | metas ambiciosas / moderadas / no firmar |
| 🛡️ La OTAN abre una ronda de ampliación | siempre | tensión global +7 | — |
| 🤝 Cumbre BRICS+ y desdolarización | siempre | tensión global +3 | — |
| 🚶 Crisis migratoria global | siempre | estabilidad y felicidad −2 global | — |
| 🤖 Salto tecnológico en IA y semiconductores | siempre | crecimiento +0.2 global | plan nacional / importar tecnología / no hacer nada |
| 📊 Derrumbe de commodities | siempre | crecimiento −0.3 global, petróleo −10 | — |
| 🏚️ Crisis de deuda en emergentes | siempre | deuda +2, inflación +0.4 global | — |
| 🌀 Temporada extrema de desastres climáticos | siempre | fiscal −0.3, felicidad −2 global | — |

## Eventos nacionales (15)

| Evento | Se dispara cuando | Opciones |
|---|---|---|
| 🚧 Piquetes y cortes de ruta | felicidad < 62 **o** desempleo > 8% | despejar con fuerzas federales (30% de que haya un herido) / negociar / esperar el desgaste |
| ✊ Paro general | inflación > 12% **o** desempleo > 9% | paritarias de emergencia / sostener el plan / bono por única vez |
| 📣 Marcha opositora masiva | felicidad < 58 | cambiar el gabinete / mesa de diálogo / confrontar |
| ⚖️ Pedido de juicio político | estabilidad < 45 | negociar votos con gobernadores / movilizar / dejar correr |
| 💼 Escándalo de corrupción | siempre | echar a los involucrados / defenderlos / auditoría externa (40% de que aparezca más) |
| 💸 Corrida cambiaria | inflación > 20% **o** déficit > 3.5% | subir la tasa / vender reservas (45% de que se acelere) / cepo |
| 🏦 Vencimiento con el FMI | deuda > 60% del PBI | acordar con metas / renegociar plazos / no pagar |
| 🌵 Sequía severa | país con agricultura ≥ 5% | automático: crecimiento −0.7, fiscal −0.5 |
| 🌾 Boom de commodities | país con agricultura ≥ 5% | acumular reservas / volcarlo a gasto / bajar retenciones |
| 🚔 Motín policial | estabilidad < 55 **e** inflación > 8% | ceder el aumento / desplegar al ejército |
| 🔌 Apagón eléctrico nacional | siempre | automático: felicidad −5, crecimiento −0.3 |
| 🔫 Ola de inseguridad y narcotráfico | siempre | mano dura (30% de denuncias por abusos) / cooperación regional |
| 🗳️ Elecciones de medio término | cada 24 turnos | — |
| 🧳 Ingreso masivo de migrantes | siempre | abrir con plan de integración / militarizar la frontera |
| 🏫 Huelga docente | inflación > 6% | mejorar la oferta / descontar los días |
| 🏗️ Oleada de inversión extranjera | estabilidad > 55 | automático: crecimiento +0.6, desempleo −0.3 |

## Eventos de liderazgo (4)

| Evento | Se dispara cuando | Opciones |
|---|---|---|
| 🩺 Problema de salud del jefe de Estado | siempre | publicar el parte médico / minimizar (40% de que se filtre algo peor) |
| 🚪 Crisis de gabinete | siempre | automático: estabilidad −4, capital −5 |
| 🎙️ Discurso que moviliza al país | felicidad > 40 | automático: felicidad +4, capital +6 |
| 📼 Filtración de audios privados | siempre | automático: felicidad −4, capital −6 |

## Evento forzado

**🔥 Crisis institucional** aparece sin sorteo cuando estabilidad < 30 **y** felicidad < 40. Opciones: adelantar elecciones (perdés poder, salvás el país) o resistir hasta el final del mandato.

---

## Cómo agregar un evento

```ts
{
  id: 'mi_evento',                  // único
  scope: 'nacional',                // 'mundial' | 'nacional' | 'personal'
  title: 'Título que ve el jugador',
  emoji: '🔥',
  tags: ['protesta'],
  weight: 6,                        // peso relativo en el sorteo
  duration: 2,
  description: 'Qué está pasando, en 1-2 oraciones.',
  when: (c) => c.player.economy.inflation > 10,   // opcional
  choices: [                                       // opcional
    {
      id: 'opcion_a',
      label: 'Lo que hace el gobierno',
      detail: 'Qué implica, incluyendo el costo.',
      cost: { capital: 10, fiscal: 0.4 },
      effects: { happiness: 3, inflation: 0.2 },
      relations: [{ target: 'vecinos', amount: -5 }],
      risk: { chance: 0.3, label: 'Qué sale mal', effects: { stability: -8 } }
    }
  ]
}
```

**Targets de relación disponibles**: `'todos'`, `'vecinos'` (misma región), `'bloc:militar'` / `'bloc:aduanera'` (socios de ese tipo de bloque), `'TARGET'` (el país seleccionado) o el código de un país (`'USA'`, `'Brazil'`).

**Métricas que acepta `effects`**: `happiness`, `stability`, `gdp_growth`, `inflation`, `unemployment`, `fiscal_balance`, `debt_to_gdp`, `military_budget_bn`, `gold_reserves_tonnes`, `capital`, `global_tension`, `oil_price`.

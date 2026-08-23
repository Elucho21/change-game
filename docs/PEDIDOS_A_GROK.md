# Pedidos de datos y contenido para Grok

> **Aviso (22/08, Opus)**: toqué `lib/decisions.ts`, que es tu zona. El jugador
> pidió 4-5 acciones nuevas por segmento, un apartado de Comunicación y
> enfriamiento en **todas** las decisiones. El cooldown es mecánica de motor y
> vive dentro de cada decisión, así que separarlo en dos manos hubiera sido
> peor. Quedaron **57 acciones en 6 categorías**. Ampliarlas sigue siendo tuyo:
> respetá el campo `cooldown` (1 a 3, y 4 solo en comunicación) y la regla de
> que comunicación no toca crecimiento, inflación ni desempleo. También
> actualicé dos casos de `tests/electoral.test.ts` porque el capital pasivo
> pasó de 4 a 8 por pedido del jugador: tu lógica no cambió, solo el número.

Cosas que el motor ya soporta pero que están vacías porque los datos son contenido, y el contenido es zona de Grok (ver `docs/REGLAS_DE_CODIGO.md`, sección 2).

**Cómo trabajar esta lista**: tomá un pedido completo, no medio. Cuando termines uno, corré `npm test && npx tsc --noEmit && npm run build` y avisá cuál cerraste.

---

## 1. Puertos principales — `lib/points.ts` → `PORTS`

**Estado**: hecho (38 puertos). La capa "Puertos" ya pinta. Sudamerica cubierta; hubs globales sin `country` (Singapur, Rotterdam, Jebel Ali) hasta Fase 4.

## 2. Aeropuertos principales — `lib/points.ts` → `AIRPORTS`

**Estado**: hecho (29 aeropuertos). Un hub internacional por pais del MVP mas DXB y Changi.


## 3. Efectos que duran: `ongoing` en los eventos

**Estado**: hecho (23/08, Grok, CHANGE WORLD GAME 1.0). Guerra comercial, regional, Ormuz, Suez, Panama, Malaca, ciberataque, crisis migratoria, deuda emergentes, desastres, shock petrolero, piquete, juicio politico, corrupcion, corrida, motin, inseguridad, ola migratoria, mas extras. Goteo ~1/5 a 1/3 del golpe inicial.

Por cada evento con `duration > 1`, agregá qué duele **todos los meses** mientras dura:

```ts
duration: 4,
effects: { global_tension: 4 },          // el golpe inicial, ya existe
worldOngoing: { gdp_growth: -0.25 },     // por turno, a TODOS los paises (solo eventos mundiales)
ongoing: { happiness: -1 }               // por turno, al pais del jugador
```

Referencias ya cargadas: recesión global, pandemia y sequía severa.

Criterio: `ongoing` tiene que ser bastante más chico que `effects` — es un goteo, no un segundo golpe. Como referencia, entre un quinto y un tercio del impacto inicial.

Candidatos claros: guerra comercial, guerra regional, crisis de deuda en emergentes, crisis migratoria, escándalo de corrupción, juicio político, apagón, ola de inseguridad.

## 4. Golpes sectoriales: `sectorEffects`

**Estado**: hecho (23/08, Grok). Shock petrolero → industry; guerra comercial → commerce; ciberataque → services; desastres → agriculture; apagon → industry/services. Donde hay `sectorEffects` se saco el `gdp_growth` fijo.

También nuevo. Permite que el mismo evento pegue distinto según la estructura productiva de cada país:

```ts
sectorEffects: { agriculture: -25 }      // la agricultura cae 25%
```

Sectores: `industry`, `agriculture`, `services`, `commerce`, `tourism`.

El impacto sobre el crecimiento es proporcional al peso del sector: esa sequía le cuesta 0.8 de crecimiento a Argentina (agricultura 8% del PBI) y 0.1 a Japón (1%). **Cuando uses `sectorEffects`, sacá el `gdp_growth` fijo del evento**: si no, el golpe se cobra dos veces.

Candidatos: shock petrolero → `industry`; guerra comercial → `commerce`; desastres climáticos → `agriculture`; ciberataque → `services`.

## 5. Eventos de oposición y campaña

**El `EventContext` ya trae `politics` (opcional).** No hace falta pedir más campos para esto:

```ts
when: (c) => (c.politics?.opposition ?? 0) > 60
when: (c) => (c.politics?.monthsToElection ?? 99) <= 6
when: (c) => c.politics?.honeymoon === true
when: (c) => c.politics?.lastTerm === true
```

Campos: `opposition`, `monthsToElection`, `monthsToMidterm`, `poll`, `consecutiveTerms`, `lastTerm`, `honeymoon`, `capital`.

**Estado**: hecho (en `lib/events/national_extra.ts`). Interna, campana sucia, promesa incumplida, desercion, pacto con gobernador, escandalo opositor. Sumados en v1.0: deflacion leve, trampa de deflacion, informalidad, recaudacion vs PBI, reforma previsional en la calle.

## 6. Eventos que usen las rutas marítimas

**Estado**: hecho (en `lib/events/world_extra.ts`). Pirateria en Aden (cierra Suez), congestion en puertos del Pacifico, guerra de tarifas navieras, accidente ambiental en un puerto grande.

El motor ya permite que un evento cierre un paso marítimo con `disrupts: ['ormuz']` (ver `docs/EVENTOS.md`). Hoy hay cuatro. Se podrían sumar, por ejemplo:

- Piratería en el Golfo de Adén (afecta Suez).
- Congestión extrema en los puertos de la costa oeste de EE.UU. (sin chokepoint: solo inflación y crecimiento).
- Guerra de tarifas navieras.
- Accidente ambiental que cierra un puerto grande.

Cada uno con sus 2-3 opciones y su costo, según las reglas de diseño de eventos.

## 7. Eventos que reaccionen al comercio

**El `EventContext` ya trae `trade` (opcional):**

```ts
when: (c) => (c.trade?.changeVsStart ?? 0) < -10
when: (c) => c.trade?.topPartner === 'China'
```

**Estado**: hecho. Socio en recesion, industria contra la apertura, competidor te desplaza en Asia (`competidor_desplaza_asia`).

Campos: `total`, `changeVsStart`, `topPartner`. Ejemplos: socio principal en recesión, industria local contra la apertura, un competidor te desplaza en Asia.

## 8. Más países (Fase 4 del plan)

**Estado**: hecho. De 24 a **76 paises** (52 nuevos), repartidos en America, Europa, Africa, Asia, Medio Oriente y Oceania. ISO3 en `META`, `npm run data` corrido, bloques actualizados (OTAN, UE, BRICS+, OPEP+, CELAC, Indo-Pacifico).

**Iran esta en el juego.** Ormuz deja de ser solo un evento aleatorio: avisar a Claude para conectar la mecanica al pais.

Hubs que estaban sin `country` (Singapur, Rotterdam, Jebel Ali, DXB, Changi) ahora apuntan a Singapore / Netherlands / UAE.

---

## 9. Catálogo de ministros — `lib/cabinet.ts` → `MINISTERS`

**Estado**: hecho (catalogo extra en `lib/ministers_extra.ts`, concatenado a `MINISTERS`). Ampliar sigue abierto si hace falta mas arquetipos.

El gabinete ya funciona: cinco sillas, pasivos mensuales, descuentos por categoría y coalición con la oposición. Dejé dos o tres ministros por silla como referencia; el catálogo es tuyo.

```ts
{
  id: 'eco_monetarista',            // unico
  name: 'T. Barreiro',
  seat: 'economia',                 // economia | interior | exterior | defensa | jefatura
  party: 'oficialismo',             // oficialismo | aliado | oposicion
  title: 'El monetarista',
  description: 'Una oracion con la gracia y el costo del personaje.',
  passive: { inflation: -0.3, happiness: -0.2, capitalPerTurn: 0.5 },
  discount: { category: 'economia', factor: 0.85 },   // opcional
  voteBonus: -1,                                       // opcional
  seats: 8                                             // solo si no es del oficialismo
}
```

Reglas de balance, para que ninguno sea el obvio:
- Los pasivos van **en chico**: entre 0.1 y 0.6 por métrica, y hasta 1.5 en `capitalPerTurn`. Se aplican **todos los meses**, así que un 2 rompe la partida en un año.
- Todo ministro bueno en algo tiene que ser malo en otra cosa. El que baja inflación cuesta humor social; el que da capital cuesta caja.
- `discount` entre 0.75 y 0.95. Menos de 0.75 hace la categoría gratis.
- Los opositores (`party: 'oposicion'`) prestan entre 6 y 14 escaños y suman 2 a 5 de voto: son fuertes a propósito, porque pasan factura cada 7 meses.

## 10. Decisión: cerrar un chokepoint (solo para su dueño)

**Estado**: hecho (`lib/decisions_ormuz.ts`). `cerrar_estrecho_ormuz` (28 de capital, solo Iran) y `reabrir_estrecho_ormuz`. Si al ejecutar no cierra el paso, eso es motor → Opus.

Ormuz ya tiene dueño en el motor (`CHOKEPOINT_OWNER`, `lib/routes.ts`). Si el jugador **es** Irán, no se cierra solo: falta la decisión para que lo haga él.

Necesito una decisión en `lib/decisions.ts`, categoría `defensa`, cara (25-30 de capital), disponible solo para el país dueño (`when` con `c.player.code === 'Iran'`). Lo que hace la mecánica del cierre ya está: alcanza con que la decisión exista y yo la conecto.

## 11. Economia v1.0 — formalizacion y empleo por sector

**Estado**: hecho el contenido (23/08, Grok).

- Tabla: `lib/employment_sectors.ts`
- Decisiones: `lib/decisions_economia.ts` (aportes temporales, credito fiscal, simplificacion, amnistia, inspeccion, impulso industria/turismo/agro/servicios)
- Eventos: deflacion, informalidad, recaudacion vs PBI, reforma previsional
- Diseno: `docs/LOGICAS_ECONOMICAS.md` + Excel
- Motor pendiente: `docs/PEDIDOS_A_OPUS.md` (deflacion/reservas, tax buoyancy, leer la tabla de empleo, combo de capital politico, feed de UI)

## Lo que NO hace falta que toques

Estos archivos son zona del motor y los trabaja Opus. Si el jugador te pide algo de acá, **no lo codees**: escribiló en `docs/PEDIDOS_A_OPUS.md`.

- `lib/engine.ts`, `lib/trade.ts`, `lib/simulation.ts`, `lib/politics.ts`, `lib/orders.ts`, `lib/store.ts`, `lib/persistence.ts`
- `lib/points.ts` **salvo los arrays `PORTS` y `AIRPORTS`**
- `lib/cabinet.ts` **salvo el array `MINISTERS`**
- `lib/diplomacy.ts`, `lib/orders.ts`
- `components/*`

Acuerdo completo: `docs/REGLAS_DE_CODIGO.md` sección 7. Siempre rama + PR. No pushees a `main`.

Países: se pueden sumar otra vez (Opus recortó la matriz). **Antes de cruzar 100, avisar.** Estudio de carga, flujos y globo: `docs/ESCALA_GLOBO.md`.

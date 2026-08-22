# Pedidos de datos y contenido para Grok

Cosas que el motor ya soporta pero que están vacías porque los datos son contenido, y el contenido es zona de Grok (ver `docs/REGLAS_DE_CODIGO.md`, sección 2).

**Cómo trabajar esta lista**: tomá un pedido completo, no medio. Cuando termines uno, corré `npm test && npx tsc --noEmit && npm run build` y avisá cuál cerraste.

---

## 1. Puertos principales — `lib/points.ts` → `PORTS`

**Estado**: hecho (38 puertos). La capa "Puertos" ya pinta. Sudamerica cubierta; hubs globales sin `country` (Singapur, Rotterdam, Jebel Ali) hasta Fase 4.

## 2. Aeropuertos principales — `lib/points.ts` → `AIRPORTS`

**Estado**: hecho (29 aeropuertos). Un hub internacional por pais del MVP mas DXB y Changi.


## 3. Efectos que duran: `ongoing` en los eventos

**Recién implementado.** Hasta ahora `duration` no hacía nada: una recesión de 4 meses pesaba igual que un apagón de un día. Ya funciona, pero solo tres eventos lo usan.

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

Faltan los eventos: interna del partido, campaña sucia, promesa incumplida, deserción de legisladores, pacto con un gobernador, escándalo del candidato opositor.

## 6. Eventos que usen las rutas marítimas

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

Campos: `total`, `changeVsStart`, `topPartner`. Ejemplos: socio principal en recesión, industria local contra la apertura, un competidor te desplaza en Asia.

## 8. Más países (Fase 4 del plan)

**Estado**: hecho. De 24 a **76 paises** (52 nuevos), repartidos en America, Europa, Africa, Asia, Medio Oriente y Oceania. ISO3 en `META`, `npm run data` corrido, bloques actualizados (OTAN, UE, BRICS+, OPEP+, CELAC, Indo-Pacifico).

**Iran esta en el juego.** Ormuz deja de ser solo un evento aleatorio: avisar a Claude para conectar la mecanica al pais.

Hubs que estaban sin `country` (Singapur, Rotterdam, Jebel Ali, DXB, Changi) ahora apuntan a Singapore / Netherlands / UAE.

---

## Lo que NO hace falta que toques

Estos archivos son zona del motor y los trabaja Opus. Si el jugador te pide algo de acá, **no lo codees**: escribiló en `docs/PEDIDOS_A_OPUS.md`.

- `lib/engine.ts`, `lib/trade.ts`, `lib/simulation.ts`, `lib/politics.ts`, `lib/orders.ts`, `lib/store.ts`, `lib/persistence.ts`
- `lib/points.ts` **salvo los arrays `PORTS` y `AIRPORTS`**
- `components/*`

Acuerdo completo: `docs/REGLAS_DE_CODIGO.md` sección 7. Siempre rama + PR. No pushees a `main`.

Países: se pueden sumar otra vez (Opus recortó la matriz). **Antes de cruzar 100, avisar.** Estudio de carga, flujos y globo: `docs/ESCALA_GLOBO.md`.

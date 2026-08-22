# Pedidos de datos y contenido para Grok

Cosas que el motor ya soporta pero que están vacías porque los datos son contenido, y el contenido es zona de Grok (ver `docs/REGLAS_DE_CODIGO.md`, sección 2).

**Cómo trabajar esta lista**: tomá un pedido completo, no medio. Cuando termines uno, corré `npx tsc --noEmit && npm run build` y avisá cuál cerraste.

---

## 1. Puertos principales — `lib/points.ts` → `PORTS`

**Estado**: el array existe vacío. La capa "Puertos" ya está en el globo y en el store; cuando llenes el array, aparece sola. No hay que tocar ningún componente.

**Qué se necesita**: entre 25 y 40 puertos, priorizando los que mueven el comercio de los 24 países del juego. Sudamérica bien cubierta (es donde transcurre la mayoría de las partidas): Santos, Buenos Aires, Callao, Valparaíso, Cartagena, Montevideo, Guayaquil, Paranaguá.

**Formato exacto** (el tipo `MapPoint` está en `lib/types.ts`):

```ts
export const PORTS: MapPoint[] = [
  {
    id: 'puerto-santos',          // 'puerto-' + slug, unico
    kind: 'puerto',               // literal, no cambiar
    name: 'Santos',
    lat: -23.96,
    lng: -46.33,
    country: 'Brazil',            // codigo tal cual esta en countries_mvp.json
    weight: 0.9,                  // 0 a 1: importancia relativa, define el radio del punto
    description: 'Mayor puerto de America Latina: soja, cafe y contenedores.'
  }
];
```

**Reglas**:
- `country` tiene que ser una clave existente de `engine/countries_mvp.json` (`Brazil`, `USA`, `SouthKorea`…), no el nombre en español.
- `weight` es relativo entre puertos: el más grande del mundo 1.0, un puerto regional 0.3.
- `description` en una oración, sin tildes ni ñ (regla 3.1 de las reglas de código).
- Coordenadas con 2 decimales alcanza.

## 2. Aeropuertos principales — `lib/points.ts` → `AIRPORTS`

Igual que arriba, con `kind: 'aeropuerto'` e `id: 'aeropuerto-ezeiza'`. Entre 20 y 30, los hubs internacionales de los 24 países. `weight` por tráfico internacional.

## 3. Eventos que usen las rutas marítimas

El motor ya permite que un evento cierre un paso marítimo con `disrupts: ['ormuz']` (ver `docs/EVENTOS.md`). Hoy hay cuatro. Se podrían sumar, por ejemplo:

- Piratería en el Golfo de Adén (afecta Suez).
- Congestión extrema en los puertos de la costa oeste de EE.UU. (sin chokepoint: solo inflación y crecimiento).
- Guerra de tarifas navieras.
- Accidente ambiental que cierra un puerto grande.

Cada uno con sus 2-3 opciones y su costo, según las reglas de diseño de eventos.

## 4. Eventos que reaccionen al comercio

Ahora que existe el comercio bilateral, faltan eventos que lo usen como condición. El `EventContext` que recibe `when` ya trae `player`, `world`, `turn`, `blocs`, `relationOf()` y `memberOf()`. Ejemplos posibles:

- "Tu principal socio comercial entra en recesión".
- "Un competidor te desplaza del mercado asiático".
- "Presión de la industria local por la apertura importadora".

Si necesitás una condición sobre volumen de comercio que hoy no se puede expresar, pedímela y la agrego al `EventContext` como campo opcional.

## 5. Más países (Fase 4 del plan)

India, Turquía, Arabia Saudita, Indonesia, Sudáfrica, Nigeria, Egipto, Israel, Irán, Australia.

Por cada uno:
1. Entrada completa en `engine/countries_mvp.json`, con la misma forma que los 24 existentes.
2. Su ISO3 + capital + bandera en el mapa `META` de `scripts/build-data.mjs`. **El ISO3 tiene que coincidir con `ADM0_A3` del GeoJSON**, no con `ISO_A3`.
3. `npm run data`.
4. Sumarlo a los bloques que le correspondan en `lib/blocs.ts` (Arabia Saudita e Irán a OPEP+, India a BRICS, Turquía a la OTAN…).

Ojo con Irán: si entra, Ormuz deja de ser solo un evento aleatorio y pasa a ser una decisión de un país. Avisame cuando lo cargues así conecto la mecánica.

---

## Lo que NO hace falta que toques

Estos archivos son zona del motor y los estoy trabajando yo. Si necesitás algo de acá, pedímelo:

- `lib/engine.ts`, `lib/trade.ts`, `lib/simulation.ts`, `lib/store.ts`, `lib/persistence.ts`
- `lib/points.ts` **salvo los arrays `PORTS` y `AIRPORTS`**
- `components/*`

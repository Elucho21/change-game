# Trabajar con Grok sobre este repo

Dos formas de usar Grok acá, y conviene no mezclarlas.

---

## 1. Grok como motor de realismo (durante la partida)

El motor local (`lib/engine.ts`) resuelve lo que tiene que ser determinista: números, sorteo de eventos, cohesión de bloques, fin de partida. Grok aporta lo que un motor no puede: **cómo reacciona cada país y cómo se cuenta el turno**.

Flujo:

1. En el juego, botón **🤖 Grok** → copia el prompt del turno.
2. Pegalo en Grok (usa el marco de `docs/PROMPT_MAESTRO.md`).
3. Grok devuelve JSON.
4. Pegá el JSON en el mismo panel → **Aplicar al juego**.

Formato que el juego sabe leer (`applyGrokJson` en `lib/store.ts`):

```json
{
  "reactions": [
    {
      "country": "Brazil",
      "action": "Brasilia convoca a tu embajador",
      "relation_change": -8,
      "intensity": 3,
      "public_statement": "Esperamos coordinación dentro del bloque"
    }
  ],
  "internal_extra_effects": [
    { "metric": "happiness", "value": -2, "why": "presión mediática" }
  ],
  "narrative": "2-4 oraciones de lo que pasó en el mundo este turno."
}
```

Reglas de lectura:

- `country` acepta el código (`Brazil`, `USA`, `SouthKorea`) o el nombre en español (`Brasil`).
- `relation_change` se recorta a ±25 por turno para que Grok no rompa el balance.
- `metric` debe ser una de: `happiness`, `stability`, `gdp_growth`, `inflation`, `unemployment`, `fiscal_balance`, `debt_to_gdp`, `military_budget_bn`, `gold_reserves_tonnes`, `global_tension`, `oil_price`. Cada efecto se recorta a ±15.
- Cualquier otra clave se ignora en silencio: no rompe la partida.

## 2. Grok como programador (sobre el código)

Si Grok va a escribir código en este repo, conviene darle límites claros para que no pisemos trabajo.

**Contrato que no se toca sin avisar:**

- `lib/types.ts` — el contrato de tipos de todo el juego.
- `engine/countries_mvp.json` — fuente de verdad de los países. Si se toca, hay que correr `npm run data`.
- El formato JSON de la sección 1.

**Zonas seguras para trabajar en paralelo** (archivos distintos, poco riesgo de conflicto):

| Zona | Archivos | Buena para |
|---|---|---|
| Contenido de eventos | `lib/events/*.ts` | sumar eventos nuevos sin tocar el motor |
| Decisiones | `lib/decisions.ts` | sumar acciones del jugador |
| Bloques | `lib/blocs.ts` | sumar alianzas o cambiar reglas de un bloque |
| Datos de países | `engine/countries_mvp.json` + `scripts/build-data.mjs` | ampliar el mapa |
| Motor | `lib/engine.ts`, `lib/store.ts` | economía, IA, turno — **zona caliente, una persona por vez** |
| Interfaz | `components/*.tsx` | paneles, globo, visual |

**Antes de cualquier commit:**

```bash
npm run data
npx tsc --noEmit
npm run build
```

**Prompt sugerido para arrancar una sesión con Grok:**

> Trabajás sobre el repo `change-game`: Next.js 15 + TypeScript + react-globe.gl, juego de geopolítica por turnos.
> Leé `README.md`, `docs/PLAN_MEJORAS.md` y `lib/types.ts` antes de escribir nada.
> No cambies `lib/types.ts` ni el formato de `engine/countries_mvp.json` sin avisarme.
> Tu tarea: [tarea concreta, de una sola zona de la tabla de arriba].
> Al terminar: corré `npx tsc --noEmit` y `npm run build`, y contame en 5 líneas qué cambiaste.

## División de trabajo sugerida

Lo que más rinde repartir, según el plan (`docs/PLAN_MEJORAS.md`):

- **Grok**: contenido en volumen — más eventos, más países en el JSON, más decisiones. Es trabajo paralelo, aislado y de bajo riesgo de conflicto.
- **Claude Code / vos**: motor y visual — comercio bilateral, ciclo electoral, guerra limitada, animaciones del globo. Es donde los archivos se pisan.

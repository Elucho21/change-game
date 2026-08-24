# CHANGE WORLD GAME – Líderes Minoritarios: Diagnóstico y Fix
**Para Claude / Grok Build**  
Fecha: 2026-08-24  
**Regla dura: NO bajar los umbrales de desempleo / environment / security.**

---

## 1. Problema reportado

El jugador llegó al **mes 60 con 14% de desempleo** y **no apareció ninguna carta** de Gustavo Común, Amalia Verde ni Jhon el Duro.

El contenido existe y está cableado. El bloqueo no es de umbral de desempleo.

---

## 2. Estado del contenido (correcto)

| Pieza | Archivo | Estado |
|-------|---------|--------|
| 12 eventos de los 3 líderes | `lib/events/minority_leaders.ts` | Existe |
| Inyección al pool nacional | `lib/boot_content.ts` | `NATIONAL_EVENTS.push(...MINORITY_LEADER_EVENTS)` |
| Condición común | `when: (c) => !!c.moral?.onboarded && ...` | Obligatoria |
| Umbrales Gustavo | desempleo > 8 / 9 / 10 / 12 según carta | **No tocar** |
| Umbrales Amalia | `environmentIndex` bajo | **No tocar** |
| Umbrales Jhon | `securityIndex` alto | **No tocar** |

Ejemplo real de Gustavo:

```ts
when: (c) => !!c.moral?.onboarded && c.player.economy.unemployment > 12
```

Con 14% de desempleo, si `onboarded === true` y `moral` llega al contexto, la carta **debería ser elegible**.

---

## 3. Causas probables (orden de probabilidad)

### 3.1 `moral.onboarded === false` (más probable)

Todos los eventos exigen:

```ts
!!c.moral?.onboarded
```

Si el onboarding de Enrique no se completó o el save no persistió el flag, **ninguna carta puede salir**, sin importar el desempleo.

`defaultMoral()` arranca con `onboarded: false` (`lib/moral.ts`).

### 3.2 `moral` no llega a `rollEvents`

`buildCtx` / `rollEvents` reciben `extra.moral` desde `eventExtraOf` (`lib/simulation.ts`).

Si en el store `moral` es `undefined` (save viejo, hidratación incompleta, o no se setea tras el onboarding), el `when` falla en silencio:

```ts
c.moral?.onboarded  // → undefined → falsy → evento descartado
```

### 3.3 Competencia del pool + RNG

- Chance de evento nacional por turno: **35%**
- Muchos eventos nacionales compiten por peso
- Filtro `recentIds` evita repeticiones recientes

Aunque sea elegible, puede no salir durante varios turnos. Eso **no explica** cero apariciones en 60 meses con desempleo alto.

### 3.4 No es el umbral de desempleo

Con 14% se cumplen los `when` de Gustavo que piden `> 12`, `> 10`, `> 9` y `> 8`.  
Si no salen, el bloqueo está antes: `onboarded` o el pasaje de `moral`.

---

## 4. Diagnóstico en runtime (para el jugador / Claude)

En la consola del navegador:

```js
const S = () => window.__game.getState();
console.log({
  onboarded: S().moral?.onboarded,
  moral: S().moral,
  unemployment: S().countries[S().playerCode]?.economy.unemployment,
  environmentIndex: S().moral?.environmentIndex,
  securityIndex: S().moral?.securityIndex,
  gustavoApoyo: S().moral?.gustavoApoyo,
  amaliaApoyo: S().moral?.amaliaApoyo,
  jhonApoyo: S().moral?.jhonApoyo
});
```

Interpretación:

| Resultado | Conclusión |
|-----------|------------|
| `onboarded: false` o `moral: undefined` | Bug de onboarding / persistencia / hidratación |
| `onboarded: true` + desempleo 14% | Elegibles; problema de sorteo o de que `moral` no llega a `rollEvents` |
| `onboarded: true` pero `moral` no está en el contexto del sorteo | Bug en `eventExtraOf` o en la llamada desde `store.ts` |

---

## 5. Fixes recomendados (SIN bajar umbrales)

### Fix A – Garantizar `onboarded` y persistencia

1. Al completar el onboarding de Enrique, setear de forma explícita:

```ts
moral = { ...moral, onboarded: true };
```

2. Incluir `moral` (con `onboarded`) en el save (`lib/persistence.ts`).
3. Al hidratar un save viejo sin `moral`, crear `defaultMoral()` y, si el jugador ya pasó el turno de onboarding histórico, considerar migrar `onboarded: true` con cuidado (o forzar re-onboarding una sola vez).

### Fix B – Garantizar que `moral` llegue al sorteo

En `eventExtraOf` / llamada a `rollEvents` desde `store.ts`:

```ts
// Siempre pasar moral si existe en el estado
eventExtra: {
  ...otros,
  moral: s.moral  // no omitir
}
```

Verificar que `endTurn` construye el contexto **después** de tener `s.moral` actualizado.

### Fix C – Visibilidad (no cambia umbrales)

- Mostrar en UI un indicador permanente de apoyo:
  - Gustavo / Amalia / Jhon (valores de `gustavoApoyo`, etc.)
- En el feed, cuando un líder está “activo” (apoyo alto) pero no salió carta, no hace falta forzar evento; solo que el jugador vea que existen.

### Fix D – Pity / peso mínimo (opcional, sin tocar `when`)

Solo **después** de `onboarded === true`:

```ts
// Idea: si llevan N turnos onboarded y nunca salió un evento de minoritarios,
// subir temporalmente el weight de las cartas elegibles en este turno.
// NO cambiar las condiciones when (desempleo, environment, security).
```

Esto reduce el “mala suerte pura” sin hacer el juego más fácil en términos de umbrales.

---

## 6. Checklist de verificación para Claude

```bash
npm test
npx tsc --noEmit
npm run build
```

En runtime:

```js
const S = () => window.__game.getState();
S().newGame();
S().start('Argentina');
// Completar onboarding Enrique (o forzar moral.onboarded = true en test)
// Subir desempleo artificialmente si hace falta
// Avanzar turnos y confirmar que minority events pueden entrar en eligibleEvents
```

Test sugerido:

```ts
// Con moral.onboarded = true y unemployment = 14
// eligibleEvents debe incluir al menos un evento con characterId 'gustavo_comun'
```

---

## 7. Qué NO hacer

- **No bajar** los umbrales de desempleo de Gustavo.
- **No bajar** los umbrales de `environmentIndex` / `securityIndex` de Amalia / Jhon.
- **No** hacer que las cartas salgan sin `onboarded`.
- **No** duplicar los eventos fuera del pool nacional sin motivo.

---

## 8. Resumen ejecutivo para Claude

1. El contenido está bien.
2. El síntoma (14% desempleo, mes 60, cero cartas) apunta a **`onboarded` o a `moral` ausente en el contexto del sorteo**.
3. Arreglar onboarding + persistencia + pasaje de `moral` a `rollEvents`.
4. Mejorar visibilidad de los 3 líderes.
5. Pity opcional solo post-onboarding, **sin tocar umbrales**.

---

**Fin del documento**

Prioridad: Fix A y Fix B antes de cualquier cambio de balance.

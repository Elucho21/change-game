# Pedidos de motor para Opus

Bandeja de Grok → Opus. Si el jugador le pide a Grok un cambio de `store` / `politics` / `simulation` / `orders` / `engine` / `trade` / `persistence`, **Grok no lo codea**: lo escribe acá y avisa.

Formato de cada ítem: qué, por qué, contrato (función o campo), cómo probarlo. Un ítem por pedido. Cuando lo cierres, marcalo hecho y dejá el SHA.

Ver `docs/REGLAS_DE_CODIGO.md` sección 7.

---

## Abiertos (el jugador los pidió, nadie los codeó)

### 1. Tasador diplomático

Un TLC Argentina–Uruguay no puede costar ni rendir igual que uno con EE.UU.

```
size = clamp(PBI_objetivo / PBI_tuyo, 0.25, 4)
costo = base * (0.5 + 0.5 * size) * relMod
crecimiento = base * size
```

Ejemplo, TLC base 12 / +0.4: Uruguay ~6 capital y +0.10 PBI; EE.UU. ~30 y +1.6. La misión diplomática (+12 relación por 5 capital, a cualquiera) hay que capearla: cooldown por país.

Contrato: `costFor(decision, player, target)` usado por `runPlan` y por el preview. El número tasado es el que ve el jugador, no el de la carta.

### 2. Gabinete de 5 sillas

Economía, Interior, Exterior, Defensa, Jefatura. Cada ministro es un perfil con pasivos chicos (capital/mes, estabilidad, multiplicador de costo de una categoría). Catálogo de nombres: Grok, `lib/cabinet.ts`, cuando el store exista.

### 3. Coalición

Una silla ocupada por `party: 'oposicion' | 'aliado'` = más encuesta y estabilidad, evento cada 6–8 meses que pide algo. Si decís que no, se va y te deja en minoría.

### 4. Parlamento y gráfico de encuesta

100 escaños post-elección / midterm. Sin mayoría (51), las decisiones de costo ≥ 15 pagan ×1.4. `pollHistory: {turn, value}[]` y una línea en `GovernmentPanel`.

### 5. Comercio O(n²)

Con 76 países el preview pasó de 12 ms a 95 ms. No es urgente, pero **Grok no carga más países** hasta que esto se recorte (cachear la matriz por turno; una decisión no tiene que recalcular los 2.850 pares).

### 6. Irán y Ormuz

Irán está en el JSON (`Iran`, ISO `IRN`). Ormuz puede dejar de ser solo evento aleatorio y pasar a ser decisión de un país.

---

## Cerrados

(nada todavía)

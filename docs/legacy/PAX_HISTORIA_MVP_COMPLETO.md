# Pax Historia Style – MVP Completo  
**Documento técnico para continuar desarrollo (Claude Opus / Grok / equipo)**

---

## 1. Visión del Proyecto

Juego de **geopolítica y gran estrategia** para un solo jugador, inspirado en **Pax Historia**.

- El jugador elige un país y toma decisiones económicas, militares, diplomáticas y políticas.
- La IA controla el resto del mundo de forma **realista** (cada país defiende sus intereses nacionales de manera racional).
- El juego **no debe ser lineal**: eventos mundiales, nacionales y personales generan incertidumbre.
- Visualización principal: **globo 3D interactivo** con:
  - Países seleccionables
  - Arcos diplomáticos animados
  - Flujos comerciales
  - Rutas marítimas reales

**Uso**: personal / interno. Un solo jugador.

---

## 2. Países del MVP

### Sudamérica (completa)
Argentina, Bolivia, Brasil, Chile, Colombia, Ecuador, Guyana, Paraguay, Perú, Surinam, Uruguay, Venezuela

### Potencias y países clave
- Norteamérica: Estados Unidos, Canadá, México  
- Europa: Reino Unido, Francia, Alemania, España  
- Asia: China, Japón, Corea del Sur, Corea del Norte, Rusia  

**Nota**: Todos los países tienen datos completos desde el inicio (aunque no todos sean 100% jugables al principio).

---

## 3. Datos que tiene cada país (`countries_mvp.json`)

```json
{
  "economy": {
    "gdp_trillion_usd": 0,
    "gdp_growth": 0,
    "unemployment": 0,
    "inflation": 0,
    "gold_reserves_tonnes": 0,
    "debt_to_gdp": 0,
    "fiscal_balance": 0,
    "tax_iva": 0,
    "tax_corporate": 0,
    "tax_income_avg": 0
  },
  "population": {
    "total_millions": 0,
    "male_pct": 0,
    "female_pct": 0,
    "unemployed_millions": 0,
    "minorities": {},
    "happiness": 0,
    "stability": 0
  },
  "military": {
    "active_soldiers": 0,
    "reserves": 0,
    "aircraft": 0,
    "submarines": 0,
    "nuclear_warheads": 0,
    "tanks": 0,
    "naval_ships": 0,
    "military_budget_bn": 0
  },
  "sectors": {
    "industry": 0,
    "agriculture": 0,
    "services": 0,
    "commerce": 0,
    "tourism": 0
  },
  "relations": {
    "USA": "amistoso | neutral | tenso | hostil",
    "...": "..."
  },
  "traits": {
    "ideology": "liberal_democracy | authoritarian_state_capitalism | ...",
    "aggression": 0.0-1.0,
    "risk_tolerance": 0.0-1.0,
    "nuclear_doctrine": "none | no_first_use | first_use_possible | escalate_to_deescalate",
    "priorities": ["lista de prioridades estratégicas"]
  }
}
```

Los números mantienen **proporcionalidad lógica** (no exactitud al 100%).

---

## 4. Arquitectura del Sistema

```
1. Base de datos          → countries_mvp.json
2. Motor del juego        → game_engine.py (Python)
3. Capa de IA             → Prompt maestro (simulación realista)
4. Interfaz visual        → Globo 3D (react-globe.gl)
5. (Opcional) Despliegue  → Vercel
```

### Flujo de una partida
1. Jugador elige país
2. Toma decisiones (`decide bajar IVA`, `decide aumentar gasto militar`, etc.)
3. Motor calcula impactos básicos + genera prompt para la IA
4. IA responde con reacciones de otros países + narrativa
5. Se avanzan turnos (mensuales)
6. Eventos mundiales / nacionales / personales se disparan
7. El globo se actualiza visualmente (colores, arcos, rutas)

---

## 5. Sistema de Eventos (anti-linealidad)

Tres tipos de eventos:

| Tipo       | Ejemplos                                      | Frecuencia aproximada |
|------------|-----------------------------------------------|-----------------------|
| Mundial    | Crisis del petróleo, pandemia, cumbre BRICS, avance tecnológico, desastre climático | ~25% por turno |
| Nacional   | Huelgas, escándalo de corrupción, buena cosecha, incidente fronterizo, oleada de inversión | ~35% por turno |
| Personal   | Problema de salud del líder, crisis de gabinete, subida de popularidad | ~15% por turno |

Los eventos tienen duración y generan `deltas` (felicidad, estabilidad, crecimiento, etc.).

---

## 6. Reglas de comportamiento de la IA (críticas)

1. Cada país defiende **sus propios intereses nacionales** de forma racional.
2. **Nunca** reacciones estúpidas o suicidas (salvo Corea del Norte o regímenes extremadamente ideológicos en situaciones existenciales).
3. Las reacciones deben ser **variadas** (fuertes, de espera, de bajo perfil, de oportunidad).
4. Evitar monotonía y repetición.
5. El juego **no debe ser fácil**. Debe haber fricción, trade-offs y consecuencias de segundo orden.
6. Considerar siempre: relación actual, prioridades, agresión y tolerancia al riesgo del país que reacciona.

---

## 7. Motor del Juego (Python) – `game_engine.py`

Responsabilidades:
- Manejo de turnos (mes a mes)
- Procesamiento de decisiones del jugador (impuestos, gasto militar, inversión, sanciones…)
- Cálculo de impactos básicos (deltas)
- Generación de eventos
- Drift económico natural
- Construcción de prompts compactos para la capa de IA

Comandos principales del jugador:
- `status` / `estado`
- `economy` / `economía`
- `military` / `militar`
- `relations` / `relaciones`
- `decide [texto libre]`
- `diplomacy [país] [acción]`
- `next` / `siguiente`
- `events`
- `help`

---

## 8. Capa Visual – Globo 3D

**Librería principal**: `react-globe.gl`

### Capas visuales implementadas

| Capa              | Tecnología          | Propósito                              |
|-------------------|---------------------|----------------------------------------|
| Países            | `polygonsData`      | Selección + color por relación         |
| Arcos Diplomáticos| `arcsData`          | Tensiones y alianzas                   |
| Flujos Comerciales| `arcsData`          | Volumen de comercio (grosor + color)   |
| Rutas Marítimas   | `pathsData`         | Rutas reales por el mar                |

### Lógica de colores

- **Diplomáticos**:
  - Amistoso → verde
  - Tenso → amarillo/naranja
  - Hostil → rojo

- **Comercio**:
  - Exportación → verde
  - Importación → naranja/rojo
  - Grosor y altura según volumen

- **Rutas marítimas**:
  - Color por ruta
  - Grosor según importancia/volumen
  - Animación de trazo (`pathDashAnimateTime`)

### Coordenadas de capitales (ejemplo)

```js
const CAPITALS = {
  USA: { lat: 38.9072, lng: -77.0369 },
  China: { lat: 39.9042, lng: 116.4074 },
  Russia: { lat: 55.7558, lng: 37.6173 },
  Brazil: { lat: -15.8267, lng: -47.9218 },
  // ... resto
};
```

### Rutas marítimas principales incluidas
- Asia → Europa (Malacca + Suez)
- Asia → US West Coast
- Asia → US East (vía Panamá)
- Sudamérica → China
- Golfo Pérsico → Asia (Ormuz)

---

## 9. Código del Componente Visual Completo

```jsx
// components/GeopoliticalGlobe.jsx
import { useState, useMemo, useRef } from 'react';
import Globe from 'react-globe.gl';

const CAPITALS = {
  USA: { lat: 38.9072, lng: -77.0369, name: 'Washington' },
  China: { lat: 39.9042, lng: 116.4074, name: 'Beijing' },
  Russia: { lat: 55.7558, lng: 37.6173, name: 'Moscow' },
  Japan: { lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
  SouthKorea: { lat: 37.5665, lng: 126.9780, name: 'Seoul' },
  UK: { lat: 51.5074, lng: -0.1278, name: 'London' },
  France: { lat: 48.8566, lng: 2.3522, name: 'Paris' },
  Germany: { lat: 52.5200, lng: 13.4050, name: 'Berlin' },
  Brazil: { lat: -15.8267, lng: -47.9218, name: 'Brasília' },
  Argentina: { lat: -34.6037, lng: -58.3816, name: 'Buenos Aires' },
  Chile: { lat: -33.4489, lng: -70.6693, name: 'Santiago' },
  Mexico: { lat: 19.4326, lng: -99.1332, name: 'Mexico City' },
  Singapore: { lat: 1.3521, lng: 103.8198, name: 'Singapore' },
};

const MARITIME_ROUTES = [
  {
    id: 'asia-europe',
    name: 'Asia → Europa (Malacca + Suez)',
    coords: [
      [31.23, 121.47], [22.32, 114.17], [1.29, 103.85],
      [5.60, 100.00], [12.65, 43.30], [29.95, 32.55],
      [35.90, 14.50], [51.92, 4.48]
    ],
    volume: 480,
    color: '#00e5ff',
  },
  {
    id: 'asia-uswest',
    name: 'Asia → US West Coast',
    coords: [
      [31.23, 121.47], [35.40, 139.70], [34.05, -118.25]
    ],
    volume: 390,
    color: '#00ff9d',
  },
  {
    id: 'asia-useast',
    name: 'Asia → US East (Panamá)',
    coords: [
      [22.32, 114.17], [8.98, -79.52], [25.76, -80.19], [40.71, -74.01]
    ],
    volume: 220,
    color: '#ffaa00',
  },
  {
    id: 'southamerica-china',
    name: 'Sudamérica → China',
    coords: [
      [-23.55, -46.63], [-34.90, -56.16], [-33.03, -71.63],
      [1.29, 103.85], [31.23, 121.47]
    ],
    volume: 180,
    color: '#a78bfa',
  },
  {
    id: 'gulf-asia',
    name: 'Golfo → Asia (Ormuz)',
    coords: [
      [26.57, 50.55], [26.57, 56.25], [25.20, 55.27],
      [1.29, 103.85], [22.32, 114.17]
    ],
    volume: 350,
    color: '#f97316',
  },
];

export default function GeopoliticalGlobe({
  diplomaticRelations = [],
  tradeFlows = [],
  showMaritime = true,
  showTrade = true,
  showDiplomatic = true,
}) {
  const globeRef = useRef();

  // Arcos Diplomáticos
  const diplomaticArcs = useMemo(() => {
    if (!showDiplomatic) return [];
    return diplomaticRelations.map((rel, i) => {
      const from = CAPITALS[rel.from];
      const to = CAPITALS[rel.to];
      if (!from || !to) return null;

      const intensity = rel.intensity || 0.5;
      let color;
      if (rel.type === 'hostil') color = ['#ff2222', '#ff6666'];
      else if (rel.type === 'amistoso') color = ['#22ff88', '#88ffaa'];
      else color = ['#fbbf24', '#fde68a'];

      return {
        startLat: from.lat,
        startLng: from.lng,
        endLat: to.lat,
        endLng: to.lng,
        color,
        stroke: 0.4 + intensity * 0.9,
        altitude: 0.18 + intensity * 0.22,
        dashLength: 0.4,
        dashGap: 0.2,
        order: i,
      };
    }).filter(Boolean);
  }, [diplomaticRelations, showDiplomatic]);

  // Flujos Comerciales
  const tradeArcs = useMemo(() => {
    if (!showTrade) return [];
    return tradeFlows.map((flow) => {
      const from = CAPITALS[flow.from];
      const to = CAPITALS[flow.to];
      if (!from || !to) return null;

      const intensity = Math.min((flow.volume || 100) / 400, 1);

      return {
        startLat: from.lat,
        startLng: from.lng,
        endLat: to.lat,
        endLng: to.lng,
        color: flow.type === 'export'
          ? [`rgba(0, 220, 120, ${0.45 + intensity * 0.5})`, 'rgba(0, 255, 160, 0.95)']
          : [`rgba(255, 110, 50, ${0.45 + intensity * 0.5})`, 'rgba(255, 160, 80, 0.95)'],
        stroke: 0.35 + intensity * 1.3,
        altitude: 0.13 + intensity * 0.22,
        dashLength: 0.32,
        dashGap: 0.16,
        dashAnimateTime: 2600 - intensity * 1100,
      };
    }).filter(Boolean);
  }, [tradeFlows, showTrade]);

  // Rutas Marítimas
  const maritimePaths = useMemo(() => {
    if (!showMaritime) return [];
    return MARITIME_ROUTES.map((route) => {
      const intensity = Math.min(route.volume / 500, 1);
      return {
        coords: route.coords,
        name: route.name,
        color: route.color,
        stroke: 0.5 + intensity * 1.4,
        dashLength: 0.28,
        dashGap: 0.14,
        dashAnimateTime: 2400 - intensity * 900,
      };
    });
  }, [showMaritime]);

  const allArcs = useMemo(() => [...diplomaticArcs, ...tradeArcs], [diplomaticArcs, tradeArcs]);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000' }}>
      <Globe
        ref={globeRef}
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
        atmosphereColor="#0ea5e9"
        atmosphereAltitude={0.18}

        arcsData={allArcs}
        arcColor="color"
        arcStroke="stroke"
        arcAltitude="altitude"
        arcDashLength="dashLength"
        arcDashGap="dashGap"
        arcDashAnimateTime={d => d.dashAnimateTime || 1800}
        arcDashInitialGap={() => Math.random()}
        arcsTransitionDuration={900}

        pathsData={maritimePaths}
        pathPoints="coords"
        pathPointLat={p => p[0]}
        pathPointLng={p => p[1]}
        pathColor="color"
        pathStroke="stroke"
        pathDashLength="dashLength"
        pathDashGap="dashGap"
        pathDashAnimateTime="dashAnimateTime"
        pathDashInitialGap={() => Math.random()}
        pathAltitude={0.012}
        pathsTransitionDuration={1000}

        enablePointerInteraction={true}
      />
    </div>
  );
}
```

### Ejemplo de uso del componente

```jsx
const diplomaticRelations = [
  { from: 'USA', to: 'China', type: 'tenso', intensity: 0.7 },
  { from: 'USA', to: 'UK', type: 'amistoso', intensity: 0.9 },
  { from: 'China', to: 'Russia', type: 'amistoso', intensity: 0.8 },
  { from: 'USA', to: 'Russia', type: 'hostil', intensity: 0.85 },
];

const tradeFlows = [
  { from: 'China', to: 'USA', volume: 580, type: 'export' },
  { from: 'China', to: 'Brazil', volume: 160, type: 'export' },
  { from: 'USA', to: 'Mexico', volume: 340, type: 'export' },
  { from: 'Brazil', to: 'China', volume: 120, type: 'export' },
];

<GeopoliticalGlobe
  diplomaticRelations={diplomaticRelations}
  tradeFlows={tradeFlows}
  showMaritime={true}
  showTrade={true}
  showDiplomatic={true}
/>
```

---

## 10. Prompt Maestro para la IA (capa de simulación)

Este es el prompt que se le debe pasar a la IA (Grok / Claude / etc.) para que actúe como motor de simulación realista:

```text
Eres el motor de simulación de un juego de geopolítica y gran estrategia para un solo jugador, inspirado en Pax Historia.

El jugador controla un país y toma decisiones. Tú controlas el resto del mundo.

REGLAS OBLIGATORIAS:
1. Cada país defiende sus intereses nacionales de forma racional.
2. Nunca hagas reacciones estúpidas o suicidas (salvo Corea del Norte o regímenes muy ideológicos en situaciones extremas).
3. Las reacciones deben ser variadas y no repetitivas.
4. El juego no debe ser fácil ni predecible. Genera fricción realista.
5. Considera siempre: relación actual, prioridades estratégicas, nivel de agresión y tolerancia al riesgo.

Responde preferentemente en JSON compacto:

{
  "internal_impact": {
    "summary": "...",
    "deltas": {"happiness": 0, "stability": 0, "fiscal_balance": 0, ...},
    "warnings": []
  },
  "reactions": [
    {
      "country": "...",
      "action": "...",
      "relation_change": "mejora | empeora | sin_cambio",
      "intensity": 1-5,
      "statement": "frase pública opcional"
    }
  ],
  "events_triggered": [],
  "narrative": "2-4 oraciones"
}
```

---

## 11. Archivos ya generados

| Archivo                  | Descripción                                      |
|--------------------------|--------------------------------------------------|
| `countries_mvp.json`     | Base de datos completa de 24 países              |
| `game_engine.py`         | Motor de turnos, decisiones, eventos y prompts   |
| `PROMPT_MAESTRO.md`      | Prompt completo para la capa de IA               |
| `GeopoliticalGlobe.jsx`  | Componente visual del globo (este documento)     |
| `README.md`              | Resumen del proyecto                             |

---

## 12. Próximos pasos recomendados

1. Integrar el globo con el estado del juego (selección de país → panel lateral con datos + decisiones).
2. Al hacer click en un país, mostrar panel con:
   - Datos económicos / militares
   - Botones de decisión
   - Preview de posibles impactos
3. Sistema de guardado de partida.
4. Añadir más países (India, Turquía, Arabia Saudita, Indonesia, etc.).
5. Organizaciones internacionales (OTAN, BRICS, Mercosur…).
6. Resolución de conflictos militares limitados.

---

## 13. Objetivo de este documento

Este archivo resume **toda la lógica, datos, reglas y código visual** desarrollados hasta ahora para el MVP del juego de geopolítica estilo Pax Historia.

Está pensado para ser entregado a **Claude Opus** (o cualquier otro modelo) junto con el repositorio de GitHub, de modo que pueda continuar el desarrollo de forma coherente.

---

**Fin del documento.**
```

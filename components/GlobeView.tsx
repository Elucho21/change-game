'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ARC_COLORS, ISO_TO_CODE, useGame } from '@/lib/store';
import { computeArcs, getRelation, relLabel, REL_COLORS } from '@/lib/engine';
import { MARITIME_ROUTES, CHOKEPOINTS, routeDisrupted, activeDisruptions } from '@/lib/routes';
import {
  MAP_POINTS, POINT_COLORS, DEFAULT_POINT_LAYERS, filterMapPoints, pointRadius, pointTooltipHtml,
  type PointLayer
} from '@/lib/points';
import { visibleFlows, type TradeContext } from '@/lib/trade';
import type { Country } from '@/lib/types';

// react-globe.gl toca WebGL: solo puede cargarse en el cliente.
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false }) as unknown as React.ComponentType<
  Record<string, unknown>
>;

type Feature = { properties: Record<string, string | number>; geometry: unknown };

/** Lo unico que usamos de la instancia imperativa de react-globe.gl. */
type GlobeInstance = {
  pointOfView: (v: Record<string, number>, ms?: number) => void;
  scene: () => unknown;
};

const MODES: { id: 'relaciones' | 'bloques' | 'estabilidad' | 'economia'; label: string }[] = [
  { id: 'relaciones', label: '🤝 Relaciones' },
  { id: 'bloques', label: '🧩 Bloques' },
  { id: 'estabilidad', label: '⚖️ Estabilidad' },
  { id: 'economia', label: '💰 Economia' }
];

const heat = (v: number) => {
  // 0 = rojo, 100 = verde
  const t = Math.max(0, Math.min(100, v)) / 100;
  const r = Math.round(229 - t * 150);
  const g = Math.round(72 + t * 130);
  const b = Math.round(77 + t * 60);
  return `rgb(${r},${g},${b})`;
};

type GlobePoint = {
  lat: number;
  lng: number;
  color: string;
  radius: number;
  altitude: number;
  label: string;
};

/** Lee una capa de puntos del store si Claude ya la agrego; si no, usa el fallback local. */
function pointLayerOn(
  layers: object,
  key: PointLayer,
  fallback: boolean
): boolean {
  const v = (layers as Record<string, unknown>)[key];
  return typeof v === 'boolean' ? v : fallback;
}

export default function GlobeView() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [features, setFeatures] = useState<Feature[]>([]);
  const [hover, setHover] = useState<Feature | null>(null);
  const [localPointLayers, setLocalPointLayers] = useState(DEFAULT_POINT_LAYERS);

  const {
    countries, relations, blocs, playerCode, selected, mapMode, sanctions, pending,
    layers, disruptions, turn
  } = useGame();
  const select = useGame((s) => s.select);
  const toggleLayer = useGame((s) => s.toggleLayer);
  const setMapMode = useGame((s) => s.setMapMode);

  const pointLayers: Record<PointLayer, boolean> = {
    capitales: pointLayerOn(layers, 'capitales', localPointLayers.capitales),
    puertos: pointLayerOn(layers, 'puertos', localPointLayers.puertos),
    aeropuertos: pointLayerOn(layers, 'aeropuertos', localPointLayers.aeropuertos)
  };

  const togglePointLayer = (key: PointLayer) => {
    if (typeof (layers as unknown as Record<string, unknown>)[key] === 'boolean') {
      toggleLayer(key as 'diplomacia');
    } else {
      setLocalPointLayers((s) => ({ ...s, [key]: !s[key] }));
    }
  };

  useEffect(() => {
    fetch('/countries.geojson')
      .then((r) => r.json())
      .then((g: { features: Feature[] }) => setFeatures(g.features))
      .catch(() => setFeatures([]));
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // al elegir pais, la camara viaja hasta el
  useEffect(() => {
    const c = selected ? countries[selected] : null;
    if (c && globeRef.current) {
      globeRef.current.pointOfView({ lat: c.lat, lng: c.lng, altitude: 2 }, 900);
    }
  }, [selected, countries]);

  const codeOf = (f: Feature) => ISO_TO_CODE[String(f.properties.ADM0_A3)];

  const blocColorOf = (code: string) => {
    const b = blocs.find((x) => x.members.includes(code) && x.type !== 'politica');
    return b?.color ?? '#2b3550';
  };

  const capColor = (f: Feature) => {
    const code = codeOf(f);
    if (!code) return 'rgba(38, 48, 72, 0.55)';
    if (code === playerCode) return '#f5d76e';
    const c: Country = countries[code];
    switch (mapMode) {
      case 'bloques':
        return blocColorOf(code);
      case 'estabilidad':
        return heat(c.population.stability);
      case 'economia':
        return heat(50 + c.economy.gdp_growth * 8 - c.economy.inflation * 0.3);
      default:
        return REL_COLORS[relLabel(getRelation(relations, playerCode, code))];
    }
  };

  const label = (f: Feature) => {
    const code = codeOf(f);
    if (!code) return `<div style="padding:4px 8px;background:#0e1524;border:1px solid #1e293f;border-radius:8px;font-size:12px">${f.properties.ADMIN}</div>`;
    const c = countries[code];
    const rel = getRelation(relations, playerCode, code);
    const mine = blocs.filter((b) => b.members.includes(code)).map((b) => b.short).join(', ') || 'sin bloques';
    return `<div style="padding:8px 10px;background:#0e1524ee;border:1px solid #1e293f;border-radius:10px;font-size:12px;color:#e6ecf7;min-width:190px">
      <div style="font-weight:700;margin-bottom:4px">${c.flag} ${c.name}</div>
      <div style="color:#8c99b3">PBI ${c.economy.gdp_trillion_usd} T USD · inflacion ${c.economy.inflation}%</div>
      <div style="color:#8c99b3">Estabilidad ${c.population.stability} · felicidad ${c.population.happiness}</div>
      <div style="color:#8c99b3">Bloques: ${mine}</div>
      ${code === playerCode ? '<div style="color:#f5d76e;margin-top:3px">Tu pais</div>'
        : `<div style="margin-top:3px">Relacion: <b>${relLabel(rel)}</b> (${rel})</div>`}
    </div>`;
  };

  const tradeCtx: TradeContext = useMemo(
    () => ({ countries, relations, blocs, sanctions, playerCode, disruptions, turn }),
    [countries, relations, blocs, sanctions, playerCode, disruptions, turn]
  );

  const arcs = useMemo(() => {
    const out: Record<string, unknown>[] = [];

    // capa diplomatica: alianzas, aduanas, tension y sanciones
    if (layers.diplomacia) {
      for (const a of computeArcs(countries, relations, blocs, playerCode, sanctions)) {
        out.push({
          ...a,
          startLat: countries[a.from].lat,
          startLng: countries[a.from].lng,
          endLat: countries[a.to].lat,
          endLng: countries[a.to].lng,
          color: ARC_COLORS[a.kind],
          stroke: a.kind === 'tension' ? 0.6 : 0.35 + a.strength * 0.3,
          altitude: 0.16 + a.strength * 0.18,
          dashLength: a.kind === 'tension' || a.kind === 'sancion' ? 0.35 : 0.6,
          dashGap: a.kind === 'tension' || a.kind === 'sancion' ? 0.2 : 0.1,
          dashAnimateTime: a.kind === 'tension' ? 1600 : 4000
        });
      }
    }

    // capa comercial: grosor y color segun volumen, rojo si esta sancionado
    if (layers.comercio) {
      for (const f of visibleFlows(tradeCtx)) {
        if (!countries[f.from] || !countries[f.to]) continue;
        const intensity = Math.min(f.volume / 400, 1);
        out.push({
          id: `flujo-${f.from}-${f.to}`,
          kind: 'flujo',
          label: `Comercio ${countries[f.from].name} - ${countries[f.to].name}: ${f.volume} mil M USD/ano${f.sanctioned ? ' (sancionado)' : ''}`,
          startLat: countries[f.from].lat,
          startLng: countries[f.from].lng,
          endLat: countries[f.to].lat,
          endLng: countries[f.to].lng,
          color: f.sanctioned
            ? ['rgba(229, 72, 77, 0.5)', 'rgba(229, 72, 77, 0.9)']
            : [`rgba(0, 210, 150, ${0.35 + intensity * 0.45})`, 'rgba(0, 255, 190, 0.9)'],
          stroke: 0.3 + intensity * 1.2,
          altitude: 0.1 + intensity * 0.2,
          dashLength: 0.32,
          dashGap: 0.16,
          dashAnimateTime: 2600 - intensity * 1100
        });
      }
    }

    return out;
  }, [countries, relations, blocs, playerCode, sanctions, layers, tradeCtx]);

  // rutas maritimas: se apagan visualmente cuando su chokepoint esta cerrado
  const paths = useMemo(() => {
    if (!layers.rutas) return [];
    return MARITIME_ROUTES.map((r) => {
      const down = routeDisrupted(r, disruptions, turn);
      const intensity = Math.min(r.volume / 500, 1);
      return {
        coords: r.coords,
        name: down ? `${r.name} - INTERRUMPIDA` : r.name,
        color: down ? '#e5484d' : r.color,
        stroke: 0.5 + intensity * 1.4,
        dashLength: down ? 0.1 : 0.28,
        dashGap: down ? 0.3 : 0.14,
        dashAnimateTime: down ? 800 : 2400 - intensity * 900
      };
    });
  }, [layers.rutas, disruptions, turn]);

  // puntos del mapa (capitales / puertos / aeropuertos) + chokepoints si la capa de rutas esta on
  const points = useMemo(() => {
    const out: GlobePoint[] = filterMapPoints(MAP_POINTS, pointLayers).map((p) => ({
      lat: p.lat,
      lng: p.lng,
      color: POINT_COLORS[p.type],
      radius: pointRadius(p),
      altitude: p.type === 'capital' ? 0.022 : 0.016,
      label: pointTooltipHtml(p)
    }));
    if (layers.rutas) {
      const closed = new Set(activeDisruptions(disruptions, turn).map((c) => c.id));
      for (const c of CHOKEPOINTS) {
        out.push({
          lat: c.lat,
          lng: c.lng,
          color: closed.has(c.id) ? '#e5484d' : '#7f8ea8',
          radius: closed.has(c.id) ? 0.55 : 0.32,
          altitude: 0.02,
          label: `<div style="padding:6px 9px;background:#0e1524ee;border:1px solid #1e293f;border-radius:8px;font-size:12px;color:#e6ecf7;max-width:220px"><b>${c.name}</b>${closed.has(c.id) ? ' <span style="color:#e5484d">CERRADO</span>' : ''}<div style="color:#8c99b3;margin-top:3px">${c.description}</div></div>`
        });
      }
    }
    return out;
  }, [pointLayers.capitales, pointLayers.puertos, pointLayers.aeropuertos, layers.rutas, disruptions, turn]);

  // anillos pulsantes donde hay un evento esperando decision
  const rings = useMemo(
    () =>
      pending.map((p) => ({
        lat: countries[p.target]?.lat ?? 0,
        lng: countries[p.target]?.lng ?? 0,
        color: '#f0a742'
      })),
    [pending, countries]
  );

  const setGlobeRef = (instance: GlobeInstance | null) => {
    globeRef.current = instance;
    if (typeof window !== 'undefined') {
      (window as unknown as { __globe: GlobeInstance | null }).__globe = instance;
    }
  };

  return (
    <div className="globe-wrap" ref={wrapRef}>
      <div className="modes">
        {MODES.map((m) => (
          <button key={m.id} className={mapMode === m.id ? 'on' : ''} onClick={() => setMapMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      <aside className="layer-panel" aria-label="Capas del globo">
        <h4>Capas</h4>
        <button className={pointLayers.capitales ? 'on' : ''} onClick={() => togglePointLayer('capitales')}>
          <span><span className="swatch" style={{ background: POINT_COLORS.capital }} /> Capitales</span>
          <b>{pointLayers.capitales ? 'ON' : 'OFF'}</b>
        </button>
        <button className={pointLayers.puertos ? 'on' : ''} onClick={() => togglePointLayer('puertos')}>
          <span><span className="swatch" style={{ background: POINT_COLORS.port }} /> Puertos</span>
          <b>{pointLayers.puertos ? 'ON' : 'OFF'}</b>
        </button>
        <button className={pointLayers.aeropuertos ? 'on' : ''} onClick={() => togglePointLayer('aeropuertos')}>
          <span><span className="swatch" style={{ background: POINT_COLORS.airport }} /> Aeropuertos</span>
          <b>{pointLayers.aeropuertos ? 'ON' : 'OFF'}</b>
        </button>
        <button className={layers.rutas ? 'on' : ''} onClick={() => toggleLayer('rutas')}>
          <span><span className="swatch" style={{ background: '#00e5ff' }} /> Rutas maritimas</span>
          <b>{layers.rutas ? 'ON' : 'OFF'}</b>
        </button>
        <button className={layers.diplomacia ? 'on' : ''} onClick={() => toggleLayer('diplomacia')}>
          <span><span className="swatch" style={{ background: '#4f7cff' }} /> Arcos diplomaticos</span>
          <b>{layers.diplomacia ? 'ON' : 'OFF'}</b>
        </button>
        <button className={layers.comercio ? 'on' : ''} onClick={() => toggleLayer('comercio')}>
          <span><span className="swatch" style={{ background: '#00d296' }} /> Flujos comerciales</span>
          <b>{layers.comercio ? 'ON' : 'OFF'}</b>
        </button>
      </aside>

      <Globe
        ref={setGlobeRef}
        width={size.w}
        height={size.h}
        backgroundColor="#04070f"
        globeImageUrl="/earth-night.jpg"
        bumpImageUrl="/earth-topology.png"
        atmosphereColor="#4f7cff"
        atmosphereAltitude={0.18}
        polygonsData={features}
        polygonAltitude={(f: Feature) => {
          const code = codeOf(f);
          if (f === hover) return 0.09;
          if (code && code === selected) return 0.07;
          if (code === playerCode) return 0.06;
          return code ? 0.02 : 0.008;
        }}
        polygonCapColor={capColor}
        polygonSideColor={() => 'rgba(79, 124, 255, 0.15)'}
        polygonStrokeColor={(f: Feature) => (codeOf(f) ? '#26334f' : 'rgba(38,48,72,0.5)')}
        polygonLabel={label}
        onPolygonHover={(f: Feature | null) => setHover(f)}
        onPolygonClick={(f: Feature) => {
          const code = codeOf(f);
          if (code) select(code);
        }}
        polygonsTransitionDuration={280}
        arcsData={arcs}
        arcColor="color"
        arcLabel="label"
        arcStroke="stroke"
        arcAltitude="altitude"
        arcDashLength="dashLength"
        arcDashGap="dashGap"
        arcDashAnimateTime="dashAnimateTime"
        arcDashInitialGap={() => Math.random()}
        arcsTransitionDuration={600}
        pathsData={paths}
        pathPoints="coords"
        pathPointLat={(p: number[]) => p[0]}
        pathPointLng={(p: number[]) => p[1]}
        pathColor="color"
        pathStroke="stroke"
        pathLabel="name"
        pathDashLength="dashLength"
        pathDashGap="dashGap"
        pathDashAnimateTime="dashAnimateTime"
        pathDashInitialGap={() => Math.random()}
        pathAltitude={0.012}
        pathsTransitionDuration={800}
        pointsData={points}
        pointColor="color"
        pointRadius="radius"
        pointAltitude="altitude"
        pointLabel="label"
        pointsMerge={false}
        onPointClick={(p: GlobePoint) => {
          globeRef.current?.pointOfView({ lat: p.lat, lng: p.lng, altitude: 1.55 }, 900);
        }}
        ringsData={rings}
        ringColor={(r: { color: string }) => () => r.color}
        ringMaxRadius={5}
        ringPropagationSpeed={2}
        ringRepeatPeriod={900}
      />

      <div className="legend">
        {mapMode === 'relaciones' && (
          <>
            <div><span className="dot" style={{ background: '#f5d76e' }} /> Tu pais</div>
            <div><span className="dot" style={{ background: REL_COLORS.aliado }} /> Aliado / amistoso</div>
            <div><span className="dot" style={{ background: REL_COLORS.neutral }} /> Neutral</div>
            <div><span className="dot" style={{ background: REL_COLORS.tenso }} /> Tenso</div>
            <div><span className="dot" style={{ background: REL_COLORS.hostil }} /> Hostil</div>
          </>
        )}
        {mapMode === 'bloques' && blocs.filter((b) => b.type !== 'politica').map((b) => (
          <div key={b.id}><span className="dot" style={{ background: b.color }} /> {b.short}</div>
        ))}
        {(mapMode === 'estabilidad' || mapMode === 'economia') && (
          <>
            <div><span className="dot" style={{ background: heat(85) }} /> Alto</div>
            <div><span className="dot" style={{ background: heat(50) }} /> Medio</div>
            <div><span className="dot" style={{ background: heat(15) }} /> Bajo</div>
          </>
        )}
        <div style={{ height: 6 }} />
        <div><i style={{ background: ARC_COLORS.alianza }} /> Alianza militar</div>
        <div><i style={{ background: ARC_COLORS.comercio }} /> Comercio / aduanas</div>
        <div><i style={{ background: ARC_COLORS.tension }} /> Tension</div>
        <div><i style={{ background: ARC_COLORS.sancion }} /> Sanciones</div>
        <div><i style={{ background: ARC_COLORS.flujo }} /> Flujo comercial</div>
        <div><i style={{ background: '#00e5ff' }} /> Ruta maritima</div>
        <div><span className="dot" style={{ background: POINT_COLORS.capital }} /> Capital</div>
        <div><span className="dot" style={{ background: POINT_COLORS.port }} /> Puerto</div>
        <div><span className="dot" style={{ background: POINT_COLORS.airport }} /> Aeropuerto</div>
        {activeDisruptions(disruptions, turn).length > 0 && (
          <div className="bad">
            Cerrado: {activeDisruptions(disruptions, turn).map((c) => c.name).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

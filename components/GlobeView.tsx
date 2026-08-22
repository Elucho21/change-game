'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ARC_COLORS, ISO_TO_CODE, useGame } from '@/lib/store';
import { computeArcs, getRelation, relLabel, REL_COLORS } from '@/lib/engine';
import type { Country } from '@/lib/types';

// react-globe.gl toca WebGL: solo puede cargarse en el cliente.
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false }) as unknown as React.ComponentType<
  Record<string, unknown>
>;

type Feature = { properties: Record<string, string | number>; geometry: unknown };

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

export default function GlobeView() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<{ pointOfView: (v: Record<string, number>, ms?: number) => void } | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [features, setFeatures] = useState<Feature[]>([]);
  const [hover, setHover] = useState<Feature | null>(null);

  const { countries, relations, blocs, playerCode, selected, mapMode, sanctions, pending } = useGame();
  const select = useGame((s) => s.select);

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

  const arcs = useMemo(() => {
    const list = computeArcs(countries, relations, blocs, playerCode, sanctions);
    return list.map((a) => ({
      ...a,
      startLat: countries[a.from].lat,
      startLng: countries[a.from].lng,
      endLat: countries[a.to].lat,
      endLng: countries[a.to].lng,
      color: ARC_COLORS[a.kind]
    }));
  }, [countries, relations, blocs, playerCode, sanctions]);

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

  const setMapMode = useGame((s) => s.setMapMode);

  // debug: window.__globe da acceso a la instancia three.js del globo
  useEffect(() => {
    (window as unknown as { __globe: unknown }).__globe = globeRef.current;
  }, [features.length, arcs.length]);

  return (
    <div className="globe-wrap" ref={wrapRef}>
      <div className="modes">
        {MODES.map((m) => (
          <button key={m.id} className={mapMode === m.id ? 'on' : ''} onClick={() => setMapMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      <Globe
        ref={globeRef}
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
        arcColor={(a: { color: string }) => a.color}
        arcLabel={(a: { label: string }) => a.label}
        arcStroke={(a: { kind: string; strength: number }) => (a.kind === 'tension' ? 0.6 : 0.35 + a.strength * 0.3)}
        arcAltitudeAutoScale={0.45}
        arcDashLength={(a: { kind: string }) => (a.kind === 'tension' || a.kind === 'sancion' ? 0.35 : 0.6)}
        arcDashGap={(a: { kind: string }) => (a.kind === 'tension' || a.kind === 'sancion' ? 0.2 : 0.1)}
        arcDashAnimateTime={(a: { kind: string }) => (a.kind === 'tension' ? 1600 : 4000)}
        arcsTransitionDuration={400}
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
      </div>
    </div>
  );
}

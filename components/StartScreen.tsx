'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ALL_COUNTRIES, useGame } from '@/lib/store';
import { DIFFICULTY_PRESETS, type Difficulty } from '@/lib/politics';
import { exportSave, importSave } from '@/lib/persistence';
import type { Country } from '@/lib/types';

const DIFFICULTIES: Difficulty[] = ['facil', 'normal', 'dificil'];

const PLAYABLE = Object.values(ALL_COUNTRIES).filter((c) => c.playable);

const PLAYABLE_BY_REGION = PLAYABLE.reduce<Record<string, Country[]>>((acc, c) => {
  (acc[c.region] ??= []).push(c);
  return acc;
}, {});

/** Paises destacados para el carrusel del hero (si existen en el set). */
const FEATURED_CODES = [
  'Argentina',
  'USA',
  'Brazil',
  'China',
  'Germany',
  'Japan',
  'Mexico',
  'India',
  'South Africa',
  'France'
];

export default function StartScreen() {
  const start = useGame((s) => s.start);
  const savedGame = useGame((s) => s.savedGame);
  const loadSaved = useGame((s) => s.loadSaved);
  const newGame = useGame((s) => s.newGame);
  const refreshSavedSummary = useGame((s) => s.refreshSavedSummary);
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [importMsg, setImportMsg] = useState('');
  const [spotlight, setSpotlight] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const featured = useMemo(
    () =>
      FEATURED_CODES.map((code) => ALL_COUNTRIES[code]).filter(
        (c): c is Country => !!c && c.playable
      ),
    []
  );

  useEffect(() => {
    if (featured.length < 2) return;
    const id = window.setInterval(() => {
      setSpotlight((i) => (i + 1) % featured.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [featured.length]);

  const handleImport = async (file: File) => {
    const res = await importSave(file);
    if (res.ok) {
      refreshSavedSummary();
      setImportMsg('Partida importada. Apreta "Continuar partida" para seguir.');
    } else {
      setImportMsg(`No se pudo importar: ${res.error}`);
    }
  };

  const byRegion = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PLAYABLE_BY_REGION;
    const filtered: typeof PLAYABLE_BY_REGION = {};
    for (const [region, countries] of Object.entries(PLAYABLE_BY_REGION)) {
      const matches = countries.filter((c) => c.name.toLowerCase().includes(q));
      if (matches.length) filtered[region] = matches;
    }
    return filtered;
  }, [query]);

  const star = featured[spotlight];

  const scrollToCountries = () => {
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="start">
      <div className="start-bg" aria-hidden>
        <div className="start-orb start-orb-a" />
        <div className="start-orb start-orb-b" />
        <div className="start-grid" />
        <div className="start-earth">
          <div className="start-earth-spin" />
          <div className="start-earth-glow" />
        </div>
      </div>

      <header className="start-hero">
        <p className="start-kicker">Simulador geopolitico · mes a mes</p>
        <h1>
          <span className="start-title-mark">Change World</span> Game
        </h1>
        <p className="sub">
          Elegis un pais, gobernas turno a turno y el resto del mundo reacciona. Economia, calle,
          bloques, rutas maritimas y crisis que no controlas.
        </p>

        {star && (
          <button
            type="button"
            className="start-spotlight"
            onClick={() => start(star.code, difficulty)}
            title={`Empezar como ${star.name}`}
          >
            <span className="start-spotlight-flag">{star.flag}</span>
            <span className="start-spotlight-body">
              <span className="start-spotlight-label">Destacado</span>
              <strong>{star.name}</strong>
              <small>
                PBI {star.economy.gdp_trillion_usd} T · inflacion {star.economy.inflation}% ·{' '}
                {star.region}
              </small>
            </span>
            <span className="start-spotlight-cta">Jugar →</span>
          </button>
        )}

        <div className="start-actions">
          <button type="button" className="btn-primary start-cta" onClick={scrollToCountries}>
            Elegir pais
          </button>
          {savedGame && (
            <button type="button" className="btn-primary start-cta-ghost" onClick={() => loadSaved()}>
              Continuar {savedGame.flag} turno {savedGame.turn}
            </button>
          )}
        </div>

        <div className="start-actions" style={{ marginTop: -4 }}>
          <Link href="/tutorial"><button type="button" className="start-cta-ghost">📖 Tutorial</button></Link>
          <Link href="/guia"><button type="button" className="start-cta-ghost">📐 Guia y formulas</button></Link>
          <Link href="/actualizaciones"><button type="button" className="start-cta-ghost">🌍 Actualizaciones</button></Link>
        </div>
      </header>

      {savedGame && (
        <div className="card start-saved" style={{ borderColor: 'var(--accent)' }}>
          <h4>
            {savedGame.flag} Partida guardada: {savedGame.playerName}
          </h4>
          <p>
            Turno {savedGame.turn} · {savedGame.date}
          </p>
          <div className="start-row">
            <button className="btn-primary" onClick={() => loadSaved()}>
              Continuar partida
            </button>
            <button
              onClick={() => {
                if (window.confirm('Esto borra la partida guardada para siempre. ¿Empezar de cero?')) {
                  newGame();
                }
              }}
            >
              Descartar y empezar de cero
            </button>
            <button onClick={() => exportSave()} title="Descarga la partida como archivo .json">
              💾 Exportar
            </button>
          </div>
        </div>
      )}

      <div className="start-toolbar">
        <div className="start-row">
          <button onClick={() => fileRef.current?.click()} title="Cargar una partida exportada">
            📂 Importar partida
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
              e.target.value = '';
            }}
          />
          {importMsg && (
            <span className="muted" style={{ fontSize: 11.5 }}>
              {importMsg}
            </span>
          )}
        </div>

        <div className="start-row">
          <span className="muted" style={{ fontSize: 11.5 }}>
            Dificultad:
          </span>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={difficulty === d ? 'btn-primary' : ''}
              onClick={() => setDifficulty(d)}
              title={DIFFICULTY_PRESETS[d].detail}
            >
              {DIFFICULTY_PRESETS[d].label}
            </button>
          ))}
        </div>
      </div>

      <div className="start-list" ref={listRef}>
        <input
          type="text"
          className="start-search"
          placeholder="Buscar pais..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {query.trim() && Object.keys(byRegion).length === 0 && (
          <p className="muted">Ningun pais jugable coincide con &quot;{query}&quot;.</p>
        )}

        {Object.entries(byRegion).map(([region, countries]) => (
          <div key={region} className="start-region">
            <h3>{region}</h3>
            <div className="grid-countries">
              {countries.map((c) => (
                <button
                  key={c.code}
                  className="country-btn"
                  onClick={() => start(c.code, difficulty)}
                >
                  <span className="fl">{c.flag}</span>
                  <span>
                    {c.name}
                    <small>
                      PBI {c.economy.gdp_trillion_usd} T USD · inflacion {c.economy.inflation}%
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

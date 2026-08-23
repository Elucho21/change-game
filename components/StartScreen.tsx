'use client';

import { useMemo, useRef, useState } from 'react';
import { ALL_COUNTRIES, useGame } from '@/lib/store';
import { DIFFICULTY_PRESETS, type Difficulty } from '@/lib/politics';
import { exportSave, importSave } from '@/lib/persistence';
import type { Country } from '@/lib/types';

const DIFFICULTIES: Difficulty[] = ['facil', 'normal', 'dificil'];

// Se calcula una sola vez por sesion: ALL_COUNTRIES no cambia en runtime,
// asi que agrupar por region no depende de ningun estado del componente.
const PLAYABLE_BY_REGION = Object.values(ALL_COUNTRIES)
  .filter((c) => c.playable)
  .reduce<Record<string, Country[]>>((acc, c) => {
    (acc[c.region] ??= []).push(c);
    return acc;
  }, {});

export default function StartScreen() {
  const start = useGame((s) => s.start);
  const savedGame = useGame((s) => s.savedGame);
  const loadSaved = useGame((s) => s.loadSaved);
  const newGame = useGame((s) => s.newGame);
  const refreshSavedSummary = useGame((s) => s.refreshSavedSummary);
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="start">
      <h1>🌍 Change Game</h1>
      <p className="sub">
        Elegis un pais, gobernas mes a mes y el resto del mundo reacciona. Economia, calle, bloques
        comerciales, alianzas militares y eventos que no controlas. Nadie te va a hacer facil el turno que viene.
      </p>

      {savedGame && (
        <div className="card" style={{ maxWidth: 520, width: '100%', borderColor: 'var(--accent)' }}>
          <h4>{savedGame.flag} Partida guardada: {savedGame.playerName}</h4>
          <p>Turno {savedGame.turn} · {savedGame.date}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => loadSaved()}>Continuar partida</button>
            <button
              onClick={() => {
                if (window.confirm('Esto borra la partida guardada para siempre. ¿Empezar de cero?')) newGame();
              }}
            >
              Descartar y empezar de cero
            </button>
            <button onClick={() => exportSave()} title="Descarga la partida como archivo .json">
              💾 Exportar a archivo
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => fileRef.current?.click()} title="Cargar una partida exportada antes">
          📂 Importar partida desde archivo
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
        {importMsg && <span className="muted" style={{ fontSize: 11.5 }}>{importMsg}</span>}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span className="muted" style={{ fontSize: 11.5 }}>Dificultad:</span>
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

      <input
        type="text"
        placeholder="Buscar pais..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%', maxWidth: 900, padding: '9px 12px', borderRadius: 8,
          border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--text)', fontSize: 13
        }}
      />

      {query.trim() && Object.keys(byRegion).length === 0 && (
        <p className="muted">Ningun pais jugable coincide con &quot;{query}&quot;.</p>
      )}

      {Object.entries(byRegion).map(([region, countries]) => (
        <div key={region} style={{ width: '100%', maxWidth: 900 }}>
          <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)', margin: '10px 0 8px' }}>
            {region}
          </h3>
          <div className="grid-countries">
            {countries.map((c) => (
              <button key={c.code} className="country-btn" onClick={() => start(c.code, difficulty)}>
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
  );
}

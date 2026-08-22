'use client';

import { ALL_COUNTRIES, useGame } from '@/lib/store';

export default function StartScreen() {
  const start = useGame((s) => s.start);
  const list = Object.values(ALL_COUNTRIES).filter((c) => c.playable);

  const byRegion = list.reduce<Record<string, typeof list>>((acc, c) => {
    (acc[c.region] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="start">
      <h1>🌍 Change Game</h1>
      <p className="sub">
        Elegis un pais, gobernas mes a mes y el resto del mundo reacciona. Economia, calle, bloques
        comerciales, alianzas militares y eventos que no controlas. Nadie te va a hacer facil el turno que viene.
      </p>

      {Object.entries(byRegion).map(([region, countries]) => (
        <div key={region} style={{ width: '100%', maxWidth: 900 }}>
          <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)', margin: '10px 0 8px' }}>
            {region}
          </h3>
          <div className="grid-countries">
            {countries.map((c) => (
              <button key={c.code} className="country-btn" onClick={() => start(c.code)}>
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

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Actualizaciones — Change World Game',
  description: 'Novedades de Change World Game, version por version.'
};

export default function ActualizacionesPage() {
  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-nav">
          <Link href="/"><button>← Volver</button></Link>
          <Link href="/tutorial"><button>Tutorial</button></Link>
          <Link href="/guia"><button>Guia y formulas</button></Link>
        </div>

        <p className="page-kicker">Novedades</p>
        <h1>Actualizaciones</h1>
        <p className="sub">
          Que cambio y por que te importa. Version mas nueva arriba.
        </p>

        <div className="card">
          <h2>🌍 v1.0 — Change World Game</h2>
          <p className="muted" style={{ fontSize: 12, marginTop: -4 }}>El juego se renombra: de aca en mas, Change World Game.</p>

          <h3>👴 Sistema previsional</h3>
          <p>
            Nueva pestana <b>Previsional</b> en el juego. Tu pais tiene edad de jubilacion, aportes de trabajador
            y empleador, tasa de reemplazo, cobertura y evasion — y un resultado previsional real (superavit o
            deficit) que le pega al balance fiscal. En <b>Decisiones → Previsional</b> hay 8 reformas nuevas:
            subir la edad de jubilacion, igualar edad entre generos, subir aportes, bajar la tasa de reemplazo,
            mejorar la fiscalizacion, eliminar privilegios, y la unica reforma que suma Capital Politico neto —
            un plan de formalizacion y cobertura.
          </p>

          <h3>💼 Empleo formal/informal y salario real</h3>
          <p>
            El desempleo dejo de ser el unico numero: ahora se sigue cuanto de tu economia es formal vs informal,
            y un indice de salario real que sube con el crecimiento (y con la deflacion, si mantenes los sueldos
            nominales) y baja fuerte si subis aportes o la inflacion no se indexa. Un ministro de Economia con
            buen perfil tecnico atenua el dano de las reformas mas duras.
          </p>

          <h3>❄️ Deflacion, reservas y superavit pasivo</h3>
          <p>
            Si tu inflacion se va negativa (deflacion), las reservas de oro empiezan a crecer solas — apreciacion
            real, menos importaciones, capitales que entran buscando refugio. Y si encima tenes superavit fiscal,
            ese superavit no se te licua: se preserva y se fortalece en terminos reales.
          </p>

          <h3>📈 Recaudacion dinamica</h3>
          <p>
            El tamano de tu economia ahora le pega solo a la recaudacion: crecer deja mas caja de la que entraba
            antes (a igual carga tributaria), y una recesion la golpea mas que proporcional. Es un efecto lento y
            de fondo, pero de ahora en mas bajar impuestos con la macro ordenada tiene un argumento real detras.
          </p>

          <h3>⚖️ Gasto rigido: militar vs previsional</h3>
          <p>
            En la pestana Previsional hay un semaforo nuevo: presupuesto militar + deficit previsional, contra el
            techo de 15-18% del PBI que el diseño del juego considera sostenible. Pasarte de largo sin superavit
            en otro lado es la antesala de mas deficit, mas inflacion y mas presion sobre el tipo de cambio.
          </p>

          <h3>📖 Paginas nuevas</h3>
          <p>
            Este <Link href="/tutorial">Tutorial</Link> y esta <Link href="/guia">Guia de formulas y metricas</Link> —
            para no tener que adivinar como funciona cada numero.
          </p>
        </div>

        <p className="muted" style={{ fontSize: 12 }}>
          Version tecnica completa (para quien quiera el detalle de motor): ver <code>docs/CAMBIOS.md</code> en el repositorio.
        </p>
      </div>
    </div>
  );
}

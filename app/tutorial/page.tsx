import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tutorial — Change World Game',
  description: 'Como se juega Change World Game, paso a paso.'
};

const STEPS: { emoji: string; title: string; body: React.ReactNode }[] = [
  {
    emoji: '🌍',
    title: 'Elegi un pais y una dificultad',
    body: (
      <p>
        En la pantalla de inicio elegis cualquier pais jugable y una dificultad (facil / normal / dificil), que
        define cuanto Capital Politico arrancas y cuanto pesa la oposicion desde el primer dia. Ahi arranca tu
        mandato: cuatro anios, mes a mes.
      </p>
    )
  },
  {
    emoji: '🎯',
    title: 'Un turno = un mes: planificar y despues avanzar',
    body: (
      <p>
        Nada de lo que planees se aplica hasta que apretes <b>Avanzar mes</b>, arriba a la derecha. Podes armar
        tu plan del turno — decisiones, cambios de impuestos, movimientos de gabinete — probar, cambiar de idea,
        y recien cuando estas conforme, avanzar. Ese click corre un mes entero: tu economia, el resto del mundo,
        los eventos y las reacciones, todo junto.
      </p>
    )
  },
  {
    emoji: '⚡',
    title: 'Capital Politico: tu moneda para gobernar',
    body: (
      <p>
        Cada decision cuesta Capital Politico. Se regenera solo, un poco cada mes (mas si tu felicidad esta alta,
        el doble durante los primeros 100 dias de mandato). Gobernar con la oposicion fuerte encarece todo; un
        gabinete bien armado lo abarata. Si te quedas sin capital, te quedas sin margen para reaccionar a una
        crisis — mira siempre cuanto te queda libre antes de comprometerte a un plan grande.
      </p>
    )
  },
  {
    emoji: '📊',
    title: 'Las pestanas: que mira cada una',
    body: (
      <ul>
        <li><b>Pais</b>: tus indicadores (economia, poblacion, sectores) y acciones bilaterales con otros paises.</li>
        <li><b>Gobierno</b>: tu mandato, intencion de voto, oposicion, politica impositiva y Banco Central.</li>
        <li><b>Gabinete</b>: tus cinco ministros — cada uno suma un pasivo mensual y abarata una categoria.</li>
        <li><b>Decisiones</b>: el catalogo completo de acciones que podes tomar, por categoria.</li>
        <li><b>Bloques</b>: alianzas militares, uniones aduaneras y bloques economicos a los que podes sumarte.</li>
        <li><b>Eventos</b>: lo que ya paso y lo que esta en curso.</li>
        <li><b>Previsional</b>: tu sistema de jubilaciones, empleo formal/informal y salario real.</li>
      </ul>
    )
  },
  {
    emoji: '👥',
    title: 'Gabinete: cada silla es una apuesta',
    body: (
      <p>
        Nombras un ministro por silla (Economia, Interior, Exterior, Defensa, Jefatura de Gabinete). Cada uno
        aporta o resta algo distinto todos los meses, y abarata una categoria de decisiones. Sentar a alguien de
        la oposicion te arma una coalicion — mas votos y estabilidad, a cambio de que cada tanto te pase una
        factura que vas a tener que negociar.
      </p>
    )
  },
  {
    emoji: '🗳️',
    title: 'Elecciones',
    body: (
      <p>
        Cada cierto tiempo (segun el sistema politico de tu pais) hay elecciones presidenciales, y en algunos
        paises tambien de medio termino. Tu intencion de voto se ve en Gobierno y depende de la economia, tu
        humor social y tu Capital Politico. Perder una eleccion termina la partida; ganarla te da un mandato
        nuevo y honeymoon (capital pasivo x2 los primeros meses).
      </p>
    )
  },
  {
    emoji: '📚',
    title: 'Eventos: lo que no controlas',
    body: (
      <p>
        Cada mes pueden salir eventos nacionales o mundiales — crisis, oportunidades, shocks de sectores. Algunos
        te dan opciones para elegir como responder; otros aplican solos. El globo del medio muestra en vivo tus
        relaciones, comercio y bloques.
      </p>
    )
  },
  {
    emoji: '👴',
    title: 'Previsional: tu sistema de jubilaciones',
    body: (
      <p>
        Arrancas con parametros previsionales realistas (edad de jubilacion, aportes, tasa de reemplazo,
        cobertura). En la pestana Previsional ves si tu sistema se autofinancia o le pide caja al resto del
        presupuesto, y en Decisiones → Previsional podes reformarlo — cada reforma tiene un coste politico y un
        efecto fiscal/de empleo real, con trade-offs de verdad. Para el detalle de cada formula, anda a la{' '}
        <Link href="/guia">Guia y formulas</Link>.
      </p>
    )
  }
];

export default function TutorialPage() {
  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-nav">
          <Link href="/"><button>← Volver</button></Link>
          <Link href="/actualizaciones"><button>Actualizaciones</button></Link>
          <Link href="/guia"><button>Guia y formulas</button></Link>
        </div>

        <p className="page-kicker">Como se juega</p>
        <h1>Tutorial</h1>
        <p className="sub">
          Gobernas un pais mes a mes. Economia, calle, bloques, rutas maritimas y crisis que no controlas.
          Esto es lo que necesitas saber antes de arrancar.
        </p>

        {STEPS.map((s, i) => (
          <div className="card" key={s.title}>
            <h2>{s.emoji} {i + 1}. {s.title}</h2>
            {s.body}
          </div>
        ))}

        <p className="muted" style={{ fontSize: 12 }}>
          Cuando arranques una partida vas a ver ademas un resumen corto de esto mismo la primera vez.
        </p>
      </div>
    </div>
  );
}

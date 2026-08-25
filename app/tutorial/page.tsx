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
        crisis — mira siempre cuanto te queda libre antes de comprometerte a un plan grande. Sostener superavit
        fiscal, inflacion baja y desempleo bajando a la vez suma un bonus extra todos los meses; la corrupcion
        alta, en cambio, te lo drena.
      </p>
    )
  },
  {
    emoji: '🤝',
    title: 'Capital Diplomatico: un bolsillo aparte para el mundo',
    body: (
      <p>
        Las decisiones de categoria <b>Diplomacia</b> y los movimientos de bloques (ingresar, salir, convocar
        cumbre) no gastan tu Capital Politico: gastan <b>Capital Diplomatico</b>, un recurso propio, mas escaso,
        que se regenera con tu presencia en bloques y el bonus pasivo de tu Canciller. Tener a alguien bueno en
        Exterior te deja hacer mas diplomacia sin resentir tu capacidad de gobernar puertas adentro.
      </p>
    )
  },
  {
    emoji: '📊',
    title: 'Las pestanas: que mira cada una',
    body: (
      <ul>
        <li><b>Pais</b>: tus indicadores (economia, poblacion, sectores) y acciones bilaterales con otros paises.</li>
        <li>
          <b>Gobierno</b>: tu mandato, intencion de voto, los dos partidos opositores (ideologia, humor y
          pacto), los tres lideres minoritarios, politica impositiva y Banco Central.
        </li>
        <li><b>Grupos</b>: la popularidad por sector — 5 grupos con intereses propios.</li>
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
    emoji: '📣',
    title: 'Grupos: el pueblo no piensa como un solo bloque',
    body: (
      <p>
        Tu felicidad general convive con 5 grupos con intereses propios, visibles en la pestana{' '}
        <b>Grupos</b>: <b>Empresarios y comerciantes</b> (priorizan inflacion baja, impuestos bajos y
        desregulacion), <b>Clase media</b> (odia corrupcion, inflacion y desempleo por igual), <b>Clase obrera</b>
        {' '}(en contra del desempleo y del capital concentrado, a favor de los sindicatos), <b>Clase alta/
        oligarcas</b> (quieren favores y desregulacion hasta que les toca el bolsillo propio — y controlan los
        medios: contentos suman Capital Politico, en contra te lo restan) y <b>Los Fieles</b> (tu base, se mueve
        poco y es la ultima en irse). Cada grupo pesa distinto en tu intencion de voto: una misma decision puede
        subirte con unos y bajarte con otros a la vez. Si dejas que alguno caiga por debajo de 30 de humor, deja
        de ser paciente y actua por su cuenta cada mes hasta que se recupere: la obrera arma huelga general, la
        alta saca sus dolares del pais, los empresarios frenan la inversion, y la clase media sale con las ollas.
      </p>
    )
  },
  {
    emoji: '🏦',
    title: 'Banco Central: la tasa tiene memoria',
    body: (
      <p>
        En <b>Gobierno → Banco Central</b> podes subir o bajar la tasa de interes de a un punto. A diferencia de
        una decision comun, el cambio queda fijo: pega sobre inflacion y crecimiento todos los meses mientras
        siga alta o baja (no solo el mes que la moviste), y tambien mueve el tipo de cambio. La Confianza que se
        ve al lado es informativa por ahora.
      </p>
    )
  },
  {
    emoji: '🏗️',
    title: 'Infraestructura: obras que se sienten en el mapa',
    body: (
      <p>
        En <b>Decisiones → Infraestructura</b> podes construir, una vez cada una por partida, un Aeropuerto
        Internacional, un Puerto de Aguas Profundas, una Base Militar o un Centro de Datos IA. Cada obra tarda
        varios meses (la cuenta regresiva se ve en <b>Gobierno → Infraestructura</b> y en el mapa, capa
        &quot;Infraestructura&quot;), cuesta capital politico y caja de una sola vez, y al terminar entrega un bono todos
        los meses — corrupcion alta encarece y alarga la obra. Algunas de estas decisiones piden un minimo de
        estabilidad o un maximo de corrupcion para aparecer en el catalogo: si tu pais no las cumple, no las vas
        a ver hasta que las cumpla.
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
  },
  {
    emoji: '🕴️',
    title: 'Justicia: corrupcion y Enrique Grook',
    body: (
      <p>
        En el mes 4 de cada partida se presenta <b>Enrique Grook</b>, el Subsecretario de la Subsecretaria
        de Presidencia — un onboarding obligatorio que explica el sistema y desbloquea la pestana
        <b> Justicia</b> (no existe antes de ese momento). Ahi ves tu nivel de corrupcion y el Progreso de
        Investigaciones de la Suprema Corte y la Comision Anticorrupcion. Enrique vuelve despues con cartas
        propias en pantalla completa, ofreciendo siempre el camino facil — pero no todos los meses: aparece
        mas seguido cuanto peor estas, nunca es seguro, y si le decis que no varias veces seguidas se ofende
        y desaparece un tiempo. (Los tres lideres minoritarios se mudaron a <b>Gobierno</b>, visibles desde
        el primer mes.)
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

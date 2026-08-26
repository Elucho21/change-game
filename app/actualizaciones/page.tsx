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
          <h2>🧭 v1.4 — Desglose de KPIs, buscador y menu vertical</h2>
          <p className="muted" style={{ fontSize: 12, marginTop: -4 }}>
            Mas datos para calcular la jugada, y una interfaz que se organiza como panel de gobierno.
          </p>

          <h3>📊 Que compone cada KPI, mes a mes</h3>
          <p>
            El popover de <b>Capital politico</b>, <b>Capital diplomatico</b>, <b>Felicidad</b>,{' '}
            <b>Estabilidad</b>, <b>Crecimiento</b>, <b>Inflacion</b>, <b>Fiscal</b> y <b>Deuda/PBI</b> (click en la
            barra superior) ahora muestra, ademas de la evolucion historica, un desglose de este turno: cuanto
            vino de tus decisiones, de la economia real, de los eventos, del sistema moral y de los grupos
            sociales. El resto de los indicadores suma una linea fija de &quot;con que se relaciona&quot; para
            entender que mecanicas los mueven, no solo el numero.
          </p>

          <h3>🔎 Buscador de decisiones en las 8 categorias</h3>
          <p>
            En <b>Decisiones</b>, un buscador nuevo ignora la pestana activa y busca en las 76 decisiones por
            nombre o descripcion &mdash; cada resultado muestra de que categoria viene. Sumamos tambien un
            selector de orden: catalogo, por costo, o alfabetico.
          </p>

          <h3>🧭 Menu vertical con submenus</h3>
          <p>
            En escritorio, los 9 paneles dejan de ser una tira de pestanas iguales: <b>Pais</b> y{' '}
            <b>Decisiones</b> quedan sueltos arriba (los de uso mas frecuente), y el resto se agrupa en{' '}
            <b>Gobierno</b>, <b>Mundo</b> y <b>Sociedad</b>, plegables. En mobile la navegacion sigue igual que
            siempre.
          </p>
        </div>

        <div className="card">
          <h2>🏛️ v1.36 — Politica interna con dientes: Enrique, minoritarios, oposicion y grupos</h2>
          <p className="muted" style={{ fontSize: 12, marginTop: -4 }}>
            El tablero politico interno deja de ser decoracion. Enrique deja de insistir todos los meses, los
            tres lideres minoritarios y los dos partidos opositores pesan de verdad, y los 5 grupos sociales
            pueden romper cosas si los dejas caer. Ademas, la economia deja de curarse sola.
          </p>

          <h3>🕴️ Enrique ya no te ofrece lo mismo todos los meses</h3>
          <p>
            Antes, pasado cierto punto de la partida, Enrique aparecia a pantalla completa <b>todos los meses,
            para siempre</b>, a veces con la misma carta repetida dos o tres veces seguidas. Ahora su aparicion
            es una probabilidad que sube con lo mal que estas (nunca es segura), no repite la misma carta antes
            de un buen tiempo, y tiene memoria: si le decis que no varias veces seguidas se ofende y desaparece
            unos meses — pero si le seguis el juego, te desbloquea su oferta mas grande.
          </p>

          <h3>🚩🌿🎖️ Los lideres minoritarios ya pesan en la eleccion</h3>
          <p>
            Gustavo Comun, Amalia Verde y Jhon el Duro dejan de ser tres barras decorativas: el apoyo que
            acumulan ahora se descuenta de tu intencion de voto, empuja a la oposicion, y Gustavo (el unico con
            estructura sindical) puede sumar presion de calle real. Un lider con apoyo alto tambien hace que sus
            propias cartas te salgan mas seguido. Los vas a encontrar ahora en <b>Gobierno</b>, visibles desde el
            primer mes — antes vivian ocultos en Justicia hasta el mes 4.
          </p>

          <h3>🤝 La oposicion tiene nombre, ideologia y precio</h3>
          <p>
            Los dos partidos opositores ya no son dos nombres sueltos: cada uno tiene una ideologia (liberal,
            conservador, socialdemocrata, nacionalista o progresista) que define que decisiones acompaña y
            cuales bloquea, y un humor propio que sube o baja segun lo que hagas. Les podes ofrecer un{' '}
            <b>pacto parlamentario</b> (pestana Decisiones → Comunicacion) en cualquier momento del mandato, no
            solo en campaña: si aceptan, sus bancas pasan a contar para tu mayoria, al precio que pidan segun
            cuanto humor tengan.
          </p>

          <h3>📣 Los 5 grupos pueden romper cosas</h3>
          <p>
            Muchas mas decisiones y los eventos nacionales grandes (piquetes, paro general, corrupcion, corrida
            cambiaria, FMI, boom de commodities) ahora mueven a tus 5 grupos sociales. Y si dejas que alguno caiga
            por debajo de 30 de humor, deja de ser paciente: la clase obrera arma huelga general, la clase alta
            saca sus dolares del pais, los empresarios frenan la inversion, y la clase media sale con las ollas.
            La pestana <b>Grupos</b> ahora muestra tendencia y un mini-historial de cada uno, no solo el nivel
            de hoy.
          </p>

          <h3>💰 La economia deja de curarse sola</h3>
          <p>
            Correr deficit con la deuda alta ya empieza a empujar la inflacion. La deuda paga intereses de
            verdad todos los meses — cuanto mas alta, mas cara la tasa a la que te financiás. Y un pais golpeado
            (estabilidad hundida, deuda disparada) tarda mucho mas en volver a crecer que antes: la confianza
            de los inversores no se recupera en seis meses, se gana de a poco. Gobernar mal ahora tiene
            consecuencias que se sostienen en el tiempo, no se disuelven solas.
          </p>
        </div>

        <div className="card">
          <h2>🗞️ v1.35 — Cronica de fin de turno</h2>
          <p className="muted" style={{ fontSize: 12, marginTop: -4 }}>
            Al cerrar el mes ya no solo ves numeros que subieron o bajaron: ves un informe corto de que paso.
          </p>

          <h3>🗞️ Un informe, no una lista de deltas</h3>
          <p>
            Cada turno arma un resumen de 4 a 6 lineas al tope del feed, con icono <b>🗞️</b>: como se movio tu
            comercio contra el arranque de la partida y quien es tu principal socio, si hubo tension en las rutas
            y el petroleo, que hicieron las otras potencias, que evento mundial paso, y como esta tu estabilidad
            o tu desempleo. La idea es que en 10 segundos sepas que paso afuera y adentro, no solo que indicador
            se movio.
          </p>
        </div>

        <div className="card">
          <h2>🏗️ v1.3 — Banco Central, Infraestructura y Decisiones Contextuales</h2>
          <p className="muted" style={{ fontSize: 12, marginTop: -4 }}>
            La tasa de interes ahora tiene memoria, el mapa se vuelve una herramienta de poder, y el catalogo
            de decisiones reacciona al estado real de tu pais.
          </p>

          <h3>🏦 Banco Central: tasa de interes persistente</h3>
          <p>
            Subir o bajar la tasa (panel <b>Gobierno → Banco Central</b>) ya no es un golpe de una sola vez:
            queda fija mes a mes, pega sobre inflacion y crecimiento todos los turnos mientras siga alta o baja,
            y mueve el tipo de cambio. Un indice de <b>Confianza</b> (informativo por ahora) reacciona a
            inflacion, deuda y reservas.
          </p>

          <h3>🏗️ Infraestructura: cuatro obras que se sienten en el mapa</h3>
          <p>
            Nueva categoria de decisiones <b>Infraestructura</b>: Aeropuerto Internacional, Puerto de Aguas
            Profundas, Base Militar y Centro de Datos IA — una de cada una por partida. Cada obra tarda varios
            meses en construirse (se ve la cuenta regresiva en <b>Gobierno → Infraestructura</b> y en el mapa),
            cuesta capital politico y caja de una sola vez, y al quedar operativa entrega un bono pasivo todos
            los meses (crecimiento, felicidad, estabilidad o balance fiscal segun el tipo). La corrupcion alta
            encarece la obra y la alarga: otra razon mas para pelearla.
          </p>

          <h3>🎯 Decisiones que reaccionan a tu pais</h3>
          <p>
            Algunas decisiones (por ahora, las de Infraestructura) exigen condiciones minimas — estabilidad
            suficiente, corrupcion no demasiado alta — y directamente desaparecen del catalogo si no las cumplis,
            en vez de mostrarse deshabilitadas. La base para que mas decisiones reaccionen asi en el futuro ya
            esta wireada.
          </p>

          <h3>🐛 Un bug de deficit corregido</h3>
          <p>
            Algunas elecciones de eventos con costo fiscal (por ejemplo, negociar con piqueteros) te estaban
            cobrando el doble de lo que decia el cartel, desde antes de esta version. Ya esta corregido: lo que
            ves es lo que se cobra.
          </p>
        </div>

        <div className="card">
          <h2>📣 v1.2 — Capital Diplomatico y Popularidad por Sector</h2>
          <p className="muted" style={{ fontSize: 12, marginTop: -4 }}>
            El pueblo no piensa como un solo bloque, y la diplomacia deja de vivir del mismo bolsillo que el resto.
          </p>

          <h3>🤝 Capital Diplomatico</h3>
          <p>
            Nuevo recurso, separado del Capital Politico: solo lo gastan y ganan las decisiones de categoria{' '}
            <b>Diplomacia</b> y los movimientos de bloques (ingresar, salir, convocar cumbre). Arranca mas escaso
            (25) y se regenera solo con tu presencia en bloques y el bonus pasivo de tu Canciller, que ahora esta
            enfocado exclusivamente en esto — antes ademas abarataba e inflaba el rendimiento de esas mismas
            decisiones, un doble beneficio que quedo corregido.
          </p>

          <h3>📣 Popularidad por sector: 5 grupos</h3>
          <p>
            Tu felicidad general ahora convive con 5 grupos con intereses propios, visibles en la pestana nueva{' '}
            <b>Grupos</b>: <b>Empresarios y comerciantes</b> (priorizan inflacion baja, impuestos bajos y
            desregulacion), <b>Clase media</b> (odia corrupcion, inflacion y desempleo por igual),{' '}
            <b>Clase obrera</b> (en contra del desempleo y del capital concentrado, a favor de los sindicatos),{' '}
            <b>Clase alta/oligarcas</b> (quieren favores y desregulacion hasta que les toca el bolsillo propio —
            y controlan los medios: contentos suman Capital Politico, en contra te lo restan) y{' '}
            <b>Los Fieles</b> (tu base, se mueve poco y es la ultima en irse). Cada grupo pesa distinto en tu
            intencion de voto, no solo por cuanta gente representa sino por cuanto pesa electoralmente.
          </p>

          <h3>🕵️ Mas herramientas anti-corrupcion</h3>
          <p>
            6 decisiones nuevas en <b>Decisiones → Interior</b>, disponibles desde el primer mes — antes, pelear
            la corrupcion solo era posible con las cartas de Enrique desde el mes 4. Ley de transparencia,
            organismo de control del gasto publico, independencia judicial, proteccion a denunciantes, auditoria
            de compras publicas y declaraciones juradas obligatorias. Ninguna es gratis: todas cuestan capital
            politico.
          </p>

          <h3>💰 Capital politico: menos bola de nieve, mas premio al buen manejo</h3>
          <p>
            El interes por capital ahorrado ahora tiene techo (antes escalaba sin limite con capital alto).
            A cambio, sostener superavit fiscal, inflacion baja y desempleo bajando a la vez suma un bonus de
            capital todos los meses. Y la corrupcion alta ahora te drena capital politico mes a mes — otra razon
            concreta para pelearla, no solo un numero que sube.
          </p>
        </div>

        <div className="card">
          <h2>🕵️ v1.1 — Sistema Moral</h2>
          <p className="muted" style={{ fontSize: 12, marginTop: -4 }}>Corrupcion, Justicia y los tres lideres minoritarios.</p>

          <h3>🕴️ Enrique Grook</h3>
          <p>
            En el mes 4 de cada partida se presenta Enrique Grook, Subsecretario de la Subsecretaria de
            Presidencia — un onboarding obligatorio que explica el sistema y desbloquea la pestana{' '}
            <b>Justicia</b>. De ahi en mas, Enrique vuelve con cartas propias (14 en total) ofreciendo el
            camino facil: contratos amigos, favores a la Corte, silencios mediaticos, sacrificar a alguien
            cuando la Comision aprieta. Cada carta tiene consecuencias reales sobre tu corrupcion y las
            investigaciones — nunca es gratis.
          </p>

          <h3>🧾 Corrupcion y Progreso de Investigaciones</h3>
          <p>
            Dos indicadores nuevos en la pestana Justicia. La corrupcion sube con favores y arreglos, baja
            sola si el pueblo esta contento y no haces nada nuevo. El Progreso de Investigaciones mide que
            tan cerca esta la Justicia de tirar del hilo: sube con corrupcion alta, pueblo infeliz y
            escandalos; una mayoria parlamentaria solida lo frena, pero nunca lo anula del todo.
          </p>

          <h3>⚖️ Suprema Corte y Comision Anticorrupcion</h3>
          <p>
            La independencia de la Corte y la integridad de la Comision (esta ultima depende de cuantos
            escanos propios tenes) determinan que tan rapido avanzan las causas. Podes empujar jueces amigos
            o dejar que el Parlamento elija libremente — cada camino tiene su precio.
          </p>

          <h3>🚩🌿🎖️ Los tres lideres minoritarios</h3>
          <p>
            Gustavo Comun (Partido Comunista, techo 8%), Amalia Verde (Partido Verde, techo 5%) y Jhon el
            Duro (Ultra-Derecha, techo 9%) — no son oposicion tradicional, son ruido y presion permanente.
            Gustavo crece con desempleo y descontento social; Amalia con el deterioro ambiental; Jhon con la
            inseguridad en alza. Cada uno trae sus propias cartas de eventos y nunca superan su techo
            electoral, pero complican mayorias y suman costo politico si los dejas crecer.
          </p>
        </div>

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

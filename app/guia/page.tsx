import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Guia y formulas — Change World Game',
  description: 'Referencia completa de metricas, formulas y mecanicas de Change World Game.'
};

export default function GuiaPage() {
  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-nav">
          <Link href="/"><button>← Volver</button></Link>
          <Link href="/tutorial"><button>Tutorial</button></Link>
          <Link href="/actualizaciones"><button>Actualizaciones</button></Link>
        </div>

        <p className="page-kicker">Referencia</p>
        <h1>Guia y formulas</h1>
        <p className="sub">
          Como calcula el juego cada numero. Estas son las constantes reales que usa el motor, no una
          aproximacion — si algo te sorprendio en la partida, probablemente esta explicado aca.
        </p>

        <div className="card">
          <h2>⚡ Capital Politico</h2>
          <p>Tu moneda para gobernar. Base 10 al arrancar, se regenera solo cada mes:</p>
          <code className="page-formula">pasivo = 8 + (felicidad − 60) / 10 → doble durante honeymoon</code>
          <p>
            <b>Honeymoon</b>: los primeros 4 meses despues de ganar una eleccion, el pasivo va x2.
            Cada decision cuesta capital segun su tabla base, multiplicado por: cuanta oposicion tenes en la
            calle, si tenes mayoria en el Congreso, tu gabinete (cada ministro abarata una categoria) y las
            facciones sentadas. Si el plan del turno cuesta mas de lo que tenes libre, no lo podes confirmar.
          </p>
        </div>

        <div className="card">
          <h2>💱 Tipo de cambio y FMI</h2>
          <p>
            Indice de tipo de cambio, arranca en 100 (sube = devaluacion, baja = apreciacion). Sube por
            inflacion alta, deficit fiscal, deuda creciente y estar bajo programa del FMI; baja si tenes
            superavit o las reservas suben.
          </p>
          <p>
            <b>Arco FMI</b>: la deuda define la banda (60% observacion, 75% riesgo, 90% mision, 110% programa),
            la tendencia y el deficit definen que tan fuerte pesa (0 a 18). Solo superavit sostenido + deuda
            bajando (o cumplir el programa 3 meses seguidos) te saca del radar.
          </p>
          <p>Devaluar de un saque salta el indice +8 puntos de una vez.</p>
        </div>

        <div className="card">
          <h2>🔥 Presion de calle</h2>
          <p>
            Inflacion y desempleo altos sostenidos varios meses seguidos suben un &quot;peso&quot; de calle. A partir de
            4, gotea humor social y estabilidad todos los meses hasta que bajen. Un ministro sindical alimenta
            la mecha; uno pro-mercado la enfria.
          </p>
        </div>

        <div className="card">
          <h2>👴 Sistema previsional</h2>
          <p>Parametros de arranque (todo pais empieza igual, se reforma desde Decisiones → Previsional):</p>
          <ul>
            <li>Edad de jubilacion: 65 (hombres) / 60 (mujeres)</li>
            <li>Aporte trabajador 11% + aporte empleador 16% = 27% del salario</li>
            <li>Tasa de reemplazo: 65% del ultimo salario</li>
            <li>Cobertura: 72% de los ocupados aporta · Evasion: 18%</li>
            <li>Ratio de dependencia (jubilados/activos): 22%, sube solo de a poco (envejecimiento)</li>
          </ul>
          <p>Resultado previsional del mes, en puntos de PBI:</p>
          <code className="page-formula">
            resultado = (aporteTrabajador + aporteEmpleador) × 0.6 × cobertura × (1 − evasion){'\n'}
            {'          '}− dependencia × tasaReemplazo × 0.6
          </code>
          <p>
            El 0.6 es la masa salarial como fraccion del PBI (valor fijo del diseño). Positivo = tu sistema se
            autofinancia; negativo = el Estado tiene que poner la diferencia, y eso pega en el balance fiscal.
            Una reforma no golpea la caja de un saque: el efecto se asienta recien en el mes siguiente,
            comparado contra el ultimo resultado ya asentado — asi el numero que ves se mueve de verdad con tus
            reformas, en vez de que la economia entera arranque con un flujo escondido adentro.
          </p>
          <h3>Reformas y su coste base de Capital Politico</h3>
          <ul>
            <li>Subir edad de jubilacion (+2 anios ambos sexos): 4</li>
            <li>Igualar edad hombres/mujeres: 7</li>
            <li>Subir aporte del trabajador (+2pp): 6</li>
            <li>Subir aporte del empleador (+2pp): 5</li>
            <li>Bajar tasa de reemplazo (−10pp): 11 — la mas cara de todas</li>
            <li>Mejorar fiscalizacion (−6pp evasion): 3</li>
            <li>Eliminar jubilaciones de privilegio: 7</li>
            <li>Plan de formalizacion y cobertura (+8pp cobertura): la unica con ganancia neta de capital</li>
          </ul>
          <p>
            El coste final baja hasta 40% si hay crisis fiscal visible (balance fiscal &lt; −3% PBI), baja hasta
            30% si tenes superavit con inflacion baja, y un poco mas si tu Capital Politico ya es alto (&gt;15)
            — nunca baja de un piso del 40% del coste base.
          </p>
        </div>

        <div className="card">
          <h2>💼 Empleo formal/informal y salario real</h2>
          <p>Arranca en 58% formal / 34% informal. Cada mes:</p>
          <code className="page-formula">
            Δformal = 0.5 × (crecimientoPBI/12) − 1.0 × ΔaporteTotal{'\n'}
            {'        '}+ 0.5 × Δcobertura + 0.175 × ΔedadJubilacion
          </code>
          <p>
            Un ministro de Economia con perfil tecnico (hoy: la liberal de libros y el pro-mercado) atenua
            hasta la mitad el dano de subir aportes. El desempleo abierto se mueve con la mitad de este cambio.
          </p>
          <p>El salario real (indice, 100 = arranque) sube con crecimiento y deflacion, baja con aportes e inflacion alta:</p>
          <code className="page-formula">
            Δsalario = 0.7 × (crecimientoPBI/12) − 0.9 × ΔaporteTrabajador{'\n'}
            {'        '}+ (deflacion ? |inflacion| × 0.05 : −max(0, inflacion − 8) × 0.1)
          </code>
        </div>

        <div className="card">
          <h2>❄️ Deflacion, reservas y superavit pasivo</h2>
          <p>Si tu inflacion anual es negativa, las reservas de oro crecen solas cada mes:</p>
          <code className="page-formula">crecimiento = |inflacion| × 1.25% × reservasActuales / 12</code>
          <p>
            Ademas, tu superavit fiscal (si lo tenes) no se te licua bajo deflacion: en este motor el balance
            fiscal solo se mueve por cambios explicitos (impuestos, decisiones, eventos, recaudacion dinamica),
            nunca decae solo — asi que un superavit ya se preserva sin que haga falta ningun calculo extra.
          </p>
        </div>

        <div className="card">
          <h2>📈 Recaudacion dinamica (tax buoyancy)</h2>
          <p>El crecimiento o la contraccion de tu economia mueve la recaudacion con elasticidad {'>'} 1:</p>
          <code className="page-formula">
            ΔbalanceFiscal = (crecimientoPBI/12) × (1.15 − 1) × 28% × 100
          </code>
          <p>
            El 28% es la carga tributaria tipica del diseño (no hay un dato real por pais). Es un efecto lento
            y de fondo: a elasticidad exactamente 1 no pasaria nada (la recaudacion crece igual que el PBI y el
            ratio no se mueve); el excedente sobre 1 es lo que realmente se nota, mes a mes, en el balance
            fiscal — de ahi que bajar impuestos con la macro ordenada pueda pagarse solo con el tiempo.
          </p>
        </div>

        <div className="card">
          <h2>⚖️ Gasto rigido: militar vs previsional</h2>
          <p>Se ve como semaforo en la pestana Previsional:</p>
          <code className="page-formula">
            total = (presupuestoMilitar / PBI) × 100 + max(0, −resultadoPrevisional)
          </code>
          <ul>
            <li><b>OK</b>: hasta 15% del PBI</li>
            <li><b>Observar</b>: 15% a 18%</li>
            <li><b>Alerta</b>: mas de 18% — riesgo de crisis de deuda si no hay superavit en otro lado</li>
          </ul>
        </div>

        <div className="card">
          <h2>🕵️ Corrupcion y Progreso de Investigaciones</h2>
          <p>
            Aparecen recien despues del onboarding de Enrique Grook (mes 4). La corrupcion decae o crece
            despacio segun el humor del pueblo, y los actos puntuales (cartas de Enrique) la mueven directo:
          </p>
          <code className="page-formula">
            Δcorrupcion = felicidad {'>'} 55 ? −0.3 : felicidad {'<'} 40 ? +0.2 : −0.05
          </code>
          <p>El Progreso de Investigaciones es mensual y esta pensado para que la corrupcion PROPIA sea el driver principal, no un ruido de fondo:</p>
          <code className="page-formula">
            Δinvestigacion = (corrupcion/100) × 3.5{'\n'}
            {'                '}+ (100 − felicidad) × 0.02{'\n'}
            {'                '}+ integridadCorte × 0.015 + integridadComision × 0.01{'\n'}
            {'                '}+ escandalo × 0.06 − favoresActivos × 0.07 − bonusMayoria
          </code>
          <p>
            <b>bonusMayoria</b> es 1.2 si tenes mayoria parlamentaria, +0.6 mas si es solida ({'>'}65 escanos
            totales). La integridad de la Comision no se guarda como dato propio: se deriva de tus escanos
            (<code>clamp(70 − escanosTotales×0.4, 20, 90)</code>) — mas mayoria, Comision mas controlable,
            nunca a 0.
          </p>
          <ul>
            <li><b>0-15</b> Limpio · <b>16-35</b> Manchas menores · <b>36-55</b> Corrupcion estructural</li>
            <li><b>56-75</b> Sistema capturado · <b>76-100</b> Putrefaccion</li>
          </ul>
          <p>
            Corrupcion arriba de 55 resta felicidad todos los meses (−0.15, −0.4 arriba de 75) — la unica
            forma de bajarla de golpe son las cartas de Enrique (sacrificios, limpiezas, archivos), no el
            paso del tiempo solo.
          </p>
        </div>

        <div className="card">
          <h2>🚩🌿🎖️ Lideres minoritarios</h2>
          <p>
            Gustavo Comun (techo 8%), Amalia Verde (techo 5%) y Jhon el Duro (techo 9%) convergen 10%/mes
            hacia un objetivo calculado por sus propios drivers — mismo patron que usa la oposicion:
          </p>
          <code className="page-formula">
            targetGustavo = (desempleo − 5) × 0.6 + (60 − felicidad) × 0.05{'\n'}
            targetAmalia  = (60 − indiceAmbiental) × 0.08 + max(0, corrupcion − 20) × 0.02{'\n'}
            targetJhon    = (indiceInseguridad − 30) × 0.15 + max(0, corrupcion − 30) × 0.03
          </code>
          <p>
            El indice ambiental y el de inseguridad son dos diales livianos nuevos (0-100, arrancan ~55/45),
            que derivan solos hacia 50 y se mueven fuerte con decisiones y las propias cartas de cada lider.
            Ninguno de los tres supera su techo por mas que sus drivers esten al maximo.
          </p>
        </div>

        <p className="muted" style={{ fontSize: 12 }}>
          Todo lo de arriba es diseño de juego, no estadistica real de ningun pais — pensado para que las
          decisiones tengan trade-offs claros, no para simular economia con precision academica.
        </p>
      </div>
    </div>
  );
}

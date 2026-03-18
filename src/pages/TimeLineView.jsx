import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './TimelineView.module.css';
import { ESTADOS_SERVICIO } from './Inventario';
import RemisionRecepcionPDF from './RemisionRecepcionPDF';
import RemisionEntregaPDF from './RemisionEntregaPDF';
import StickerEquipo from './StickerEquipo';
import { useRemisionPDF } from '../hooks/useRemisionPDF';
import { useStickerPDF } from '../hooks/useStickerPDF';
import { obtenerCotizacionesPorSerial, actualizarNroReporte } from '../Firebase/firebaseLogic';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTimestamp = (ts) => {
  if (!ts) return '—';
  const ms =
    ts?.toMillis?.() ??
    (ts?.seconds != null ? ts.seconds * 1000 : null) ??
    (typeof ts === 'string' ? new Date(ts).getTime() : null);
  if (!ms || isNaN(ms)) return '—';
  return new Date(ms).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const ESTADO_COLORES = {
  'Ingresado':            '#1e40af',
  'Diagnóstico':          '#7c3aed',
  'En espera aprobación': '#b45309',
  'En reparación':        '#c2410c',
  'Listo para entrega':   '#166534',
  'Entregado':            '#374151',
  'Devolución':           '#991b1b',
};

const COT_ESTADO_CFG = {
  'En espera':   { color: '#b45309', bg: '#fff8e1', border: '#fbbf24' },
  'Aprobada':    { color: '#166534', bg: '#f0fdf4', border: '#86efac' },
  'No aprobada': { color: '#991b1b', bg: '#fff5f5', border: '#fca5a5' },
};

const fmt = (n, moneda = 'COP') =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: moneda,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n ?? 0);

// ─── Panel de actualización por servicio ─────────────────────────────────────
const ServicioPanel = ({ servicio, onActualizar }) => {
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [nota, setNota]               = useState('');
  const [enviando, setEnviando]       = useState(false);

  const FLUJO = {
    'Ingresado':            'Diagnóstico',
    'Diagnóstico':          'En espera aprobación',
    'En espera aprobación': 'En reparación',
    'En reparación':        'Listo para entrega',
    'Listo para entrega':   'Entregado',
    'Devolución':           'Entregado',
  };

  const estadoActual    = servicio.estadoActual;
  const estadoSiguiente = FLUJO[estadoActual];
  const yaFinalizado    = estadoActual === 'Entregado';

  const handleActualizar = async () => {
    if (!nuevoEstado) return;
    setEnviando(true);
    try {
      await onActualizar(servicio.id, nuevoEstado, nota);
      setNota(''); setNuevoEstado('');
    } finally { setEnviando(false); }
  };

  return (
    <div className={styles.serviceBlock}>
      <div className={styles.serviceHeader}>
        <div className={styles.serviceHeaderLeft}>
          <span className={styles.servicioLabel}>Servicio</span>
          <span className={styles.servicioMotivo}>{servicio.motivo}</span>
        </div>
        <div className={styles.serviceHeaderRight}>
          <span className={styles.servicioFecha}>
            Ingreso: {fmtTimestamp(servicio.fechaIngreso)}
          </span>
        </div>
      </div>

      {!yaFinalizado && (
        <div className={styles.updatePanel}>
          <div className={styles.updatePanelRow}>
            <select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)} className={styles.updateSelect}>
              <option value="">— Cambiar estado —</option>
              {estadoSiguiente && (
                <option value={estadoSiguiente}>▶ {estadoSiguiente} (siguiente)</option>
              )}
              {ESTADOS_SERVICIO.filter(e => e !== estadoActual && e !== estadoSiguiente).map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <input type="text" placeholder="Nota técnica (opcional)..."
              value={nota} onChange={e => setNota(e.target.value)} className={styles.updateInput} />
            <button className={styles.updateBtn} onClick={handleActualizar} disabled={!nuevoEstado || enviando}>
              {enviando ? 'Guardando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      )}

      {yaFinalizado && (
        <div className={styles.finalizadoBadge}>✓ Servicio finalizado — entregado al cliente</div>
      )}

      <div className={styles.timeline}>
        {[...(servicio.historial ?? [])].reverse().map((paso, i) => {
          const color = ESTADO_COLORES[paso.estado] ?? '#374151';
          return (
            <div key={i} className={styles.timelineStep}>
              <div className={styles.dotWrap}>
                <div className={styles.dot} style={{ background: color }} />
                {i < (servicio.historial.length - 1) && <div className={styles.dotLine} />}
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepTitle} style={{ color }}>{paso.estado}</span>
                  <span className={styles.stepDate}>{fmtTimestamp(paso.fecha)}</span>
                </div>
                {paso.nota && <p className={styles.stepNote}>{paso.nota}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
const TimelineView = ({ resultado, onVolver, onActualizar }) => {
  if (!resultado) return null;
  const { equipo, servicios } = resultado;
  const navigate = useNavigate();

  // ── Hooks PDF ──
  const { remisionRef, generarRemision, generando }                                                = useRemisionPDF();
  const { remisionRef: entregaRef, generarRemision: generarEntrega, generando: generandoEntrega } = useRemisionPDF();
  const { stickerRef, descargarPNG, descargarPDF, generando: generandoSticker }                   = useStickerPDF();

  // ── ORDEN CORRECTO: declarar variables antes de usarlas ──
  const servicioActivo     = servicios.find(s => s.estadoActual !== 'Entregado');
  const serviciosHistorial = servicios.filter(s => s.estadoActual === 'Entregado');
  const puedeEntrega       = !!servicioActivo &&
    ['Listo para entrega', 'Entregado'].includes(servicioActivo.estadoActual);
  const nroRemision        = servicioActivo
    ? `REM-${servicioActivo.id.slice(-6).toUpperCase()}` : null;

  // ── Estado cotizaciones vinculadas ──
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargandoCot, setCargandoCot]   = useState(false);

  // ── Estado reporte técnico ──
  const [nroReporte, setNroReporte]         = useState(servicioActivo?.nroReporte ?? '');
  const [guardandoRT, setGuardandoRT]       = useState(false);
  const [editandoRT, setEditandoRT]         = useState(false);

  // ── Formulario entrega ──
  const [mostrarFormEntrega, setMostrarFormEntrega] = useState(false);
  const [datosEntrega, setDatosEntrega] = useState({
    trabajos: '', repuestos: [], nroCotizacion: '',
    nroInforme: '', garantia: '12 meses', observaciones: '',
  });
  const [nuevoRepuesto, setNuevoRepuesto] = useState({ codigo: '', descripcion: '', cantidad: 1 });

  // ── Cargar cotizaciones vinculadas al serial ──
  useEffect(() => {
    if (!equipo?.serial) return;
    const cargar = async () => {
      setCargandoCot(true);
      try {
        const data = await obtenerCotizacionesPorSerial(equipo.serial);
        setCotizaciones(data);
      } catch (e) { console.error(e); }
      finally { setCargandoCot(false); }
    };
    cargar();
  }, [equipo?.serial]);

  // ── Guardar N° reporte técnico ──
  const guardarNroReporte = async () => {
    if (!servicioActivo?.id) return;
    setGuardandoRT(true);
    try {
      await actualizarNroReporte(servicioActivo.id, nroReporte);
      setEditandoRT(false);
    } catch (e) { console.error(e); }
    finally { setGuardandoRT(false); }
  };

  const agregarRepuesto = () => {
    if (!nuevoRepuesto.descripcion) return;
    setDatosEntrega(prev => ({ ...prev, repuestos: [...prev.repuestos, { ...nuevoRepuesto }] }));
    setNuevoRepuesto({ codigo: '', descripcion: '', cantidad: 1 });
  };

  const quitarRepuesto = (i) =>
    setDatosEntrega(prev => ({ ...prev, repuestos: prev.repuestos.filter((_, idx) => idx !== i) }));

  // ── Navegar a nueva cotización prellenada ──
  const nuevaCotizacion = () => {
    const params = new URLSearchParams({
      serial:   equipo.serial,
      empresa:  equipo.empresa  ?? '',
      contacto: equipo.contacto ?? '',
    });
    navigate(`/cotizaciones/nueva?${params.toString()}`);
  };

  return (
    <div className={styles.timelineView}>

      {/* ── Barra de acciones ── */}
      <div className={styles.detallTopBar}>
        <button className={styles.btnVolver} onClick={onVolver}>← Volver al listado</button>
        <div className={styles.topAcciones}>
          {servicioActivo && (
            <button className={styles.btnRemision} disabled={generando}
              onClick={() => generarRemision(nroRemision)}>
              {generando ? 'Generando...' : '📄 Remisión recepción'}
            </button>
          )}
          {puedeEntrega && (
            <button className={styles.btnEntrega} onClick={() => setMostrarFormEntrega(v => !v)}>
              {mostrarFormEntrega ? 'Cancelar' : '📋 Remisión entrega'}
            </button>
          )}
          {servicioActivo && (
            <>
              <button className={styles.btnSticker} disabled={generandoSticker}
                onClick={() => descargarPNG(`sticker-${equipo.serial}`)}>
                {generandoSticker ? '...' : '🏷 PNG'}
              </button>
              <button className={styles.btnSticker} disabled={generandoSticker}
                onClick={() => descargarPDF(8, `sticker-${equipo.serial}`)}>
                {generandoSticker ? '...' : '🏷 ×8'}
              </button>
            </>
          )}
          <button className={styles.btnNuevaCot} onClick={nuevaCotizacion}>
            + Nueva cotización
          </button>
        </div>
      </div>

      {/* ── Formulario datos de entrega ── */}
      {mostrarFormEntrega && puedeEntrega && (
        <div className={styles.formEntrega}>
          <h4 className={styles.formEntregaTitulo}>Datos para la remisión de entrega</h4>
          <div className={styles.formEntregaGrid}>
            <div className={styles.formGrupo}>
              <label>N° Cotización</label>
              <input value={datosEntrega.nroCotizacion}
                onChange={e => setDatosEntrega(p => ({ ...p, nroCotizacion: e.target.value }))}
                placeholder="CSA260318XX" className={styles.formInput} />
            </div>
            <div className={styles.formGrupo}>
              <label>N° Informe técnico</label>
              <input value={datosEntrega.nroInforme}
                onChange={e => setDatosEntrega(p => ({ ...p, nroInforme: e.target.value }))}
                placeholder="RT-0001" className={styles.formInput} />
            </div>
            <div className={styles.formGrupo}>
              <label>Garantía</label>
              <select value={datosEntrega.garantia}
                onChange={e => setDatosEntrega(p => ({ ...p, garantia: e.target.value }))}
                className={styles.formInput}>
                {['No aplica','3 meses','6 meses','12 meses','18 meses'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.formGrupo}>
            <label>Trabajos realizados</label>
            <textarea value={datosEntrega.trabajos}
              onChange={e => setDatosEntrega(p => ({ ...p, trabajos: e.target.value }))}
              placeholder="Describe los trabajos realizados..." className={styles.formTextarea} rows={3} />
          </div>
          <div className={styles.formGrupo}>
            <label>Observaciones finales</label>
            <textarea value={datosEntrega.observaciones}
              onChange={e => setDatosEntrega(p => ({ ...p, observaciones: e.target.value }))}
              placeholder="Recomendaciones, condiciones de operación, etc."
              className={styles.formTextarea} rows={2} />
          </div>
          <div className={styles.formGrupo}>
            <label>Repuestos utilizados</label>
            <div className={styles.repuestosRow}>
              <input value={nuevoRepuesto.codigo}
                onChange={e => setNuevoRepuesto(p => ({ ...p, codigo: e.target.value }))}
                placeholder="Código" className={styles.formInputSm} />
              <input value={nuevoRepuesto.descripcion}
                onChange={e => setNuevoRepuesto(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Descripción" className={`${styles.formInput} ${styles.flex1}`} />
              <input type="number" min="1" value={nuevoRepuesto.cantidad}
                onChange={e => setNuevoRepuesto(p => ({ ...p, cantidad: Number(e.target.value) }))}
                className={styles.formInputXs} />
              <button type="button" onClick={agregarRepuesto} className={styles.btnAgregarRep}>+</button>
            </div>
            {datosEntrega.repuestos.length > 0 && (
              <div className={styles.repuestosList}>
                {datosEntrega.repuestos.map((r, i) => (
                  <div key={i} className={styles.repuestoItem}>
                    <span className={styles.repuestoCodigo}>{r.codigo || '—'}</span>
                    <span className={styles.repuestoDesc}>{r.descripcion}</span>
                    <span className={styles.repuestoCant}>×{r.cantidad}</span>
                    <button onClick={() => quitarRepuesto(i)} className={styles.btnQuitarRep}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className={styles.btnGenerarEntrega} disabled={generandoEntrega}
            onClick={() => generarEntrega(`ENT-${servicioActivo.id.slice(-6).toUpperCase()}`)}>
            {generandoEntrega ? 'Generando PDF...' : '⬇ Descargar remisión de entrega'}
          </button>
        </div>
      )}

      {/* ── Tarjeta del equipo ── */}
      <section className={styles.infoCard}>
        <div className={styles.infoBadge}>Detalle de Equipo</div>
        <h2 className={styles.infoModelo}>{equipo.modelo}</h2>
        <div className={styles.infoGrid}>
          {[
            { label: 'Serial',  valor: equipo.serial   },
            { label: 'Empresa', valor: equipo.empresa  },
            { label: 'Código',  valor: equipo.codigo   },
            { label: 'Familia', valor: equipo.familia  },
          ].map(({ label, valor }) => (
            <div key={label} className={styles.infoItem}>
              <span className={styles.infoLabel}>{label}</span>
              <span className={styles.infoValor}>{valor}</span>
            </div>
          ))}
        </div>

        {/* ── Referencias: RT + cotizaciones ── */}
        <div className={styles.referencias}>

          {/* N° Reporte técnico — editable */}
          <div className={styles.refBloque}>
            <span className={styles.refLabel}>Reporte técnico</span>
            {editandoRT ? (
              <div className={styles.refEditRow}>
                <input
                  value={nroReporte}
                  onChange={e => setNroReporte(e.target.value)}
                  placeholder="RT-0001"
                  className={styles.refInput}
                  autoFocus
                />
                <button className={styles.refBtnGuardar} onClick={guardarNroReporte} disabled={guardandoRT}>
                  {guardandoRT ? '...' : '✓'}
                </button>
                <button className={styles.refBtnCancelar} onClick={() => setEditandoRT(false)}>✕</button>
              </div>
            ) : (
              <div className={styles.refValorRow}>
                {nroReporte
                  ? <span className={styles.refBadgeRT}>{nroReporte}</span>
                  : <span className={styles.refVacio}>Sin reporte</span>
                }
                {servicioActivo && !servicioActivo.estadoActual === 'Entregado' || true ? (
                  <button className={styles.refBtnEditar} onClick={() => setEditandoRT(true)}>✎</button>
                ) : null}
              </div>
            )}
          </div>

          {/* Cotizaciones vinculadas */}
          <div className={styles.refBloque}>
            <span className={styles.refLabel}>
              Cotizaciones vinculadas {cargandoCot ? '...' : `(${cotizaciones.length})`}
            </span>
            <div className={styles.cotBadgesRow}>
              {cotizaciones.length === 0 && !cargandoCot && (
                <span className={styles.refVacio}>Sin cotizaciones</span>
              )}
              {cotizaciones.map(cot => {
                const cfg = COT_ESTADO_CFG[cot.estado] ?? COT_ESTADO_CFG['En espera'];
                return (
                  <button
                    key={cot.id}
                    className={styles.cotBadge}
                    style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
                    onClick={() => navigate(`/cotizaciones/${cot.id}`)}
                    title={`${cot.empresa} · ${fmt(cot.totalFinal, cot.moneda)}`}
                  >
                    {cot.nroCotizacion}
                    <span className={styles.cotBadgeEstado}>{cot.estado}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── Panel de repuestos cotizados ── */}
        {cotizaciones.length > 0 && (
          <div className={styles.repuestosPanel}>
            <span className={styles.repuestesPanelTitulo}>Repuestos cotizados</span>
            <div className={styles.repuestosGrid}>
              {cotizaciones.flatMap(cot =>
                (cot.items ?? [])
                  .filter(item => item.codigo)
                  .map((item, i) => ({
                    ...item,
                    _cotEstado: cot.estado,
                    _cotNro:    cot.nroCotizacion,
                    _key:       `${cot.id}-${i}`,
                  }))
              ).map(item => {
                const cfg = COT_ESTADO_CFG[item._cotEstado] ?? COT_ESTADO_CFG['En espera'];
                return (
                  <div key={item._key} className={styles.repuestoCard}>
                    <div className={styles.repuestoCardTop}>
                      <span className={styles.repuestoCardCod}>{item.codigo}</span>
                      <span className={styles.repuestoCardCant}>×{item.cantidad}</span>
                    </div>
                    <p className={styles.repuestoCardDesc}>{item.descripcion}</p>
                    <div className={styles.repuestoCardBottom}>
                      <span className={styles.repuestoCardCot}>{item._cotNro}</span>
                      <span
                        className={styles.repuestoCardEstado}
                        style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
                      >
                        {item._cotEstado}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ── Servicio activo ── */}
      {servicioActivo ? (
        <>
          <h3 className={styles.seccionTitulo}>Servicio actual</h3>
          <ServicioPanel key={servicioActivo.id} servicio={servicioActivo} onActualizar={onActualizar} />
        </>
      ) : (
        <div className={styles.sinServicio}>No hay servicio activo para este equipo.</div>
      )}

      {/* ── Historial ── */}
      {serviciosHistorial.length > 0 && (
        <>
          <h3 className={styles.seccionTitulo}>
            Visitas anteriores ({serviciosHistorial.length})
          </h3>
          {serviciosHistorial.map(s => (
            <ServicioPanel key={s.id} servicio={s} onActualizar={onActualizar} />
          ))}
        </>
      )}

      {/* Plantillas ocultas para PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
        <RemisionRecepcionPDF ref={remisionRef} servicio={servicioActivo} equipo={equipo} />
      </div>
      <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
        <RemisionEntregaPDF ref={entregaRef} servicio={servicioActivo} equipo={equipo} datosEntrega={datosEntrega} />
      </div>
      <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
        <StickerEquipo ref={stickerRef} equipo={equipo} servicio={servicioActivo} />
      </div>

    </div>
  );
};

export default TimelineView;

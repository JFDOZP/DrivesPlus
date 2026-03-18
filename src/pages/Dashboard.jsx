import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerCotizaciones, obtenerServiciosActivos } from '../Firebase/firebaseLogic';
import styles from './Dashboard.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, moneda = 'COP') =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: moneda,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n ?? 0);

const fmtNum = (n) => new Intl.NumberFormat('es-CO').format(n ?? 0);

const MESES_NOMBRES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const diasEnTaller = (ts) => {
  if (!ts) return 0;
  const ms = ts?.seconds != null ? ts.seconds * 1000 : ts?.toMillis?.() ?? null;
  if (!ms) return 0;
  return Math.floor((Date.now() - ms) / 86400000);
};

const fmtFecha = (ts) => {
  if (!ts) return '—';
  const ms = ts?.seconds != null ? ts.seconds * 1000 : ts?.toMillis?.() ?? null;
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Tarjeta de indicador ─────────────────────────────────────────────────────
const KPICard = ({ label, valor, sub, color, moneda }) => (
  <div className={styles.kpiCard}>
    <span className={styles.kpiValor} style={{ color }}>
      {moneda ? fmt(valor, moneda) : fmtNum(valor)}
    </span>
    <span className={styles.kpiLabel}>{label}</span>
    {sub && <span className={styles.kpiSub}>{sub}</span>}
  </div>
);

// ─── Barra de proporción ──────────────────────────────────────────────────────
const BarraProp = ({ segmentos }) => {
  const total = segmentos.reduce((s, x) => s + x.valor, 0);
  if (total === 0) return null;
  return (
    <div className={styles.barraProp}>
      {segmentos.map(seg => (
        <div
          key={seg.label}
          className={styles.barraSegmento}
          style={{ width: `${(seg.valor / total) * 100}%`, background: seg.color }}
          title={`${seg.label}: ${seg.valor}`}
        />
      ))}
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
const Dashboard = () => {
  const { currentUser, isAdmin } = useAuth();

  const hoy     = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(hoy.getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(hoy.getFullYear());

  const [cotizaciones, setCotizaciones] = useState([]);
  const [servicios, setServicios]       = useState([]);
  const [cargando, setCargando]         = useState(true);

  // Generar lista de meses disponibles (últimos 12)
  const mesesDisponibles = useMemo(() => {
    const lista = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      lista.push({ mes: d.getMonth(), anio: d.getFullYear(),
        label: `${MESES_NOMBRES[d.getMonth()]} ${d.getFullYear()}` });
    }
    return lista;
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const cargar = async () => {
      setCargando(true);
      try {
        const [cots, servs] = await Promise.all([
          obtenerCotizaciones(currentUser.uid, isAdmin),
          obtenerServiciosActivos(),
        ]);
        setCotizaciones(cots);
        setServicios(servs);
      } catch (e) { console.error(e); }
      finally { setCargando(false); }
    };
    cargar();
  }, [currentUser, isAdmin]);

  // ── Filtros de mes ──
  const inicioMes = new Date(anioSeleccionado, mesSeleccionado, 1).getTime();
  const finMes    = new Date(anioSeleccionado, mesSeleccionado + 1, 0, 23, 59, 59).getTime();

  // ── COTIZACIONES ──
  // Del mes seleccionado
  const cotMes = useMemo(() =>
    cotizaciones.filter(c => {
      const ms = c.fechaCreacionMs;
      return ms && ms >= inicioMes && ms <= finMes;
    }), [cotizaciones, inicioMes, finMes]);

  // Activas de meses anteriores (En espera, creadas antes del mes actual)
  const cotAnterioresActivas = useMemo(() =>
    cotizaciones.filter(c => {
      const ms = c.fechaCreacionMs;
      return ms && ms < inicioMes && c.estado === 'En espera';
    }), [cotizaciones, inicioMes]);

  // Métricas cotizaciones del mes
  const metricasCot = useMemo(() => {
    const enEspera   = cotMes.filter(c => c.estado === 'En espera');
    const aprobadas  = cotMes.filter(c => c.estado === 'Aprobada');
    const noAprobadas = cotMes.filter(c => c.estado === 'No aprobada');

    const sumar = (arr) => arr.reduce((s, c) => s + (c.totalFinal ?? 0), 0);

    return {
      total:          cotMes.length,
      enEspera:       enEspera.length,
      aprobadas:      aprobadas.length,
      noAprobadas:    noAprobadas.length,
      valorTotal:     sumar(cotMes),
      valorEnEspera:  sumar(enEspera),
      valorAprobadas: sumar(aprobadas),
      valorNoAprobadas: sumar(noAprobadas),
    };
  }, [cotMes]);

  // ── EQUIPOS EN TALLER ──
  const ESTADOS_ACTIVOS = [
    'Ingresado', 'Diagnóstico', 'En espera aprobación',
    'En reparación', 'Listo para entrega',
  ];

  const serviciosActivos = useMemo(() =>
    servicios.filter(s => ESTADOS_ACTIVOS.includes(s.estadoActual)),
    [servicios]);

  const metricasEquipos = useMemo(() => {
    const porEstado = {};
    ESTADOS_ACTIVOS.forEach(e => { porEstado[e] = 0; });
    serviciosActivos.forEach(s => {
      if (porEstado[s.estadoActual] !== undefined) porEstado[s.estadoActual]++;
    });

    // Equipos con cotización asociada — buscar por equipoId en cotizaciones aprobadas
    const serialesConCot = new Set(
      cotizaciones.filter(c => c.serialEquipo && c.estado === 'Aprobada')
        .map(c => c.serialEquipo)
    );
    const conCotAprobada = serviciosActivos.filter(s => serialesConCot.has(s.equipoId)).length;

    // Valor total de cotizaciones aprobadas vinculadas a equipos activos
    const valorCotAprobadas = cotizaciones
      .filter(c => c.serialEquipo && c.estado === 'Aprobada' &&
        serviciosActivos.some(s => s.equipoId === c.serialEquipo))
      .reduce((s, c) => s + (c.totalFinal ?? 0), 0);

    // Top equipos por días en taller
    const topDias = [...serviciosActivos]
      .map(s => ({ ...s, dias: diasEnTaller(s.fechaIngreso) }))
      .sort((a, b) => b.dias - a.dias)
      .slice(0, 8);

    return { porEstado, total: serviciosActivos.length, conCotAprobada, valorCotAprobadas, topDias };
  }, [serviciosActivos, cotizaciones]);

  const COLORES_ESTADO = {
    'Ingresado':            '#1e40af',
    'Diagnóstico':          '#7c3aed',
    'En espera aprobación': '#b45309',
    'En reparación':        '#c2410c',
    'Listo para entrega':   '#166534',
  };

  if (cargando) return <div className={styles.loading}>Cargando dashboard...</div>;

  return (
    <div className={styles.page}>

      {/* ── ENCABEZADO ── */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.titulo}>Dashboard</h1>
          <span className={styles.subtitulo}>Centro de estadísticas</span>
        </div>
        <div className={styles.filtroMes}>
          <label className={styles.filtroLabel}>Período</label>
          <select
            className={styles.selectMes}
            value={`${anioSeleccionado}-${mesSeleccionado}`}
            onChange={e => {
              const [anio, mes] = e.target.value.split('-').map(Number);
              setAnioSeleccionado(anio);
              setMesSeleccionado(mes);
            }}
          >
            {mesesDisponibles.map(m => (
              <option key={m.label} value={`${m.anio}-${m.mes}`}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ════════════════════════════
          SECCIÓN COTIZACIONES
          ════════════════════════════ */}
      <div className={styles.seccionTitulo}>
        <div className={styles.seccionLinea} />
        <span>Cotizaciones — {MESES_NOMBRES[mesSeleccionado]} {anioSeleccionado}</span>
        <div className={styles.seccionLinea} />
      </div>

      {/* KPIs cotizaciones */}
      <div className={styles.kpiGrid}>
        <KPICard label="Total cotizaciones" valor={metricasCot.total} color="#1A1A1A" />
        <KPICard label="Valor total cotizado" valor={metricasCot.valorTotal} color="#1A1A1A" moneda="COP" />
        <KPICard label="En espera" valor={metricasCot.enEspera}
          sub={fmt(metricasCot.valorEnEspera)} color="#b45309" />
        <KPICard label="Aprobadas" valor={metricasCot.aprobadas}
          sub={fmt(metricasCot.valorAprobadas)} color="#166534" />
        <KPICard label="No aprobadas" valor={metricasCot.noAprobadas}
          sub={fmt(metricasCot.valorNoAprobadas)} color="#991b1b" />
      </div>

      {/* Barra de proporción cotizaciones */}
      {metricasCot.total > 0 && (
        <div className={styles.proporcionWrap}>
          <BarraProp segmentos={[
            { label: 'En espera',   valor: metricasCot.enEspera,    color: '#fbbf24' },
            { label: 'Aprobadas',   valor: metricasCot.aprobadas,   color: '#166534' },
            { label: 'No aprobadas',valor: metricasCot.noAprobadas, color: '#DB0100' },
          ]} />
          <div className={styles.leyenda}>
            {[
              { label: 'En espera',    color: '#fbbf24' },
              { label: 'Aprobadas',    color: '#166534' },
              { label: 'No aprobadas', color: '#DB0100' },
            ].map(l => (
              <span key={l.label} className={styles.leyendaItem}>
                <span className={styles.leyendaDot} style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cotizaciones activas de meses anteriores */}
      {cotAnterioresActivas.length > 0 && (
        <div className={styles.alertaAntiguas}>
          <span className={styles.alertaIcon}>⚠</span>
          <div>
            <strong>{cotAnterioresActivas.length} cotización{cotAnterioresActivas.length > 1 ? 'es' : ''} de meses anteriores aún en espera</strong>
            <span className={styles.alertaValor}>
              — Valor acumulado: {fmt(cotAnterioresActivas.reduce((s, c) => s + (c.totalFinal ?? 0), 0))}
            </span>
          </div>
        </div>
      )}

      {/* ════════════════════════════
          SECCIÓN EQUIPOS EN TALLER
          ════════════════════════════ */}
      <div className={styles.seccionTitulo}>
        <div className={styles.seccionLinea} />
        <span>Equipos en taller — estado actual</span>
        <div className={styles.seccionLinea} />
      </div>

      {/* KPIs equipos */}
      <div className={styles.kpiGrid}>
        <KPICard label="Total en taller"       valor={metricasEquipos.total}           color="#1A1A1A" />
        <KPICard label="Ingresados"             valor={metricasEquipos.porEstado['Ingresado']}            color="#1e40af" />
        <KPICard label="En diagnóstico"         valor={metricasEquipos.porEstado['Diagnóstico']}          color="#7c3aed" />
        <KPICard label="Espera aprobación"      valor={metricasEquipos.porEstado['En espera aprobación']} color="#b45309" />
        <KPICard label="En reparación"          valor={metricasEquipos.porEstado['En reparación']}        color="#c2410c" />
        <KPICard label="Listos para entrega"    valor={metricasEquipos.porEstado['Listo para entrega']}   color="#166534" />
        <KPICard label="Con cotiz. aprobada"    valor={metricasEquipos.conCotAprobada}
          sub={fmt(metricasEquipos.valorCotAprobadas)} color="#166534" />
      </div>

      {/* Barra de proporción equipos */}
      {metricasEquipos.total > 0 && (
        <div className={styles.proporcionWrap}>
          <BarraProp segmentos={ESTADOS_ACTIVOS.map(e => ({
            label: e,
            valor: metricasEquipos.porEstado[e],
            color: COLORES_ESTADO[e],
          }))} />
          <div className={styles.leyenda}>
            {ESTADOS_ACTIVOS.map(e => (
              <span key={e} className={styles.leyendaItem}>
                <span className={styles.leyendaDot} style={{ background: COLORES_ESTADO[e] }} />
                {e} ({metricasEquipos.porEstado[e]})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabla equipos con más días en taller */}
      {metricasEquipos.topDias.length > 0 && (
        <div className={styles.tablaCard}>
          <h3 className={styles.tablaCardTitulo}>Equipos con más días en taller</h3>
          <div className={styles.tablaHeader}>
            <span>Serial</span>
            <span>Empresa</span>
            <span>Modelo</span>
            <span>Estado</span>
            <span>Días</span>
          </div>
          {metricasEquipos.topDias.map(s => (
            <div key={s.id} className={styles.tablaFila}>
              <span className={styles.serial}>{s.equipoId}</span>
              <span className={styles.empresa}>{s.empresa}</span>
              <span className={styles.modelo}>{s.modelo}</span>
              <span>
                <span className={styles.estadoBadge}
                  style={{ color: COLORES_ESTADO[s.estadoActual], background: `${COLORES_ESTADO[s.estadoActual]}15`, border: `1px solid ${COLORES_ESTADO[s.estadoActual]}40` }}>
                  {s.estadoActual}
                </span>
              </span>
              <span className={`${styles.dias} ${s.dias > 30 ? styles.diasAlerta : ''}`}>
                {s.dias === 0 ? 'Hoy' : `${s.dias}d`}
              </span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Dashboard;

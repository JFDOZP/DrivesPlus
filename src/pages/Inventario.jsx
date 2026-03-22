import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obtenerServiciosActivos,
  obtenerHistorialEquipo,
  actualizarEstadoServicio,
} from '../Firebase/firebaseLogic';
import TimelineView from './TimeLineView';
import styles from './Inventario.module.css';

// ─── Configuración de estados del flujo ──────────────────────────────────────
export const ESTADOS_SERVICIO = [
  'Ingresado',
  'Diagnóstico',
  'En espera aprobación',
  'En reparación',
  'Listo para entrega',
  'Entregado',
  'Devolución',
];

const ESTADOS_ACTIVOS = ESTADOS_SERVICIO.filter(
  e => e !== 'Entregado' && e !== 'Devolución'
);

const ESTADO_COLORES = {
  'Ingresado':            { color: '#1e40af', bg: '#eff6ff', border: '#93c5fd' },
  'Diagnóstico':          { color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
  'En espera aprobación': { color: '#b45309', bg: '#fff8e1', border: '#fbbf24' },
  'En reparación':        { color: '#c2410c', bg: '#fff7ed', border: '#fdba74' },
  'Listo para entrega':   { color: '#166534', bg: '#f0fdf4', border: '#86efac' },
  'Entregado':            { color: '#374151', bg: '#f9fafb', border: '#d1d5db' },
  'Devolución':           { color: '#991b1b', bg: '#fff5f5', border: '#fca5a5' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const diasEnTaller = (ts) => {
  if (!ts) return '—';
  const ms   = ts?.toMillis?.() ?? ts?.seconds * 1000 ?? null;
  if (!ms) return '—';
  const dias = Math.floor((Date.now() - ms) / 86400000);
  if (dias === 0) return 'Hoy';
  if (dias === 1) return '1 día';
  return `${dias} días`;
};

const fmtFecha = (ts) => {
  if (!ts) return '—';
  const ms = ts?.toMillis?.() ?? (ts?.seconds != null ? ts.seconds * 1000 : null);
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

// ─── Badge de estado ──────────────────────────────────────────────────────────
const EstadoBadge = ({ estado }) => {
  const cfg = ESTADO_COLORES[estado] ?? { color: '#374151', bg: '#f9fafb', border: '#d1d5db' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '0.7rem',
      fontWeight: 700,
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
    }}>
      {estado}
    </span>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
const Inventario = () => {
  const navigate = useNavigate();

  // Vista: 'lista' | 'detalle'
  const [vista, setVista]             = useState('lista');
  const [servicios, setServicios]     = useState([]);
  const [detalle, setDetalle]         = useState(null);   // { equipo, servicios }
  const [cargando, setCargando]       = useState(true);
  const [cargandoDet, setCargandoDet] = useState(false);

  // Filtros
  const [filtroTexto, setFiltroTexto]   = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Activos');

  // ── Carga inicial ──
  useEffect(() => {
    cargarLista();
  }, []);

  const cargarLista = async () => {
    setCargando(true);
    try {
      const data = await obtenerServiciosActivos();
      setServicios(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  // ── Abrir detalle ──
  const abrirDetalle = async (equipoId) => {
    setCargandoDet(true);
    setVista('detalle');
    try {
      const data = await obtenerHistorialEquipo(equipoId);
      setDetalle(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargandoDet(false);
    }
  };

  // ── Actualizar estado desde el timeline ──
  const handleActualizar = async (servicioId, nuevoEstado, nota) => {
    await actualizarEstadoServicio(servicioId, nuevoEstado, nota);
    // Refresca el detalle y la lista
    try {
  const serial = detalle?.equipo?.serial;
  if (serial) {
    const data = await obtenerHistorialEquipo(serial);
    setDetalle(data);
  }
} catch (e) {
  console.error('Error refrescando detalle:', e);
} finally {
  cargarLista();
}
  }

  // ── Filtrado en memoria ──
  const serviciosFiltrados = useMemo(() => {
    return servicios.filter(s => {
      const texto = filtroTexto.toLowerCase();
      const matchTexto =
        !texto ||
        s.equipoId?.toLowerCase().includes(texto) ||
        s.empresa?.toLowerCase().includes(texto) ||
        s.comercial?.toLowerCase().includes(texto);

      const matchEstado =
        filtroEstado === 'Todos' ||
        (filtroEstado === 'Activos' && ESTADOS_ACTIVOS.includes(s.estadoActual)) ||
        s.estadoActual === filtroEstado;

      return matchTexto && matchEstado;
    });
  }, [servicios, filtroTexto, filtroEstado]);

  // ── Indicadores ──
  const resumen = useMemo(() => ({
    total:    servicios.length,
    activos:  servicios.filter(s => ESTADOS_ACTIVOS.includes(s.estadoActual)).length,
    listos:   servicios.filter(s => s.estadoActual === 'Listo para entrega').length,
    espera:   servicios.filter(s => s.estadoActual === 'En espera aprobación').length,
  }), [servicios]);

  // ══════════════════════════════════════════
  // VISTA DETALLE
  // ══════════════════════════════════════════
  if (vista === 'detalle') {
    return (
      <div className={styles.page}>
        {cargandoDet ? (
          <div className={styles.loading}>Cargando equipo...</div>
        ) : detalle ? (
          <TimelineView
            resultado={detalle}
            onVolver={() => { setVista('lista'); setDetalle(null); }}
            onActualizar={handleActualizar}
          />
        ) : (
          <div className={styles.loading}>Equipo no encontrado.</div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════
  // VISTA LISTA
  // ══════════════════════════════════════════
  return (
    <div className={styles.page}>

      {/* ── ENCABEZADO ── */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.titulo}>Inventario de Taller</h1>
        </div>
        <button
          className={styles.btnNuevo}
          onClick={() => navigate('/equipos')}
        >
          + Nuevo ingreso
        </button>
      </div>

      {/* ── INDICADORES ── */}
      <div className={styles.indicadores}>
        {[
          { label: 'Total registros', valor: resumen.total,   color: '#1A1A1A' },
          { label: 'En taller',       valor: resumen.activos, color: '#1e40af' },
          { label: 'Listos entrega',  valor: resumen.listos,  color: '#166534' },
          { label: 'En espera apro.', valor: resumen.espera,  color: '#b45309' },
        ].map(({ label, valor, color }) => (
          <div key={label} className={styles.indicadorCard}>
            <span className={styles.indicadorValor} style={{ color }}>{valor}</span>
            <span className={styles.indicadorLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── FILTROS ── */}
      <div className={styles.filtros}>
        <input
          type="text"
          placeholder="Buscar por serial, empresa o comercial..."
          value={filtroTexto}
          onChange={e => setFiltroTexto(e.target.value)}
          className={styles.inputFiltro}
        />
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className={styles.selectFiltro}
        >
          <option value="Activos">En taller (activos)</option>
          <option value="Todos">Todos los estados</option>
          {ESTADOS_SERVICIO.map(e => <option key={e}>{e}</option>)}
        </select>
        {(filtroTexto || filtroEstado !== 'Activos') && (
          <button
            className={styles.btnLimpiar}
            onClick={() => { setFiltroTexto(''); setFiltroEstado('Activos'); }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* ── TABLA HEADER ── */}
      {!cargando && serviciosFiltrados.length > 0 && (
        <div className={styles.tablaHeader}>
          <span>Serial</span>
          <span>Empresa</span>
          <span>Modelo</span>
          <span>Fecha ingreso</span>
          <span>Días</span>
          <span>Estado</span>
        </div>
      )}

      {/* ── LISTA ── */}
      {cargando ? (
        <div className={styles.loading}>Cargando equipos...</div>
      ) : serviciosFiltrados.length === 0 ? (
        <div className={styles.empty}>
          {servicios.length === 0
            ? 'No hay equipos registrados aún.'
            : 'Sin resultados para los filtros aplicados.'}
        </div>
      ) : (
        <div className={styles.lista}>
          {serviciosFiltrados.map(s => (
            <div
              key={s.id}
              className={styles.fila}
              onClick={() => abrirDetalle(s.equipoId)}
            >
              <span className={styles.serial}>{s.equipoId}</span>
              <span className={styles.empresa}>{s.empresa}</span>
              <span className={styles.modelo}>{s.modelo}</span>
              <span className={styles.fecha}>{fmtFecha(s.fechaIngreso)}</span>
              <span className={styles.dias}>{diasEnTaller(s.fechaIngreso)}</span>
              <span><EstadoBadge estado={s.estadoActual} /></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inventario;

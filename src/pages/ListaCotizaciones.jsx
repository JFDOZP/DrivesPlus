import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerCotizaciones, actualizarEstadoCotizacion } from '../Firebase/firebaseLogic';
import EstadisticasServicio from './EstadisticasServicio';
import styles from './ListaCotizaciones.module.css';

// ─── Configuración de estados ─────────────────────────────────────────────────
const ESTADOS = ['En espera', 'Aprobada', 'No aprobada'];

const ESTADO_CONFIG = {
  'En espera': { color: '#b45309', bg: '#fff8e1', border: '#fbbf24' },
  'Aprobada': { color: '#166534', bg: '#f0fdf4', border: '#86efac' },
  'No aprobada': { color: '#991b1b', bg: '#fff5f5', border: '#fca5a5' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const diasDesde = (ms) => {
  if (!ms) return '—';
  const diff = Date.now() - ms;
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (dias === 0) return 'Hoy';
  if (dias === 1) return '1 día';
  return `${dias} días`;
};

const fmt = (n, moneda = 'COP') =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: moneda,
    minimumFractionDigits: moneda === 'COP' ? 0 : 2,
    maximumFractionDigits: moneda === 'COP' ? 0 : 2,
  }).format(n ?? 0);

const fmtFecha = (ms) => {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const fmtFechaHora = (ms) => {
  if (!ms) return '—';
  return new Date(ms).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};
// ─── Badge de estado ──────────────────────────────────────────────────────────
const EstadoBadge = ({ estado }) => {
  const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG['En espera'];
  return (
    <span className={styles.badge} style={{
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.border}`,
    }}>
      {estado}
    </span>
  );
};

// ─── Selector de estado (inline en la tarjeta) ────────────────────────────────
const SelectorEstado = ({ cotizacionId, estadoActual, onCambio }) => {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);

  const cambiar = async (nuevoEstado) => {
    if (nuevoEstado === estadoActual) { setAbierto(false); return; }
    setCargando(true);
    try {
      await actualizarEstadoCotizacion(cotizacionId, nuevoEstado);
      onCambio(cotizacionId, nuevoEstado);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
      setAbierto(false);
    }
  };

  return (
    <div className={styles.selectorWrap}>
      <button
        className={styles.selectorBtn}
        onClick={e => { e.stopPropagation(); setAbierto(v => !v); }}
        disabled={cargando}
      >
        <EstadoBadge estado={estadoActual} />
        <span className={styles.chevron}>{abierto ? '▲' : '▼'}</span>
      </button>

      {abierto && (
        <div className={styles.dropdown} onClick={e => e.stopPropagation()}>
          {ESTADOS.map(e => (
            <button
              key={e}
              className={`${styles.dropItem} ${e === estadoActual ? styles.dropItemActive : ''}`}
              onClick={() => cambiar(e)}
            >
              <EstadoBadge estado={e} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
const ListaCotizaciones = () => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [tabActivo, setTabActivo] = useState('lista'); // 'lista' | 'estadisticas'

  useEffect(() => {
    const cargar = async () => {
      if (!currentUser) return;
      setCargando(true);
      try {
        const data = await obtenerCotizaciones(currentUser.uid, isAdmin);
        setCotizaciones(data);
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [currentUser, isAdmin]);

  // Actualiza el estado local sin recargar Firestore
  const handleCambioEstado = (id, nuevoEstado) => {
    setCotizaciones(prev =>
      prev.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c)
    );
  };

  // Filtrado en memoria
  const filtradas = useMemo(() => {
    return cotizaciones.filter(c => {
      const matchEmpresa = c.empresa?.toLowerCase().includes(filtroEmpresa.toLowerCase());
      const matchEstado = filtroEstado === 'Todos' || c.estado === filtroEstado;
      return matchEmpresa && matchEstado;
    });
  }, [cotizaciones, filtroEmpresa, filtroEstado]);

  // Indicadores resumen
  const resumen = useMemo(() => ({
    total: cotizaciones.length,
    enEspera: cotizaciones.filter(c => c.estado === 'En espera').length,
    aprobadas: cotizaciones.filter(c => c.estado === 'Aprobada').length,
    noAprobadas: cotizaciones.filter(c => c.estado === 'No aprobada').length,
  }), [cotizaciones]);

  return (
    <div className={styles.page}>

      {/* ── ENCABEZADO ── */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.titulo}>Cotizaciones</h1>
          {isAdmin && (
            <span className={styles.adminBadge}>Vista admin — todas las cotizaciones</span>
          )}
        </div>
        <button
          className={styles.btnNueva}
          onClick={() => navigate('/cotizaciones/nueva')}
        >
          + Nueva cotización
        </button>
      </div>

      {/* ── TABS ── */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tabActivo === 'lista' ? styles.tabActivo : ''}`}
          onClick={() => setTabActivo('lista')}
        >
          Cotizaciones
        </button>
        <button
          className={`${styles.tab} ${tabActivo === 'estadisticas' ? styles.tabActivo : ''}`}
          onClick={() => setTabActivo('estadisticas')}
        >
          Estadísticas
        </button>
      </div>

      {tabActivo === 'estadisticas' ? (
        <EstadisticasServicio cotizaciones={cotizaciones} />
      ) : (<>

        {/* ── INDICADORES ── */}
        <div className={styles.indicadores}>
          {[
            { label: 'Total', valor: resumen.total, color: '#1A1A1A' },
            { label: 'En espera', valor: resumen.enEspera, color: '#b45309' },
            { label: 'Aprobadas', valor: resumen.aprobadas, color: '#166534' },
            { label: 'No aprobadas', valor: resumen.noAprobadas, color: '#991b1b' },
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
            placeholder="Buscar por empresa..."
            value={filtroEmpresa}
            onChange={e => setFiltroEmpresa(e.target.value)}
            className={styles.inputFiltro}
          />
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className={styles.selectFiltro}
          >
            <option value="Todos">Todos los estados</option>
            {ESTADOS.map(e => <option key={e}>{e}</option>)}
          </select>
          {(filtroEmpresa || filtroEstado !== 'Todos') && (
            <button
              className={styles.btnLimpiar}
              onClick={() => { setFiltroEmpresa(''); setFiltroEstado('Todos'); }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* ── TABLA HEADER ── */}
        {!cargando && filtradas.length > 0 && (
          <div className={styles.tablaHeader}>
            <span>N° Cotización</span>
            <span>Empresa</span>
            <span>Fecha</span>
            <span>Valor total</span>
            <span>Antigüedad</span>
            <span>Estado</span>
            {isAdmin && <span>Creado por</span>}
          </div>
        )}

        {/* ── LISTA ── */}
        {cargando ? (
          <div className={styles.loading}>Cargando cotizaciones...</div>
        ) : filtradas.length === 0 ? (
          <div className={styles.empty}>
            {cotizaciones.length === 0
              ? 'No hay cotizaciones aún. ¡Crea la primera!'
              : 'Sin resultados para los filtros aplicados.'}
          </div>
        ) : (
          <div className={styles.lista}>
            {filtradas.map(cot => (
              <div
                key={cot.id}
                className={styles.fila}
                onClick={() => navigate(`/cotizaciones/${cot.id}`)}
              >
                <span className={styles.nroCot}>{cot.nroCotizacion}</span>
                <span className={styles.empresa}>{cot.empresa}</span>
                <span className={styles.fecha}>{fmtFecha(cot.fechaCreacionMs)}</span>
                <span className={styles.valor}>{fmt(cot.totalFinal, cot.moneda)}</span>
                <span className={styles.antiguedad}>{diasDesde(cot.fechaCreacionMs)}</span>
                {/* Selector de estado — stopPropagation para no navegar al clic */}
                <div onClick={e => e.stopPropagation()}>
                  <SelectorEstado
                    cotizacionId={cot.id}
                    estadoActual={cot.estado}
                    onCambio={handleCambioEstado}
                  />
                </div>

                {isAdmin && (
                  <div className={styles.creadoPorBloque}>
                    <span className={styles.creadoPorNombre}>{cot.creadoPor || cot.uid || '—'}</span>

                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
      )}


    </div>
  );
};

export default ListaCotizaciones;

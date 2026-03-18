import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerCotizacion, actualizarEstadoCotizacion } from '../Firebase/firebaseLogic';
import { usePDF } from '../hooks/usePDF';
import CotizacionPDF from './CotizacionPDF';
import styles from './DetalleCotizacion.module.css';

const ESTADOS = ['En espera', 'Aprobada', 'No aprobada'];

const ESTADO_CONFIG = {
  'En espera':   { color: '#b45309', bg: '#fff8e1', border: '#fbbf24' },
  'Aprobada':    { color: '#166534', bg: '#f0fdf4', border: '#86efac' },
  'No aprobada': { color: '#991b1b', bg: '#fff5f5', border: '#fca5a5' },
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
    day: '2-digit', month: 'long', year: 'numeric',
  });
};

const DetalleCotizacion = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { isAdmin, currentUser } = useAuth();

  const [cotizacion, setCotizacion] = useState(null);
  const [cargando, setCargando]     = useState(true);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [error, setError]           = useState('');

  const { pdfRef, generarPDF, generando } = usePDF();

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerCotizacion(id);
        if (!data) { setError('Cotización no encontrada.'); return; }

        // Seguridad: usuario solo puede ver sus propias cotizaciones
        if (!isAdmin && data.uid !== currentUser?.uid) {
          setError('No tienes permiso para ver esta cotización.');
          return;
        }

        // Normalizar fechaCreacion para el PDF
        setCotizacion({
          ...data,
          fechaCreacionMs: data.fechaCreacion?.toMillis?.() ?? null,
        });
      } catch (e) {
        setError('Error al cargar la cotización.');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id, isAdmin, currentUser]);

  const cambiarEstado = async (nuevoEstado) => {
    if (nuevoEstado === cotizacion.estado) return;
    setCambiandoEstado(true);
    try {
      await actualizarEstadoCotizacion(id, nuevoEstado);
      setCotizacion(prev => ({ ...prev, estado: nuevoEstado }));
    } catch (e) {
      console.error(e);
    } finally {
      setCambiandoEstado(false);
    }
  };

  if (cargando) return <div className={styles.loading}>Cargando cotización...</div>;
  if (error)    return <div className={styles.errorPage}>{error}</div>;
  if (!cotizacion) return null;

  const cfg = ESTADO_CONFIG[cotizacion.estado] ?? ESTADO_CONFIG['En espera'];
  const fechaMs = cotizacion.fechaCreacionMs;

  return (
    <div className={styles.page}>

      {/* ── BARRA SUPERIOR ── */}
      <div className={styles.topBar}>
        <button className={styles.btnVolver} onClick={() => navigate('/cotizaciones')}>
          ← Volver
        </button>

        <div className={styles.topCenter}>
          <span className={styles.nroCot}>{cotizacion.nroCotizacion}</span>
          <span className={styles.fechaCot}>{fmtFecha(fechaMs)}</span>
        </div>

        <div className={styles.topActions}>
          {/* Selector de estado */}
          <div className={styles.estadoGroup}>
            <span className={styles.estadoLabel}>Estado:</span>
            <select
              value={cotizacion.estado}
              onChange={e => cambiarEstado(e.target.value)}
              disabled={cambiandoEstado}
              className={styles.estadoSelect}
              style={{ color: cfg.color, borderColor: cfg.border, background: cfg.bg }}
            >
              {ESTADOS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>

          <button
            className={styles.btnPDF}
            disabled={generando}
            onClick={() => generarPDF(cotizacion.nroCotizacion)}
          >
            {generando ? 'Generando...' : '⬇ Descargar PDF'}
          </button>
        </div>
      </div>

      {/* ── RESUMEN RÁPIDO ── */}
      <div className={styles.resumen}>
        <div className={styles.resumenItem}>
          <span className={styles.resumenLabel}>Empresa</span>
          <span className={styles.resumenValor}>{cotizacion.empresa}</span>
        </div>
        <div className={styles.resumenItem}>
          <span className={styles.resumenLabel}>Contacto</span>
          <span className={styles.resumenValor}>{cotizacion.contacto}</span>
        </div>
        <div className={styles.resumenItem}>
          <span className={styles.resumenLabel}>Moneda</span>
          <span className={styles.resumenValor}>{cotizacion.moneda}</span>
        </div>
        <div className={styles.resumenItem}>
          <span className={styles.resumenLabel}>Total</span>
          <span className={`${styles.resumenValor} ${styles.resumenTotal}`}>
            {fmt(cotizacion.totalFinal, cotizacion.moneda)}
          </span>
        </div>
        {isAdmin && cotizacion.creadoPor && (
          <div className={styles.resumenItem}>
            <span className={styles.resumenLabel}>Creado por</span>
            <span className={styles.resumenValor}>{cotizacion.creadoPor}</span>
          </div>
        )}
      </div>

      {/* ── VISTA PDF ── */}
      <div className={styles.pdfViewer}>
        <div className={styles.pdfInner}>
          <CotizacionPDF ref={pdfRef} cotizacion={cotizacion} />
        </div>
      </div>

    </div>
  );
};

export default DetalleCotizacion;

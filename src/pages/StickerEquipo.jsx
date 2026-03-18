import React from 'react';
import styles from './StickerEquipo.module.css';

/**
 * Sticker de señalización de equipo.
 * Tamaño: 9cm × 5cm (tarjeta de crédito aprox.)
 * Se captura con html2canvas igual que los PDF.
 *
 * Props:
 *   equipo   — documento de la colección equipos
 *   servicio — servicio activo (para estado y fecha)
 */

const fmtFechaCorta = (ts) => {
  if (!ts) return '—';
  const ms =
    ts?.toMillis?.() ??
    (ts?.seconds != null ? ts.seconds * 1000 : null) ??
    (typeof ts === 'string' ? new Date(ts).getTime() : null);
  if (!ms) return '—';
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

const ESTADO_COLORES = {
  'Ingresado':            { bg: '#dbeafe', text: '#1e3a8a', borde: '#3b82f6' },
  'Diagnóstico':          { bg: '#ede9fe', text: '#4c1d95', borde: '#7c3aed' },
  'En espera aprobación': { bg: '#fef3c7', text: '#78350f', borde: '#f59e0b' },
  'En reparación':        { bg: '#ffedd5', text: '#7c2d12', borde: '#f97316' },
  'Listo para entrega':   { bg: '#dcfce7', text: '#14532d', borde: '#22c55e' },
  'Entregado':            { bg: '#f3f4f6', text: '#374151', borde: '#9ca3af' },
  'Devolución':           { bg: '#fee2e2', text: '#7f1d1d', borde: '#ef4444' },
};

const StickerEquipo = React.forwardRef(({ equipo, servicio }, ref) => {
  if (!equipo) return null;

  const estado   = servicio?.estadoActual ?? 'Ingresado';
  const cfg      = ESTADO_COLORES[estado] ?? ESTADO_COLORES['Ingresado'];
  const fecha    = fmtFechaCorta(servicio?.fechaIngreso);
  const modelo   = equipo.modelo ?? '';
  // Truncar modelo para que quepa en el sticker
  const modeloCorto = modelo.length > 55 ? modelo.slice(0, 52) + '…' : modelo;

  return (
    <div ref={ref} className={styles.sticker}>

      {/* Franja superior roja con logo */}
      <div className={styles.header}>
        <span className={styles.logoText}>DrivesPlus</span>
        <span className={styles.headerSub}>Centro de Servicio</span>
      </div>

      {/* Estado — color dinámico */}
      <div
        className={styles.estadoBar}
        style={{ background: cfg.bg, borderColor: cfg.borde }}
      >
        <span className={styles.estadoDot} style={{ background: cfg.borde }} />
        <span className={styles.estadoTexto} style={{ color: cfg.text }}>
          {estado.toUpperCase()}
        </span>
      </div>

      {/* Cuerpo principal */}
      <div className={styles.body}>

        {/* Serial — elemento más prominente */}
        <div className={styles.serialBloque}>
          <span className={styles.serialLabel}>S/N</span>
          <span className={styles.serialValor}>{equipo.serial}</span>
        </div>

        {/* Modelo */}
        <div className={styles.modeloBloque}>
          <span className={styles.modeloTexto}>{modeloCorto}</span>
        </div>

        {/* Fila inferior: código + fecha */}
        <div className={styles.infoRow}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Código</span>
            <span className={styles.infoValor}>{equipo.codigo || '—'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Ingreso</span>
            <span className={styles.infoValor}>{fecha}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Motivo</span>
            <span className={styles.infoValor}>{servicio?.motivo || '—'}</span>
          </div>
        </div>
      </div>

      {/* Pie con empresa cliente */}
      <div className={styles.footer}>
        <span className={styles.footerEmpresa}>{equipo.empresa}</span>
      </div>

    </div>
  );
});

StickerEquipo.displayName = 'StickerEquipo';
export default StickerEquipo;

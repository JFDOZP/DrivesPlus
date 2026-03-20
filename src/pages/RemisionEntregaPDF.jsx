import React from 'react';

import styles from './RemisionPDF.module.css';

const fmtFecha = (ts) => {
  if (!ts) return '—';
  const ms =
    ts?.toMillis?.() ??
    (ts?.seconds != null ? ts.seconds * 1000 : null) ??
    (typeof ts === 'string' ? new Date(ts).getTime() : null);
  if (!ms || isNaN(ms)) return '—';
  return new Date(ms).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
};

const fmtFechaCorta = (ts) => {
  if (!ts) return '';
  const ms =
    ts?.toMillis?.() ??
    (ts?.seconds != null ? ts.seconds * 1000 : null) ??
    (typeof ts === 'string' ? new Date(ts).getTime() : null);
  if (!ms) return '';
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const nroEntrega = (servicioId) =>
  `ENT-${servicioId?.slice(-6).toUpperCase() ?? '000000'}`;

/**
 * Remisión de Entrega — se genera cuando el equipo sale del taller.
 *
 * Props:
 *   servicio   — documento de la colección servicios
 *   equipo     — documento de la colección equipos
 *   datosEntrega — { trabajos, repuestos, nroCotizacion, nroInforme, garantia, observaciones }
 */
const RemisionEntregaPDF = React.forwardRef(({ servicio, equipo, datosEntrega = {} }, ref) => {
  if (!servicio || !equipo) return null;

  const nro = nroEntrega(servicio.id);
  const hoy = fmtFecha(null) === '—' ? new Date() : null; // fecha actual para entrega
  const fechaHoy = fmtFechaCorta({ toMillis: () => Date.now() });
  const fechaEntrega = fmtFecha({ toMillis: () => Date.now() });

  const {
    trabajos = '',
    repuestos = [],   // [{ codigo, descripcion, cantidad }]
    nroCotizacion = '',
    nroInforme = '',
    garantia = '—',
    observaciones = '',
  } = datosEntrega;

  return (
    <div ref={ref} className={styles.pagina}>
      <div className={styles.cuerpoContenido}>
        {/* ── ENCABEZADO  */}

        <div className={styles.empresaDatos}>
          <div className={styles.containerEmpresa}>
            <span className={styles.nombreEmpresa}>DrivesPlus S.A.S.</span>
            <span className={styles.datoEmpresa}>NIT: 901.566.348-5</span>
            <span className={styles.datoEmpresa}>Calle 46 # 69 - 39</span>
            <span className={styles.datoEmpresa}>Medellín, Colombia</span>
            <span className={styles.datoEmpresa}>www.drivesplus.com.co</span>
          </div>
          <img className={styles.logo} src="/logo.png" alt="DrivesPlus Logo" />

        </div>
        <div className={styles.header}>
          <div className={styles.cotFecha}>
            <span className={styles.cotLabel}>FECHA DE ENTREGA</span>
            <span className={styles.cotValor}>{fechaEntrega}</span>
          </div>

          <div className={styles.cotNro}>
            <span className={styles.cotLabel}>REMISIÓN DE ENTREGA N°</span>
            <span className={styles.cotValor}>{nro}</span>
          </div>
        </div>
      </div>
      <div className={styles.lineaRoja} />

      {/* REFERENCIAS */}
      {(nroCotizacion || nroInforme) && (
        <div className={styles.referencias}>
          {nroCotizacion && (
            <div className={styles.refItem}>
              <span className={styles.refLabel}>Cotización N°:</span>
              <span className={styles.refValor}>{nroCotizacion}</span>
            </div>
          )}
          {nroInforme && (
            <div className={styles.refItem}>
              <span className={styles.refLabel}>Informe técnico N°:</span>
              <span className={styles.refValor}>{nroInforme}</span>
            </div>
          )}
          {servicio.motivo && (
            <div className={styles.refItem}>
              <span className={styles.refLabel}>Motivo de ingreso:</span>
              <span className={styles.refValor}>{servicio.motivo}</span>
            </div>
          )}
        </div>
      )}

      {/* CLIENTE */}
      <div className={styles.seccion}>
        <div className={styles.seccionTitulo}>CLIENTE</div>
        <div className={styles.clienteGrid}>
          {[
            { label: 'Empresa:', valor: equipo.empresa },
            { label: 'Contacto:', valor: equipo.contacto },
            { label: 'Comercial:', valor: equipo.comercial || '—' },
          ].map(({ label, valor }) => (
            <div key={label} className={styles.clienteRow}>
              <span className={styles.clienteLabel}>{label}</span>
              <span className={styles.clienteValor}>{valor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* EQUIPO */}
      <div className={styles.seccion}>
        <div className={styles.seccionTitulo}>EQUIPO ENTREGADO</div>
        <table className={styles.tabla}>
          <thead>
            <tr className={styles.tablaHeader}>
              <th style={{ width: '90px', padding: '7px 6px' }}>Código</th>
              <th style={{ padding: '7px 6px' }}>Descripción / Modelo</th>
              <th style={{ width: '120px', padding: '7px 6px' }}>Serial</th>
            </tr>
          </thead>
          <tbody>
            <tr className={styles.trPar}>
              <td className={styles.tdCodigo}>
                <span className={styles.codigoTag}>{equipo.codigo || '—'}</span>
              </td>
              <td style={{ padding: '7px 6px', fontSize: '11px', lineHeight: 1.4 }}>
                <strong style={{ display: 'block', marginBottom: '2px' }}>
                  {equipo.familia}
                </strong>
                {equipo.modelo}
              </td>
              <td style={{ padding: '7px 6px', fontFamily: 'Courier New, monospace', fontSize: '11px', fontWeight: 700 }}>
                {equipo.serial}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* TRABAJOS */}
      <div className={styles.seccion}>
        <div className={styles.seccionTitulo}>TRABAJOS REALIZADOS</div>
        <div className={styles.observacionesBox}>
          {trabajos
            ? <p className={styles.observacionesTexto}>{trabajos}</p>
            : <div className={styles.lineasVacias}>
              {[...Array(3)].map((_, i) => <div key={i} className={styles.lineaVacia} />)}
            </div>
          }
        </div>
      </div>

      {/* REPUESTOS */}
      {repuestos.length > 0 && (
        <div className={styles.seccion}>
          <div className={styles.seccionTitulo}>REPUESTOS UTILIZADOS</div>
          <table className={styles.tabla}>
            <thead>
              <tr className={styles.tablaHeader}>
                <th style={{ width: '90px', padding: '6px' }}>Código</th>
                <th style={{ padding: '6px' }}>Descripción</th>
                <th style={{ width: '50px', padding: '6px', textAlign: 'center' }}>Cant.</th>
              </tr>
            </thead>
            <tbody>
              {repuestos.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? styles.trPar : styles.trImpar}>
                  <td className={styles.tdCodigo}>
                    <span className={styles.codigoTag}>{r.codigo || '—'}</span>
                  </td>
                  <td style={{ padding: '6px', fontSize: '11px' }}>{r.descripcion}</td>
                  <td className={styles.tdCant} style={{ fontSize: '11px', fontWeight: 700 }}>
                    {r.cantidad}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* GARANTIA */}
      <div className={styles.seccion}>
        <div className={styles.seccionTitulo}>GARANTÍA</div>
        <div className={styles.garantiaBox}>
          <span className={styles.garantiaValor}>{garantia}</span>
        </div>
      </div>

      {/* OBSERVACIONES */}
      {observaciones && (
        <div className={styles.seccion}>
          <div className={styles.seccionTitulo}>OBSERVACIONES</div>
          <div className={styles.observacionesBox}>
            <p className={styles.observacionesTexto}>{observaciones}</p>
          </div>
        </div>
      )}

      {/* FIRMAS */}
      <div className={styles.firmasGrid}>
        <div className={styles.firmaBloque}>
          <p className={styles.firmaTitulo}>Técnico Responsable</p>
          <p className={styles.firmaDetalle}>DrivesPlus S.A.S.</p>
          <p className={styles.firmaDetalle}>Fecha: {fechaHoy}</p>
        </div>

        <div className={styles.firmaBloque}>
          <p className={styles.firmaTitulo}>Recibido por / Cliente</p>
          <p className={styles.firmaDetalle}>{equipo.empresa}</p>
        </div>
      </div>

      {/* FOOTER */}
      <div className={styles.footer}>
        <span>DrivesPlus — Centro de Servicio Autorizado Danfoss</span>
        <span>{nro} · {fechaHoy}</span>
        <span>Copia cliente</span>
      </div>

    </div>
  );
});

RemisionEntregaPDF.displayName = 'RemisionEntregaPDF';
export default RemisionEntregaPDF;

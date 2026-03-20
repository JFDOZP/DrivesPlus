import React from 'react';
//import styles from './CotizacionPDF.module.css';  // reutiliza el mismo CSS
import styles from './RemisionPDF.module.css';  // estilos específicos de remisión

/**
 * Plantilla de Remisión de Recepción.
 * Se renderiza fuera de pantalla y se captura con html2canvas + jsPDF.
 * Recibe el objeto `servicio` (de la colección servicios) y
 * `equipo` (de la colección equipos) con los datos del ingreso.
 */

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

// Genera el número de remisión desde el ID del servicio
const nroRemision = (servicioId) =>
  `REM-${servicioId?.slice(-6).toUpperCase() ?? '000000'}`;

const RemisionRecepcionPDF = React.forwardRef(({ servicio, equipo }, ref) => {
  if (!servicio || !equipo) return null;

  const nro = nroRemision(servicio.id);
  const fecha = fmtFecha(servicio.fechaIngreso);
  const fechaDoc = fmtFechaCorta(servicio.fechaIngreso);

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
            <span className={styles.cotLabel}>FECHA</span>
            <span className={styles.cotValor}>{fecha}</span>
          </div>
          <div className={styles.cotNro}>
            <span className={styles.cotLabel}>COTIZACIÓN N°</span>
            <span className={styles.cotValor}>{nro}</span>
          </div>
        </div>
      </div>
      <div className={styles.lineaRoja} />

      {/* ── DATOS DEL CLIENTE ── */}
      <div className={styles.seccion}>
        <div className={styles.seccionTitulo}>DATOS DEL CLIENTE</div>
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

      {/* ── EQUIPO RECIBIDO ── */}
      <div className={styles.seccion}>
        <div className={styles.seccionTitulo}>EQUIPO RECIBIDO</div>
        <table className={styles.tabla}>
          <thead>
            <tr className={styles.tablaHeader}>
              <th className={styles.thCodigo}>Código</th>
              <th className={styles.thDescripcion}>Descripción / Modelo</th>
              <th className={styles.thSerial}>Serial</th>
              <th className={styles.thMotivo}>Motivo</th>
            </tr>
          </thead>

          <tbody>
            <tr className={styles.trPar}>
              <td className={styles.tdCodigo}>
                <span className={styles.codigoTag}>
                  {equipo.codigo || '—'}
                </span>
              </td>

              <td className={styles.tdDescripcion}>
                <strong className={styles.descripcionTitulo}>
                  {equipo.familia}
                </strong>
                {equipo.modelo}
              </td>

              <td className={styles.tdSerial}>
                {equipo.serial}
              </td>

              <td className={styles.tdMotivo}>
                {servicio.motivo}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── ESTADO FÍSICO / OBSERVACIONES ── */}
      <div className={styles.seccion}>
        <div className={styles.seccionTitulo}>ESTADO FÍSICO DEL EQUIPO / OBSERVACIONES</div>
        <div className={styles.observacionesBox}>
          {servicio.observacionesIngreso
            ? <p className={styles.observacionesTexto}>{servicio.observacionesIngreso}</p>
            : (
              /* Líneas vacías para que el técnico las llene a mano */
              <div className={styles.lineasVacias}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={styles.lineaVacia} />
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* ── CONDICIONES DE SERVICIO ── */}
      <div className={styles.seccion}>
        <div className={styles.seccionTitulo}>CONDICIONES DE SERVICIO</div>
        <div className={styles.condicionesLista}>

          <p className={styles.condicion}>
            • Se emitirá un informe técnico y/o cotización antes de proceder con la reparación.
          </p>
          <p className={styles.condicion}>
            • El tiempo de diagnóstico estimado es de 3 a 5 días hábiles.
          </p>
        </div>
      </div>
          {/* ── FIRMAS + FOOTER ── */}
<div className={styles.seccionFinal}>
  <div className={styles.firmasGrid}>
    <div className={styles.firmaBloque}>
      <p className={styles.firmaTitulo}>Especialista Autorizado</p>
      <p className={styles.firmaDetalle}>DrivesPlus S.A.S.</p>
    </div>
    <div className={styles.firmaBloque}>
      <p className={styles.firmaTitulo}>Cliente / Autorizado</p>
      <p className={styles.firmaDetalle}>{equipo.empresa}</p>
    </div>
  </div>

  <div className={styles.footer}>
    <span>DrivesPlus — Centro de Servicio Autorizado Danfoss</span>
    <span>{nro} · {fechaDoc}</span>
    <span>Copia cliente</span>
  </div>
</div>

      

    </div>
  );
});

RemisionRecepcionPDF.displayName = 'RemisionRecepcionPDF';
export default RemisionRecepcionPDF;

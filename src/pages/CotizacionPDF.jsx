import React from 'react';
import styles from './CotizacionPDF.module.css';

const fmt = (n, moneda = 'COP') =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: moneda === 'COP' ? 0 : 2,
    maximumFractionDigits: moneda === 'COP' ? 0 : 2,
  }).format(n);


const fmtFecha = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const CotizacionPDF = React.forwardRef(({ cotizacion }, ref) => {
  if (!cotizacion) return null;

  const {
    nroCotizacion, fecha, moneda,
    empresa, contacto, email, telefono, ciudad,
    items = [],
    subtotal = 0, descuentoGlobal = 0, descuentoMonto = 0, totalFinal = 0,
    garantia, formaPago, validez, tiempoEntrega, impuestos, observaciones, firmante = {}
  } = cotizacion;

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
            <span className={styles.cotValor}>{fmtFecha(fecha)}</span>
          </div>
          <div className={styles.cotNro}>
            <span className={styles.cotLabel}>COTIZACIÓN N°</span>
            <span className={styles.cotValor}>{nroCotizacion}</span>
          </div>
        </div>

        <div className={styles.lineaRoja} />

        {/* ── DATOS CLIENTE ── */}
        <div className={styles.seccion}>
          <div className={styles.seccionTitulo}>CLIENTE</div>
          <div className={styles.clienteGrid}>
            <div className={styles.clienteRow}>
              <span className={styles.clienteLabel}>Empresa:</span>
              <span className={styles.clienteValor}>{empresa}</span>
            </div>
            <div className={styles.clienteRow}>
              <span className={styles.clienteLabel}>Contacto:</span>
              <span className={styles.clienteValor}>{contacto}</span>
            </div>
            {email && (
              <div className={styles.clienteRow}>
                <span className={styles.clienteLabel}>Email:</span>
                <span className={styles.clienteValor}>{email}</span>
              </div>
            )}
            {telefono && (
              <div className={styles.clienteRow}>
                <span className={styles.clienteLabel}>Teléfono:</span>
                <span className={styles.clienteValor}>{telefono}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── TABLA DE ÍTEMS ── */}
        <div className={styles.seccion}>
          <div className={styles.seccionTitulo}>PRODUCTOS Y SERVICIOS</div>
          <table className={styles.tabla}>
            <thead>
              <tr className={styles.tablaHeader}>
                <th>Código</th>
                <th>Descripción</th>
                <th className={styles.txtCentro}>Cant.</th>
                <th className={styles.txtDerecha}>P. Unit.</th>
                <th className={styles.txtDerecha}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? styles.trPar : styles.trImpar}>
                  <td><span className={styles.codigoTag}>{item.codigo || "SER."}</span></td>
                  <td>{item.descripcion}</td>
                  <td className={styles.txtCentro}>{item.cantidad}</td>
                  <td className={styles.txtDerecha}>{fmt(item.precioUnit * (1 - (item.descuento || 0) / 100), moneda)}</td>
                  <td className={styles.txtDerecha}>{fmt((item.precioUnit * (1 - (item.descuento || 0) / 100)) * item.cantidad, moneda)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── BLOQUE DE TOTALES ── */}
        <div className={styles.totalesZona}>
          <div className={styles.totalesBloque}>
            <div className={styles.totalesRow}>
              <span>Subtotal</span>
              <span>{fmt(subtotal, moneda)}</span>
            </div>
            {descuentoMonto > 0 && (
              <div className={styles.totalesRow}>
                <span>Descuento global ({descuentoGlobal}%)</span>
                <span className={styles.colorRojo}>− {fmt(descuentoMonto, moneda)}</span>
              </div>
            )}
            <div className={styles.totalesRowFinal}>
              <span>TOTAL {moneda}</span>
              <span>{fmt(totalFinal, moneda)}</span>
            </div>
          </div>
        </div>

        {/* ── CONDICIONES Y OBSERVACIONES (Look Profesional) ── */}
        <div className={styles.seccionInformativa}>
          <div className={styles.colCondiciones}>
            <div className={styles.seccionTitulo}>CONDICIONES COMERCIALES</div>
            <div className={styles.condicionesGrid}>
              {[
                { label: 'Garantía', valor: garantia },
                { label: 'Forma de pago', valor: formaPago },
                { label: 'Validez oferta', valor: validez },
                { label: 'Tiempo entrega', valor: tiempoEntrega },
                { label: 'Impuestos', valor: impuestos },
              ].map(({ label, valor }) => (
                <div key={label} className={styles.condicionRow}>
                  <span className={styles.condicionLabel}>{label}:</span>
                  <span className={styles.condicionValor}>{valor}</span>
                </div>
              ))}
            </div>
          </div>

          {observaciones && (
            <div className={styles.colObservaciones}>
              <div className={styles.seccionTitulo}>OBSERVACIONES</div>
              <div className={styles.observacionesCaja}>
                <p className={styles.observacionesTexto}>{observaciones}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── PARTE INFERIOR: FIRMA Y FOOTER FIJO ── */}
      <div className={styles.piePaginaFijo}>
        <div className={styles.zonaFirma}>
          <div className={styles.firmaContenedor}>
            <div className={styles.firmaLinea} />
            <p className={styles.firmaNombre}>{firmante.nombre || 'DrivesPlus S.A.S.'}</p>
            <p className={styles.firmaCargo}>{firmante.cargo || ''}</p>
            <p className={styles.firmaContacto}>{firmante.email || ''}</p>
            <p className={styles.firmaTelefono}>{firmante.telefono || ''}</p>
          </div>
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <span>DrivesPlus — Distribuidor Premiun Danfoss</span>
            <span>Centro de Servios Autorizado Danfoss</span>
            <div className={styles.footerInfo}>
              <span>Cotización: {nroCotizacion}</span>
              <span>Página 1 de 1</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
});

CotizacionPDF.displayName = 'CotizacionPDF';
export default CotizacionPDF;
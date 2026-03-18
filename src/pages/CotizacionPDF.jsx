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

/**
 * Componente de plantilla PDF.
 * Se renderiza fuera de pantalla y es capturado por html2canvas + jsPDF.
 * Recibe el objeto `cotizacion` con todos los campos guardados.
 */
const CotizacionPDF = React.forwardRef(({ cotizacion }, ref) => {
  if (!cotizacion) return null;

  const {
    nroCotizacion, fecha, moneda,
    empresa, contacto, email, telefono, ciudad,
    items = [],
    subtotal = 0, descuentoGlobal = 0, descuentoMonto = 0, totalFinal = 0,
    garantia, formaPago, validez, tiempoEntrega, impuestos, observaciones,
  } = cotizacion;

  return (
    <div ref={ref} className={styles.pagina}>
      <div className={styles.marcaAgua}>
        <img src="logo.png" alt="Marca de agua" />
      </div>
      {/* ── ENCABEZADO ── */}
      <div className={styles.header}>
  <div className={styles.cotFecha}>
    <span className={styles.cotLabel}>FECHA</span>
    <span className={styles.cotValor}>{fmtFecha(fecha)}</span>
  </div>

  <div className={styles.cotNro}>
    <span className={styles.cotLabel}>COTIZACIÓN N°</span>
    <span className={styles.cotValor}>{nroCotizacion}</span>
  </div>

  <div className={styles.empresaDatos}>
    <span className={styles.nombreEmpresa}>DrivesPlus S.A.S.</span>
    <span className={styles.datoEmpresa}>NIT: 901.566.348-5</span>
    <span className={styles.datoEmpresa}>Calle 46 # 69 - 39</span>
    <span className={styles.datoEmpresa}>Medellín, Colombia</span>
    <span className={styles.datoEmpresa}>www.drivesplus.com.co</span>
  </div>

  <img src="/logo.png" alt="DrivesPlus Logo" className={styles.logo} />
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
          {ciudad && (
            <div className={styles.clienteRow}>
              <span className={styles.clienteLabel}>Ciudad:</span>
              <span className={styles.clienteValor}>{ciudad}</span>
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
              <th className={styles.thCodigo}>Código</th>
              <th className={styles.thDesc}>Descripción</th>
              <th className={styles.thCant}>Cant.</th>
              <th className={styles.thPrecio}>P. Unit.</th>
              <th className={styles.thTotal}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              // Precio unitario con descuento — lo que ve el cliente
              const precioConDescuento = item.precioUnit * (1 - (item.descuento || 0) / 100);
              const totalLinea         = precioConDescuento * item.cantidad;
              return (
                <tr key={i} className={i % 2 === 0 ? styles.trPar : styles.trImpar}>
                  <td className={styles.tdCodigo}>
                    <span className={styles.codigoTag}>
                      {item.codigo || "SER."}
                    </span>
                  </td>
                  <td className={styles.tdDesc}>{item.descripcion}</td>
                  <td className={styles.tdCant}>{item.cantidad}</td>
                  <td className={styles.tdPrecio}>{fmt(precioConDescuento, moneda)}</td>
                  <td className={styles.tdTotal}>{fmt(totalLinea, moneda)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── TOTALES ── */}
      <div className={styles.totalesZona}>
        <div className={styles.totalesBloque}>
          <div className={styles.totalesRow}>
            <span>Subtotal</span>
            <span>{fmt(subtotal, moneda)}</span>
          </div>
          {descuentoGlobal > 0 && (
            <div className={styles.totalesRow}>
              <span>Descuento global ({descuentoGlobal}%)</span>
              <span>− {fmt(descuentoMonto, moneda)}</span>
            </div>
          )}
          <div className={styles.totalesRowFinal}>
            <span>TOTAL {moneda}</span>
            <span className={styles.totalValor}>{fmt(totalFinal, moneda)}</span>
          </div>
          {(moneda === 'USD' || moneda === 'EUR') && (
            <p className={styles.trmNota}>
              * El valor en COP se calculará aplicando la TRM vigente al día de la facturación.
            </p>
          )}
        </div>
      </div>

      {/* ── CONDICIONES COMERCIALES ── */}
      <div className={styles.seccion}>
        <div className={styles.seccionTitulo}>CONDICIONES COMERCIALES</div>
        <div className={styles.condicionesGrid}>
          {[
            { label: 'Garantía', valor: garantia },
            { label: 'Forma de pago', valor: formaPago },
            { label: 'Moneda', valor: moneda },
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

      {/* ── OBSERVACIONES ── */}
      {observaciones && (
        <div className={styles.seccion}>
          <div className={styles.seccionTitulo}>OBSERVACIONES</div>
          <p className={styles.observacionesTexto}>{observaciones}</p>
        </div>
      )}

      {/* ── FIRMA ── */}
      <div className={styles.firma}>
        <div className={styles.firmaLinea} />
        <p className={styles.firmaNombre}>Juan Fernando Zapata P.</p>
        <p className={styles.firmaCargo}>Líder Departamento Técnico</p>
        <p className={styles.firmaContacto}>312 391 09 12 · csa@drivesplus.com.co</p>
      </div>

      {/* ── PIE DE PÁGINA ── */}
      <div className={styles.footer}>
        <span>DrivesPlus — Distribuidor Premiun Danfoss</span>
        <span>{nroCotizacion} · {fmtFecha(fecha)}</span>
        <span>DrivesPlus — Centro de Servicio Autorizado Danfoss</span>
      </div>

    </div>
  );
});

CotizacionPDF.displayName = 'CotizacionPDF';
export default CotizacionPDF;

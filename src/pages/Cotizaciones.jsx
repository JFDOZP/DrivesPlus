import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { guardarCotizacion } from '../Firebase/firebaseLogic';
import { CATALOGO_PRODUCTOS } from '../constants/catalogo';
import CotizacionPDF from './CotizacionPDF';
import { usePDF } from '../hooks/usePDF';
import styles from './Cotizaciones.module.css';
import { useSearchParams } from 'react-router-dom';
// ─── Constantes ───────────────────────────────────────────────────────────────
const MONEDAS = ['COP', 'USD', 'EUR'];

const CONDICIONES = {
  garantia: ['6 meses', '12 meses', '18 meses', '24 meses'],
  formaPago: ['Contado', 'Crédito 30 días', 'Crédito 60 días', 'Anticipo 50%'],
  validez: ['5 días', '10 días', '15 días', '30 días'],
  tiempoEntrega: ['Inmediato', 'Importación 4 semanas', 'Importación 6 semanas', 'Importación 8 semanas', 'Importación 12 semanas'],
  impuestos: ['IVA 19% incluido', 'IVA 19% a incluir', 'No aplica IVA'],
};

const generarNroCotizacion = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
  return `CSA${yy}${mm}${dd}${rand}`;
};

// FIX: ID siempre único con crypto.randomUUID()
const itemVacio = () => ({
  id: crypto.randomUUID(),
  codigo: '',
  descripcion: '',
  cantidad: 1,
  precioUnit: 0,
  descuento: 0,
});

const FORM_INICIAL = {
  nroCotizacion: generarNroCotizacion(),
  fecha: new Date().toISOString().split('T')[0],
  moneda: 'COP',
  empresa: '',
  contacto: '',
  email: '',
  telefono: '',
  ciudad: '',
  serialEquipo: '',
  items: [itemVacio()],
  descuentoGlobal: 0,
  garantia: '12 meses',
  formaPago: 'Crédito 30 días',
  validez: '15 días',
  tiempoEntrega: 'Importación 6 semanas',
  impuestos: 'IVA 19% a incluir',
  observaciones: '',
};

const fmt = (n, moneda = 'COP') =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: moneda,
    minimumFractionDigits: moneda === 'COP' ? 0 : 2,
    maximumFractionDigits: moneda === 'COP' ? 0 : 2,
  }).format(n);

// ─── BUSCADOR DE CATÁLOGO ─────────────────────────────────────────────────────
const BuscadorCatalogo = ({ onSeleccionar, onCerrar }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const resultados = query.length < 2 ? [] : CATALOGO_PRODUCTOS.filter(p =>
    p.codigo.toLowerCase().includes(query.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 12);

  return (
    <div className={styles.modalOverlay} onClick={onCerrar}>
      <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span>Catálogo de Productos</span>
          <button className={styles.modalClose} onClick={onCerrar}>✕</button>
        </div>
        <div className={styles.modalSearch}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar por código o descripción..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className={styles.modalInput}
          />
        </div>
        <div className={styles.modalResultados}>
          {query.length < 2 && (
            <p className={styles.modalHint}>Escribe al menos 2 caracteres para buscar</p>
          )}
          {resultados.length === 0 && query.length >= 2 && (
            <p className={styles.modalHint}>Sin resultados para "{query}"</p>
          )}
          {resultados.map(p => (
            <div key={p.codigo} className={styles.modalItem} onClick={() => onSeleccionar(p)}>
              <span className={styles.modalCodigo}>{p.codigo}</span>
              <span className={styles.modalDesc}>{p.descripcion}</span>
              {p.precioUSD && (
                <span className={styles.modalPrecio}>USD {p.precioUSD.toLocaleString()}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── FILA DE ÍTEM ─────────────────────────────────────────────────────────────
// FIX: eliminado el toggle producto/servicio — todos los ítems son iguales.
// Un ítem sin código del catálogo simplemente queda con código manual o vacío.
const FilaItem = ({ item, moneda, onChange, onEliminar }) => {
  const [showCatalogo, setShowCatalogo] = useState(false);
  const precioTotal = item.cantidad * item.precioUnit * (1 - item.descuento / 100);

  const handleSeleccionar = (producto) => {
    // FIX: onChange recibe el item actualizado conservando su ID original
    onChange({
      ...item,
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      precioUnit: producto.precioUSD ?? 0,
    });
    setShowCatalogo(false);
  };

 


  return (
    <>
      <div className={styles.itemRow}>

        {/* Código + botón catálogo */}
        <div className={styles.itemCodigo}>
          <div className={styles.codigoGroup}>
            <input
              type="text"
              value={item.codigo}
              onChange={e => onChange({ ...item, codigo: e.target.value.toUpperCase() })}
              placeholder="Código"
              className={styles.inputSmall}
            />
            <button
              type="button"
              className={styles.btnCatalogo}
              onClick={() => setShowCatalogo(true)}
              title="Buscar en catálogo"
            >⊕</button>
          </div>
        </div>

        {/* Descripción */}
        <div className={styles.itemDesc}>
          <textarea
            value={item.descripcion}
            onChange={e => onChange({ ...item, descripcion: e.target.value })}
            placeholder="Descripción del ítem"
            className={styles.textareaSmall}
            rows={2}
          />
        </div>

        {/* Cantidad */}
        <div className={styles.itemCant}>
          <input
            type="number"
            min="1"
            value={item.cantidad}
            onChange={e => onChange({ ...item, cantidad: Number(e.target.value) })}
            className={styles.inputSmall}
          />
        </div>

        {/* Precio unitario */}
        <div className={styles.itemPrecio}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.precioUnit}
            onChange={e => onChange({ ...item, precioUnit: Number(e.target.value) })}
            className={styles.inputSmall}
          />
          <span className={styles.monedaTag}>{moneda}</span>
        </div>

        {/* Descuento % */}
        <div className={styles.itemDesc2}>
          <input
            type="number"
            min="0"
            max="100"
            value={item.descuento}
            onChange={e => onChange({ ...item, descuento: Number(e.target.value) })}
            className={styles.inputSmall}
          />
          <span className={styles.monedaTag}>%</span>
        </div>

        {/* Total línea */}
        <div className={styles.itemTotal}>
          <span>{fmt(precioTotal, moneda)}</span>
        </div>

        {/* Eliminar */}
        <button type="button" className={styles.btnEliminar} onClick={onEliminar}>✕</button>
      </div>

      {showCatalogo && (
        <BuscadorCatalogo
          onSeleccionar={handleSeleccionar}
          onCerrar={() => setShowCatalogo(false)}
        />
      )}
    </>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
const Cotizaciones = () => {
  const { currentUser, userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [cotizacionGuardada, setCotizacionGuardada] = useState(null);
  const { pdfRef, generarPDF, generando } = usePDF();

  useEffect(() => {

  const serial = searchParams.get('serial');
  const empresa = searchParams.get('empresa');
  const contacto = searchParams.get('contacto');

  if (serial || empresa || contacto) {
    setForm(prev => ({
      ...prev,
      serialEquipo: serial ?? prev.serialEquipo,
      empresa: empresa ?? prev.empresa,
      contacto: contacto ?? prev.contacto,
    }));
  }

}, [searchParams]);
  const set = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }));

  const subtotal = form.items.reduce((acc, i) => acc + i.cantidad * i.precioUnit * (1 - i.descuento / 100), 0);
  const descuentoMonto = subtotal * (form.descuentoGlobal / 100);
  const totalFinal = subtotal - descuentoMonto;

  const agregarItem = () => set('items', [...form.items, itemVacio()]);

  // FIX: compara por ID único — nunca afecta otros ítems
  const actualizarItem = (id, nuevoItem) =>
    set('items', form.items.map(i => i.id === id ? nuevoItem : i));

  const eliminarItem = (id) =>
    set('items', form.items.filter(i => i.id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agrega al menos un ítem.' });
      return;
    }
    setEnviando(true);
    setMensaje(null);
    try {
      // Limpiamos el campo interno `id` antes de guardar en Firestore
      const datosCompletos = {
        ...form,
        items: form.items.map(({ id, ...rest }) => rest),
        subtotal,
        descuentoMonto,
        totalFinal,
        // NUEVO: identificación del creador
        uid: currentUser?.uid ?? '',
        creadoPor: userProfile?.nombre ?? currentUser?.email ?? '',
      };
      await guardarCotizacion(datosCompletos);
      // Guardamos con IDs para que el PDF pueda renderizar la lista
      setCotizacionGuardada({ ...datosCompletos, items: form.items });
      setMensaje({ tipo: 'ok', texto: `Cotización ${form.nroCotizacion} guardada con éxito.` });
      setForm({ ...FORM_INICIAL, nroCotizacion: generarNroCotizacion() });
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: 'Error al guardar en Firebase.' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.page}>
      <form onSubmit={handleSubmit}>

        {/* ── ENCABEZADO ── */}
        <div className={styles.topBar}>
          <div className={styles.topLeft}>
            <h1 className={styles.titulo}>Nueva Cotización</h1>
            <span className={styles.nroCot}>{form.nroCotizacion}</span>
          </div>
          <div className={styles.topRight}>
            <div className={styles.topField}>
              <label>Fecha</label>
              <input type="date" value={form.fecha}
                onChange={e => set('fecha', e.target.value)} className={styles.inputBase} />
            </div>
            <div className={styles.topField}>
              <label>Moneda</label>
              <select value={form.moneda} onChange={e => set('moneda', e.target.value)} className={styles.selectBase}>
                {MONEDAS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            {(form.moneda === 'USD' || form.moneda === 'EUR') && (
              <div className={styles.trmNote}>
                <span>★</span> TRM del día de facturación
              </div>
            )}
          </div>
        </div>

        {mensaje && (
          <div className={`${styles.mensajeBox} ${mensaje.tipo === 'ok' ? styles.mensajeOk : styles.mensajeError}`}>
            {mensaje.texto}
          </div>
        )}

        {searchParams.get('serial') && (
          <div style={{
            padding: '10px 16px',
            background: '#eff6ff',
            border: '1px solid #93c5fd',
            borderRadius: '6px',
            fontSize: '0.85rem',
            color: '#1e40af',
            marginBottom: '16px',
            fontWeight: 600,
          }}>
            📎 Cotización vinculada al equipo {searchParams.get('serial')}
          </div>
        )}


        {/* ── GRID CLIENTE + CONDICIONES ── */}
        <div className={styles.mainGrid}>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}><span className={styles.cardNum}>01</span>Cliente</h2>
            <div className={styles.formGrid2}>
              {[
                { label: 'Empresa *', campo: 'empresa', required: true },
                { label: 'Contacto *', campo: 'contacto', required: true },
                { label: 'Email', campo: 'email', type: 'email' },
                { label: 'Teléfono', campo: 'telefono' },
                { label: 'Ciudad', campo: 'ciudad' },
                { label: 'Serial equipo (opt)', campo: 'serialEquipo', upper: true },
              ].map(({ label, campo, required, type, upper }) => (
                <div key={campo} className={styles.group}>
                  <label>{label}</label>
                  <input
                    type={type || 'text'}
                    required={!!required}
                    value={form[campo]}
                    placeholder={campo === 'serialEquipo' ? 'Vincular a equipo registrado' : ''}
                    onChange={e => set(campo, upper ? e.target.value.toUpperCase() : e.target.value)}
                    className={styles.inputBase}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}><span className={styles.cardNum}>02</span>Condiciones Comerciales</h2>
            <div className={styles.formGrid2}>
              {[
                { label: 'Garantía', campo: 'garantia', opciones: CONDICIONES.garantia },
                { label: 'Forma de pago', campo: 'formaPago', opciones: CONDICIONES.formaPago },
                { label: 'Validez oferta', campo: 'validez', opciones: CONDICIONES.validez },
                { label: 'Tiempo entrega', campo: 'tiempoEntrega', opciones: CONDICIONES.tiempoEntrega },
                { label: 'Impuestos', campo: 'impuestos', opciones: CONDICIONES.impuestos },
              ].map(({ label, campo, opciones }) => (
                <div key={campo} className={styles.group}>
                  <label>{label}</label>
                  <select value={form[campo]} onChange={e => set(campo, e.target.value)} className={styles.selectBase}>
                    {opciones.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── ÍTEMS ── */}
        <section className={`${styles.card} ${styles.cardFullWidth}`}>
          <div className={styles.cardTitleRow}>
            <h2 className={styles.cardTitle}><span className={styles.cardNum}>03</span>Ítems</h2>
            <button type="button" className={styles.btnAgregar} onClick={agregarItem}>+ Agregar ítem</button>
          </div>

          <div className={styles.tableHeader}>
            <span className={styles.colCodigo}>Código</span>
            <span className={styles.colDesc}>Descripción</span>
            <span className={styles.colCant}>Cant.</span>
            <span className={styles.colPrecio}>P. Unit.</span>
            <span className={styles.colDesc2}>Desc.%</span>
            <span className={styles.colTotal}>Total</span>
            <span className={styles.colDel}></span>
          </div>

          <div className={styles.itemsList}>
            {form.items.map(item => (
              <FilaItem
                key={item.id}
                item={item}
                moneda={form.moneda}
                onChange={nuevoItem => actualizarItem(item.id, nuevoItem)}
                onEliminar={() => eliminarItem(item.id)}
              />
            ))}
            {form.items.length === 0 && (
              <div className={styles.emptyItems}>Sin ítems — agrega productos o servicios con el botón de arriba</div>
            )}
          </div>
        </section>

        {/* ── OBSERVACIONES + TOTALES ── */}
        <div className={styles.bottomGrid}>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}><span className={styles.cardNum}>04</span>Observaciones</h2>
            <textarea
              value={form.observaciones}
              onChange={e => set('observaciones', e.target.value)}
              placeholder="Notas adicionales para el cliente..."
              className={styles.textareaBase}
              rows={5}
            />
          </section>

          <section className={`${styles.card} ${styles.totalesCard}`}>
            <h2 className={styles.cardTitle}><span className={styles.cardNum}>05</span>Resumen</h2>
            <div className={styles.totalesRows}>
              <div className={styles.totalesRow}>
                <span>Subtotal</span>
                <span>{fmt(subtotal, form.moneda)}</span>
              </div>
              <div className={styles.totalesRow}>
                <span>Descuento global</span>
                <div className={styles.descuentoInput}>
                  <input type="number" min="0" max="100"
                    value={form.descuentoGlobal}
                    onChange={e => set('descuentoGlobal', Number(e.target.value))}
                    className={styles.inputSmallTotal} />
                  <span>%</span>
                  {form.descuentoGlobal > 0 && (
                    <span className={styles.descuentoMonto}>− {fmt(descuentoMonto, form.moneda)}</span>
                  )}
                </div>
              </div>
              <div className={`${styles.totalesRow} ${styles.totalesFinal}`}>
                <span>TOTAL</span>
                <span className={styles.totalMonto}>{fmt(totalFinal, form.moneda)}</span>
              </div>
              {(form.moneda === 'USD' || form.moneda === 'EUR') && (
                <p className={styles.trmAviso}>
                  El valor en COP se calculará aplicando la TRM vigente al día de la facturación.
                </p>
              )}
            </div>

            <button type="submit" className={styles.btnGuardar} disabled={enviando}>
              {enviando ? 'Guardando...' : 'Guardar Cotización'}
            </button>

            {cotizacionGuardada && (
              <button type="button" className={styles.btnPDF} disabled={generando}
                onClick={() => generarPDF(cotizacionGuardada.nroCotizacion)}>
                {generando ? 'Generando PDF...' : '⬇ Descargar PDF'}
              </button>
            )}
          </section>
        </div>

      </form>

      {/* Plantilla PDF oculta */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
        <CotizacionPDF ref={pdfRef} cotizacion={cotizacionGuardada} />
      </div>

    </div>
  );
};

export default Cotizaciones;

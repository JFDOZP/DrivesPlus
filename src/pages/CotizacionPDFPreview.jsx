import CotizacionPDF from './CotizacionPDF';

const DATOS_PRUEBA = {
  nroCotizacion: 'CSA260315XX',
  fecha: '2026-03-15',
  moneda: 'COP',
  empresa: 'Comercial y Servicios Larco',
  contacto: 'Jasil Ocampo',
  email: 'jasil@larco.com',
  telefono: '300 123 4567',
  ciudad: 'Medellín',
  items: [
    {
      tipo: 'servicio',
      codigo: '',
      descripcion: 'Mantenimiento Preventivo Variador Danfoss FC-302',
      cantidad: 1,
      precioUnit: 850000,
      descuento: 0,
    },
    {
      tipo: 'producto',
      codigo: '131F7682',
      descripcion: 'VLT® HVAC Drive FC-102 7.5 KW / 10 HP, Three phase, 200-240 VAC, IP20',
      cantidad: 2,
      precioUnit: 3088915,
      descuento: 10,
    },
  ],
  subtotal: 6427830,
  descuentoGlobal: 5,
  descuentoMonto: 321391,
  totalFinal: 6106439,
  garantia: '12 meses',
  formaPago: 'Crédito 30 días',
  validez: '15 días',
  tiempoEntrega: 'Importación 6 semanas',
  impuestos: 'IVA 19% a incluir',
  observaciones: 'Ítem de importación — tiempo sujeto a disponibilidad de stock.',
};

const CotizacionPDFPreview = () => {
  return (
    <div style={{ background: '#e5e7eb', minHeight: '100vh', padding: '40px', display: 'flex', justifyContent: 'center' }}>
      <CotizacionPDF cotizacion={DATOS_PRUEBA} />
    </div>
  );
};

export default CotizacionPDFPreview;
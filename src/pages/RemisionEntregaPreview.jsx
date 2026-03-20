import RemisionEntregaPDF from './RemisionEntregaPDF';

const EQUIPO = {
  serial: 'FC302-88991', modelo: 'VLT® AutomationDrive FC 301 / FC 302',
  familia: 'VLT®', codigo: '131F7682',
  empresa: 'Comercial y Servicios Larco', contacto: 'Jasil Ocampo',
  comercial: 'Juan Zapata',
};
const SERVICIO = {
  id: 'abc123def456',
  motivo: 'Diagnóstico',
  fechaIngreso: { seconds: Math.floor(Date.now() / 1000) },
};
const DATOS_ENTREGA = {
  trabajos:      'Reemplazo de IGBT dañado. Limpieza interna. Pruebas de arranque exitosas.',
  nroCotizacion: 'JZ2603181047',
  nroInforme:    'RT-0042',
  garantia:      '12 meses',
  observaciones: 'Se recomienda revisión de ventilación del tablero.',
  repuestos: [
    { codigo: '018F6260', descripcion: 'Control Card with safe stop for FC-301', cantidad: 1 },
    { codigo: '042N7520', descripcion: 'Control Card with safe stop for FC-302', cantidad: 2 },
  ],
};

const RemisionEntregaPreview = () => (
  <div style={{ background: '#e5e7eb', minHeight: '100vh', padding: '40px', display: 'flex', justifyContent: 'center' }}>
    <RemisionEntregaPDF equipo={EQUIPO} servicio={SERVICIO} datosEntrega={DATOS_ENTREGA} />
  </div>
);

export default RemisionEntregaPreview;
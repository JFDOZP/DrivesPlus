import RemisionRecepcionPDF from './RemisionRecepcionPDF';

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
  observacionesIngreso: 'Equipo presenta falla en IGBT. Llega sin tapa lateral.',
};

const RemisionRecepcionPreview = () => (
  <div style={{ background: '#e5e7eb', minHeight: '100vh', padding: '40px', display: 'flex', justifyContent: 'center' }}>
    <RemisionRecepcionPDF equipo={EQUIPO} servicio={SERVICIO} />
  </div>
);

export default RemisionRecepcionPreview;
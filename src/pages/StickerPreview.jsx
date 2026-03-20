import StickerEquipo from './StickerEquipo';

const EQUIPO_PRUEBA = {
  serial:   'FC302-88991',
  modelo:   'VLT® AutomationDrive FC 301 / FC 302',
  familia:  'VLT®',
  codigo:   '131F7682',
  empresa:  'Comercial y Servicios Larco',
  contacto: 'Jasil Ocampo',
};

const SERVICIO_PRUEBA = {
  estadoActual: 'En reparación',
  motivo:       'Diagnóstico',
  fechaIngreso: { seconds: Math.floor(Date.now() / 1000) },
};

const StickerPreview = () => (
  <div style={{ background: '#e5e7eb', minHeight: '100vh', padding: '40px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
    {/* Muestra el sticker en todos los estados para comparar */}
    {['Ingresado','Diagnóstico','En espera aprobación','En reparación','Listo para entrega','Entregado'].map(estado => (
      <div key={estado}>
        <p style={{ fontFamily: 'monospace', fontSize: '11px', marginBottom: '6px', color: '#666' }}>{estado}</p>
        <StickerEquipo equipo={EQUIPO_PRUEBA} servicio={{ ...SERVICIO_PRUEBA, estadoActual: estado }} />
      </div>
    ))}
  </div>
);

export default StickerPreview;
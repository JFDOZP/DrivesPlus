import React, { useState } from 'react';
import { registrarIngresoEquipo } from '../Firebase/firebaseLogic';
import { FAMILIAS } from '../constants/contants';
import styles from './Equipos.module.css';

// Estado inicial separado para poder resetear fácilmente
const ESTADO_INICIAL = {
  empresa: '',
  contacto: '',
  comercial: '',
  familia: '',
  modelo: '',
  codigo: '',
  serial: '',
  motivo: 'Diagnóstico',
};

const FormularioIngreso = () => {
  const [formData, setFormData] = useState(ESTADO_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo: 'ok'|'error', texto }

  const set = (campo, valor) =>
    setFormData((prev) => ({ ...prev, [campo]: valor }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);

    try {
      await registrarIngresoEquipo(formData);
      setMensaje({ tipo: 'ok', texto: `Equipo ${formData.serial} registrado con éxito.` });
      setFormData(ESTADO_INICIAL); // FIX: limpia el formulario tras envío exitoso
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: 'Error al conectar con Firebase. Intenta de nuevo.' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <h2 style={{ color: '#DB0100' }}>Ingreso de Equipo</h2>

      {/* Mensaje de resultado */}
      {mensaje && (
        <div
          className={styles.fullWidth}
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '0.9rem',
            fontWeight: 600,
            background: mensaje.tipo === 'ok' ? '#f0fdf4' : '#fff5f5',
            color: mensaje.tipo === 'ok' ? '#166534' : '#991b1b',
            border: `1px solid ${mensaje.tipo === 'ok' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Empresa */}
      <div className={styles.group}>
        <label>Empresa</label>
        <input
          type="text"
          required
          value={formData.empresa}
          onChange={(e) => set('empresa', e.target.value)}
        />
      </div>

      {/* Contacto */}
      <div className={styles.group}>
        <label>Contacto</label>
        <input
          type="text"
          required
          value={formData.contacto}
          onChange={(e) => set('contacto', e.target.value)}
        />
      </div>

      {/* Comercial */}
      <div className={styles.group}>
        <label>Comercial</label>
        <input
          type="text"
          required
          value={formData.comercial}
          onChange={(e) => set('comercial', e.target.value)}
        />
      </div>

      {/* Serial */}
      <div className={styles.group}>
        <label>Serial (ID Único)</label>
        <input
          type="text"
          required
          value={formData.serial}
          onChange={(e) => set('serial', e.target.value.trim().toUpperCase())}
          placeholder="Ej: FC302-88991"
        />
      </div>

      {/* Código */}
      <div className={styles.group}>
        <label>Código</label>
        <input
          type="text"
          required
          value={formData.codigo}
          onChange={(e) => set('codigo', e.target.value)}
        />
      </div>

      {/* Select de familia */}
      <div className={styles.group}>
        <label>Familia</label>
        <select
          required
          value={formData.familia}
          onChange={e => setFormData({ ...formData, familia: e.target.value, modelo: "" })}
        >
          <option value="">— Seleccionar familia —</option>
          {Object.keys(FAMILIAS).map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Select de modelo — solo visible si hay familia seleccionada */}
      {formData.familia && (
        <div className={styles.group}>
          <label>Modelo</label>
          <select
            required
            value={formData.modelo}
            onChange={e => setFormData({ ...formData, modelo: e.target.value })}
          >
            <option value="">— Seleccionar modelo —</option>
            {FAMILIAS[formData.familia].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      {/* Motivo */}
      <div className={styles.group}>
        <label>Motivo de Ingreso</label>
        <select
          value={formData.motivo}
          onChange={(e) => set('motivo', e.target.value)}
        >
          <option value="Diagnóstico">Diagnóstico</option>
          <option value="Mantenimiento">Mantenimiento</option>
          <option value="Garantía">Garantía</option>
        </select>
      </div>

      <button
        type="submit"
        className={styles.btnEnviar}
        disabled={enviando}
      >
        {enviando ? 'Registrando...' : 'Registrar en Sistema'}
      </button>
    </form>
  );
};

export default FormularioIngreso;
import React, { useState } from 'react';
import { registrarIngresoEquipo } from '../Firebase/firebaseLogic';
import { FAMILIAS } from '../constants/contants';
import styles from './Equipos.module.css';

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
  const [mensaje, setMensaje] = useState(null);

  const set = (campo, valor) =>
    setFormData((prev) => ({ ...prev, [campo]: valor }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);

    try {
      await registrarIngresoEquipo(formData);
      setMensaje({ tipo: 'ok', texto: `Equipo ${formData.serial} registrado con éxito.` });
      setFormData(ESTADO_INICIAL);
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: 'Error al conectar con Firebase.' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <h1 className={styles.titulo}>Registro de Equipos</h1>
          <span className={styles.subtitulo}>Ingreso al Centro de Servicio Autorizado</span>
        </div>
      </header>

      <main className={styles.mainContent}>
        <form onSubmit={handleSubmit} className={styles.formCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Datos del Cliente y Equipo</span>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.group}>
              <label>Empresa / Cliente</label>
              <input
                required
                type="text"
                placeholder="Nombre de la empresa"
                value={formData.empresa}
                onChange={(e) => set('empresa', e.target.value)}
              />
            </div>

            <div className={styles.group}>
              <label>Contacto / Solicitante</label>
              <input
                required
                type="text"
                placeholder="Nombre del contacto"
                value={formData.contacto}
                onChange={(e) => set('contacto', e.target.value)}
              />
            </div>

            <div className={styles.group}>
              <label>Asesor Comercial</label>
              <input
                type="text"
                placeholder="Nombre del asesor"
                value={formData.comercial}
                onChange={(e) => set('comercial', e.target.value)}
              />
            </div>

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

            <div className={styles.group}>
              <label>Familia</label>
              <select
                required
                value={formData.familia}
                onChange={(e) => setFormData({ ...formData, familia: e.target.value, modelo: "" })}
              >
                <option value="">— Seleccionar —</option>
                {Object.keys(FAMILIAS).map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className={styles.group}>
              <label>Modelo</label>
              <select
                required
                disabled={!formData.familia}
                value={formData.modelo}
                onChange={e => setFormData({ ...formData, modelo: e.target.value })}
              >
                <option value="">— Seleccionar modelo —</option>
                {formData.familia && FAMILIAS[formData.familia].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className={styles.group}>
              <label>Código Interno</label>
              <input
                type="text"
                className={styles.monoInput}
                placeholder="Opcional"
                value={formData.codigo}
                onChange={(e) => set('codigo', e.target.value.toUpperCase())}
              />
            </div>

            <div className={styles.group}>
              <label>Número de Serial</label>
              <input
                required
                type="text"
                className={`${styles.monoInput} ${styles.serialHighlight}`}
                placeholder="Ingrese serial"
                value={formData.serial}
                onChange={(e) => set('serial', e.target.value.toUpperCase())}
              />
            </div>
          </div>

          {mensaje && (
            <div className={`${styles.alerta} ${mensaje.tipo === 'ok' ? styles.alertaOk : styles.alertaError}`}>
              {mensaje.texto}
            </div>
          )}

          <div className={styles.formFooter}>
            <button type="submit" className={styles.btnEnviar} disabled={enviando}>
              {enviando ? 'PROCESANDO...' : 'REGISTRAR INGRESO'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default FormularioIngreso;
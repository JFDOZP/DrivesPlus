import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, orderBy, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { db } from '../Firebase/firebaseConfig';
import styles from './Agenda.module.css';

// ─── Constantes ───────────────────────────────────────────────────────────────
const DIAS_SEMANA  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_NOMBRES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const TIPOS_VISITA = [
  { valor: 'comercial',    label: 'Visita comercial',   color: '#1e40af', bg: '#eff6ff', border: '#93c5fd' },
  { valor: 'tecnica',      label: 'Visita técnica',     color: '#166534', bg: '#f0fdf4', border: '#86efac' },
  { valor: 'seguimiento',  label: 'Seguimiento',        color: '#b45309', bg: '#fff8e1', border: '#fbbf24' },
  { valor: 'entrega',      label: 'Entrega de equipo',  color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
  { valor: 'otro',         label: 'Otro',               color: '#374151', bg: '#f9fafb', border: '#d1d5db' },
];

const HORAS = Array.from({ length: 24 }, (_, i) => {
  const h  = String(i).padStart(2, '0');
  const su = i < 12 ? 'AM' : 'PM';
  const h12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
  return { valor: `${h}:00`, label: `${String(h12).padStart(2,'0')}:00 ${su}` };
});

const tipoConfig = (tipo) =>
  TIPOS_VISITA.find(t => t.valor === tipo) ?? TIPOS_VISITA[4];

const fmtHora = (h) => {
  const cfg = HORAS.find(x => x.valor === h);
  return cfg ? cfg.label : h;
};

// ─── Firebase helpers ─────────────────────────────────────────────────────────
const COLECCION = 'agenda';

const cargarEventosMes = async (anio, mes, uid, isAdmin) => {
  const inicio = new Date(anio, mes, 1).getTime();
  const fin    = new Date(anio, mes + 1, 0, 23, 59, 59).getTime();

  let q;
  if (isAdmin) {
    q = query(
      collection(db, COLECCION),
      where('fechaMs', '>=', inicio),
      where('fechaMs', '<=', fin),
      orderBy('fechaMs'),
    );
  } else {
    q = query(
      collection(db, COLECCION),
      where('uid', '==', uid),
      where('fechaMs', '>=', inicio),
      where('fechaMs', '<=', fin),
      orderBy('fechaMs'),
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── MODAL ────────────────────────────────────────────────────────────────────
const ModalEvento = ({ dia, mes, anio, evento, onGuardar, onEliminar, onCerrar, guardando }) => {
  const esEdicion = !!evento;

  const [form, setForm] = useState({
    titulo:    evento?.titulo    ?? '',
    empresa:   evento?.empresa   ?? '',
    tipo:      evento?.tipo      ?? 'comercial',
    hora:      evento?.hora      ?? '09:00',
    notas:     evento?.notas     ?? '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const valido = form.titulo.trim().length > 0;

  const fechaLabel = `${dia} de ${MESES_NOMBRES[mes]} ${anio}`;

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <div className={styles.modalHead}>
          <div>
            <span className={styles.modalFecha}>{fechaLabel}</span>
            <h3 className={styles.modalTitulo}>
              {esEdicion ? 'Editar evento' : 'Nuevo evento'}
            </h3>
          </div>
          <button className={styles.modalClose} onClick={onCerrar}>✕</button>
        </div>

        <div className={styles.modalBody}>

          {/* Tipo */}
          <div className={styles.mGroup}>
            <label>Tipo de evento</label>
            <div className={styles.tipoGrid}>
              {TIPOS_VISITA.map(t => (
                <button key={t.valor} type="button"
                  className={`${styles.tipoPill} ${form.tipo === t.valor ? styles.tipoPillActive : ''}`}
                  style={form.tipo === t.valor
                    ? { color: t.color, background: t.bg, borderColor: t.border }
                    : {}}
                  onClick={() => set('tipo', t.valor)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div className={styles.mGroup}>
            <label>Descripción / Título *</label>
            <input type="text" value={form.titulo}
              onChange={e => set('titulo', e.target.value)}
              placeholder="Ej: Visita comercial"
              className={styles.mInput} autoFocus />
          </div>

          {/* Empresa + Hora */}
          <div className={styles.mRow}>
            <div className={styles.mGroup}>
              <label>Empresa</label>
              <input type="text" value={form.empresa}
                onChange={e => set('empresa', e.target.value)}
                placeholder="Nombre empresa"
                className={styles.mInput} />
            </div>
            <div className={styles.mGroup}>
              <label>Hora</label>
              <select value={form.hora} onChange={e => set('hora', e.target.value)}
                className={styles.mSelect}>
                {HORAS.map(h => (
                  <option key={h.valor} value={h.valor}>{h.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notas */}
          <div className={styles.mGroup}>
            <label>Notas (opcional)</label>
            <textarea value={form.notas}
              onChange={e => set('notas', e.target.value)}
              placeholder="Observaciones adicionales..."
              className={styles.mTextarea} rows={3} />
          </div>

        </div>

        <div className={styles.modalFoot}>
          {esEdicion && (
            <button className={styles.btnEliminar} onClick={() => onEliminar(evento.id)}
              disabled={guardando}>
              Eliminar
            </button>
          )}
          <button className={styles.btnCancelar} onClick={onCerrar}>Cancelar</button>
          <button className={styles.btnGuardar} onClick={() => onGuardar(form)}
            disabled={!valido || guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Guardar evento'}
          </button>
        </div>

      </div>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
const Agenda = () => {
  const { currentUser, userProfile, isAdmin } = useAuth();

  const hoy = new Date();
  const [anio, setAnio]   = useState(hoy.getFullYear());
  const [mes,  setMes]    = useState(hoy.getMonth());
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Modal state
  const [modal, setModal] = useState(null);
  // modal = { dia, evento: null | {...} }

  // ── Cargar eventos del mes ──
  useEffect(() => {
    if (!currentUser) return;
    const cargar = async () => {
      setCargando(true);
      try {
        const data = await cargarEventosMes(anio, mes, currentUser.uid, isAdmin);
        setEventos(data);
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [anio, mes, currentUser, isAdmin]);

  // ── Mapa de eventos por día ──
  const eventosPorDia = useMemo(() => {
    const map = {};
    eventos.forEach(ev => {
      const d = new Date(ev.fechaMs).getDate();
      if (!map[d]) map[d] = [];
      map[d].push(ev);
    });
    return map;
  }, [eventos]);

  // ── Navegar meses ──
  const irMes = (delta) => {
    const d = new Date(anio, mes + delta, 1);
    setAnio(d.getFullYear());
    setMes(d.getMonth());
  };

  // ── Días del calendario ──
  const diasCalendario = useMemo(() => {
    const primerDia = new Date(anio, mes, 1).getDay();  // 0=Dom
    const totalDias = new Date(anio, mes + 1, 0).getDate();
    const celdas = [];
    for (let i = 0; i < primerDia; i++) celdas.push(null);
    for (let d = 1; d <= totalDias; d++) celdas.push(d);
    return celdas;
  }, [anio, mes]);

  // ── Guardar / actualizar evento ──
  const handleGuardar = async (form) => {
    if (!modal) return;
    setGuardando(true);
    try {
      const fechaMs = new Date(anio, mes, modal.dia,
        parseInt(form.hora.split(':')[0]), 0, 0).getTime();

      if (modal.evento) {
        // Editar
        await updateDoc(doc(db, COLECCION, modal.evento.id), {
          titulo:    form.titulo.trim(),
          empresa:   form.empresa.trim(),
          tipo:      form.tipo,
          hora:      form.hora,
          notas:     form.notas.trim(),
          fechaMs,
          actualizadoEn: serverTimestamp(),
        });
        setEventos(prev => prev.map(ev =>
          ev.id === modal.evento.id
            ? { ...ev, ...form, titulo: form.titulo.trim(), empresa: form.empresa.trim(), notas: form.notas.trim(), fechaMs }
            : ev
        ));
      } else {
        // Crear
        const ref = await addDoc(collection(db, COLECCION), {
          titulo:    form.titulo.trim(),
          empresa:   form.empresa.trim(),
          tipo:      form.tipo,
          hora:      form.hora,
          notas:     form.notas.trim(),
          fechaMs,
          uid:       currentUser.uid,
          creadoPor: userProfile?.nombre ?? currentUser.email,
          creadoEn:  serverTimestamp(),
        });
        setEventos(prev => [...prev, {
          id: ref.id, ...form,
          titulo: form.titulo.trim(), empresa: form.empresa.trim(), notas: form.notas.trim(),
          fechaMs, uid: currentUser.uid, creadoPor: userProfile?.nombre ?? currentUser.email,
        }].sort((a, b) => a.fechaMs - b.fechaMs));
      }
      setModal(null);
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  // ── Eliminar evento ──
  const handleEliminar = async (id) => {
    setGuardando(true);
    try {
      await deleteDoc(doc(db, COLECCION, id));
      setEventos(prev => prev.filter(ev => ev.id !== id));
      setModal(null);
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  // ── ¿Es hoy? ──
  const esHoy = (dia) =>
    dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();

  // ── Eventos del mes ordenados ──
  const eventosOrdenados = useMemo(() =>
    [...eventos].sort((a, b) => a.fechaMs - b.fechaMs), [eventos]);

  return (
    <div className={styles.page}>

      {/* ── ENCABEZADO ── */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.titulo}>Agenda</h1>
          <span className={styles.subtitulo}>Visitas y eventos comerciales</span>
        </div>
        <div className={styles.navMes}>
          <button className={styles.navBtn} onClick={() => irMes(-1)}>‹</button>
          <div className={styles.mesActual}>
            <span className={styles.mesNombre}>{MESES_NOMBRES[mes]}</span>
            <span className={styles.mesAnio}>{anio}</span>
          </div>
          <button className={styles.navBtn} onClick={() => irMes(1)}>›</button>
          <button className={styles.btnHoy}
            onClick={() => { setAnio(hoy.getFullYear()); setMes(hoy.getMonth()); }}>
            Hoy
          </button>
        </div>
      </div>

      {/* ── CALENDARIO ── */}
      <div className={styles.calendario}>

        {/* Cabecera días semana */}
        <div className={styles.semanaHeader}>
          {DIAS_SEMANA.map(d => (
            <div key={d} className={styles.diaSemana}>{d}</div>
          ))}
        </div>

        {/* Grid días */}
        <div className={styles.grid}>
          {diasCalendario.map((dia, i) => {
            if (!dia) return <div key={`e-${i}`} className={styles.celdaVacia} />;
            const evDia = eventosPorDia[dia] ?? [];
            const hoyFlag = esHoy(dia);
            return (
              <div key={dia}
                className={`${styles.celda} ${hoyFlag ? styles.celdaHoy : ''}`}
                onClick={() => setModal({ dia, evento: null })}>

                <span className={`${styles.numDia} ${hoyFlag ? styles.numDiaHoy : ''}`}>
                  {dia}
                </span>

                {/* Puntos de eventos en el día */}
                {evDia.length > 0 && (
                  <div className={styles.puntosWrap}>
                    {evDia.slice(0, 3).map(ev => {
                      const cfg = tipoConfig(ev.tipo);
                      return (
                        <div key={ev.id}
                          className={styles.puntoEvento}
                          style={{ background: cfg.color }}
                          title={`${fmtHora(ev.hora)} — ${ev.titulo}`}
                          onClick={e => { e.stopPropagation(); setModal({ dia, evento: ev }); }}
                        />
                      );
                    })}
                    {evDia.length > 3 && (
                      <span className={styles.masEventos}>+{evDia.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── LISTA DE EVENTOS DEL MES ── */}
      <div className={styles.listaSeccion}>
        <div className={styles.listaTitulo}>
          <span className={styles.listaTituloTexto}>
            Eventos de {MESES_NOMBRES[mes]} {anio}
          </span>
          <span className={styles.listaBadge}>{eventos.length}</span>
        </div>

        {cargando ? (
          <div className={styles.loading}>Cargando eventos...</div>
        ) : eventosOrdenados.length === 0 ? (
          <div className={styles.empty}>
            Sin eventos este mes — haz clic en un día del calendario para agregar uno.
          </div>
        ) : (
          <div className={styles.listaEventos}>
            {eventosOrdenados.map(ev => {
              const cfg = tipoConfig(ev.tipo);
              const d   = new Date(ev.fechaMs);
              return (
                <div key={ev.id} className={styles.eventoCard}
                  onClick={() => setModal({ dia: d.getDate(), evento: ev })}>

                  <div className={styles.eventoAccent} style={{ background: cfg.color }} />

                  <div className={styles.eventoFechaCol}>
                    <span className={styles.eventoDia}>{d.getDate()}</span>
                    <span className={styles.eventoMesCorto}>
                      {MESES_NOMBRES[d.getMonth()].slice(0, 3)}
                    </span>
                  </div>

                  <div className={styles.eventoInfo}>
                    <span className={styles.eventoHora}>{fmtHora(ev.hora)}</span>
                    <span className={styles.eventoTitulo}>{ev.titulo}</span>
                    {ev.empresa && (
                      <span className={styles.eventoEmpresa}>{ev.empresa}</span>
                    )}
                  </div>

                  <div className={styles.eventoTipoBadge}
                    style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                    {cfg.label}
                  </div>

                  {isAdmin && ev.creadoPor && (
                    <span className={styles.eventoCreadoPor}>{ev.creadoPor}</span>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {modal && (
        <ModalEvento
          dia={modal.dia}
          mes={mes}
          anio={anio}
          evento={modal.evento}
          onGuardar={handleGuardar}
          onEliminar={handleEliminar}
          onCerrar={() => setModal(null)}
          guardando={guardando}
        />
      )}

    </div>
  );
};

export default Agenda;
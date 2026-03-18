import { db } from "./firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  serverTimestamp,
  Timestamp,
  runTransaction,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  arrayUnion,
  updateDoc,
  setDoc
} from "firebase/firestore";

// ─────────────────────────────────────────────
// REGISTRAR INGRESO DE EQUIPO
// Arquitectura: Identidad (equipos) + Visita (servicios)
// FIX: addDoc no funciona dentro de runTransaction.
//      Se reemplaza por doc() + transaction.set() para
//      generar el ID automáticamente dentro de la transacción.
// FIX: serverTimestamp() no puede usarse dentro de arrays.
//      Se reemplaza por Timestamp.now() en el historial inicial.
// ─────────────────────────────────────────────
export const registrarIngresoEquipo = async (datos) => {
  try {
    const equipoRef = doc(db, "equipos", datos.serial);

    // Generamos el ID del servicio ANTES de entrar a la transacción
    const nuevoServicioRef = doc(collection(db, "servicios"));

    await runTransaction(db, async (transaction) => {

      // 1. Crear o actualizar la identidad del equipo (datos estáticos)
      transaction.set(equipoRef, {
        serial:               datos.serial,
        modelo:               datos.modelo,
        familia:              datos.familia,
        empresa:              datos.empresa,
        contacto:             datos.contacto,
        comercial:            datos.comercial,
        codigo:               datos.codigo,
        ultimaActualizacion:  serverTimestamp(),
      }, { merge: true });

      // 2. Crear el documento de servicio (la visita actual)
      //    FIX: usamos transaction.set() con ref generada fuera
      transaction.set(nuevoServicioRef, {
        equipoId:     datos.serial,
        empresa:      datos.empresa,   // desnormalizado para queries rápidas
        modelo:       datos.modelo,
        familia:      datos.familia,
        contacto:     datos.contacto,
        comercial:    datos.comercial,
        codigo:       datos.codigo,
        motivo:       datos.motivo,
        estadoActual: "Ingresado",
        fechaIngreso: serverTimestamp(),
        // FIX: Timestamp.now() en lugar de serverTimestamp() dentro del array
        historial: [
          {
            estado: "Ingresado",
            fecha:  Timestamp.now(),
            nota:   "Ingreso inicial al sistema",
          },
        ],
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error al registrar ingreso:", error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// OBTENER HISTORIAL COMPLETO DE UN EQUIPO
// Retorna: { equipo: {...}, servicios: [...] }
// ─────────────────────────────────────────────
export const obtenerHistorialEquipo = async (serial) => {
  try {
    const equipoSnap = await getDoc(doc(db, "equipos", serial));

    if (!equipoSnap.exists()) return null;

    const datosEquipo = equipoSnap.data();

    const q = query(
      collection(db, "servicios"),
      where("equipoId", "==", serial),
      orderBy("fechaIngreso", "desc")
    );

    const querySnapshot = await getDocs(q);
    const servicios = querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return { equipo: datosEquipo, servicios };
  } catch (error) {
    console.error("Error al obtener historial:", error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// ACTUALIZAR ESTADO DE UN SERVICIO
// FIX: Timestamp.now() en lugar de new Date().toISOString()
//      para consistencia con el servidor y mejor ordenamiento.
// ─────────────────────────────────────────────
export const actualizarEstadoServicio = async (servicioId, nuevoEstado, nota) => {
  try {
    const servicioRef = doc(db, "servicios", servicioId);

    await updateDoc(servicioRef, {
      estadoActual: nuevoEstado,
      // arrayUnion añade al historial sin borrar entradas anteriores
      historial: arrayUnion({
        estado: nuevoEstado,
        fecha:  Timestamp.now(),
        nota:   nota || `Cambio de estado a ${nuevoEstado}`,
      }),
    });

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// OBTENER EQUIPOS PENDIENTES (no entregados)
// Retorna los últimos 10 servicios activos.
// ─────────────────────────────────────────────
export const obtenerUltimosPendientes = async () => {
  try {
    const q = query(
      collection(db, "servicios"),
      where("estadoActual", "not-in", ["Entregado", "Finalizado"]),
      orderBy("estadoActual"),       // requerido por Firestore con not-in
      orderBy("fechaIngreso", "desc"),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error al obtener pendientes:", error);
    return [];
  }
};

export const guardarCotizacion = async (datos) => {
  try {
    const cotRef = doc(db, 'cotizaciones', datos.nroCotizacion);

    await setDoc(cotRef, {
      nroCotizacion:   datos.nroCotizacion,
      fecha:           datos.fecha,
      moneda:          datos.moneda,

      // ── NUEVO: identificación del creador ──
      uid:             datos.uid        || '',
      creadoPor:       datos.creadoPor  || '',   // nombre o email del usuario

      // Cliente
      empresa:         datos.empresa,
      contacto:        datos.contacto,
      email:           datos.email     || '',
      telefono:        datos.telefono  || '',
      ciudad:          datos.ciudad    || '',

      serialEquipo:    datos.serialEquipo || null,

      items: datos.items.map(({ id, ...rest }) => rest),

      subtotal:         datos.subtotal,
      descuentoGlobal:  datos.descuentoGlobal,
      descuentoMonto:   datos.descuentoMonto,
      totalFinal:       datos.totalFinal,

      garantia:         datos.garantia,
      formaPago:        datos.formaPago,
      validez:          datos.validez,
      tiempoEntrega:    datos.tiempoEntrega,
      impuestos:        datos.impuestos,
      observaciones:    datos.observaciones || '',

      estado:           'En espera',   // En espera | Aprobada | No aprobada

      fechaCreacion:          serverTimestamp(),
      ultimaActualizacion:    serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error al guardar cotización:', error);
    throw error;
  }
};



// ─── OBTENER COTIZACIONES ────────────────────────────────────────────────────
// Admin: todas las cotizaciones
// Usuario: solo las suyas (filtro por uid)
export const obtenerCotizaciones = async (uid, isAdmin) => {
  try {
    let q;
    if (isAdmin) {
      q = query(
        collection(db, 'cotizaciones'),
        orderBy('fechaCreacion', 'desc')
      );
    } else {
      q = query(
        collection(db, 'cotizaciones'),
        where('uid', '==', uid),
        orderBy('fechaCreacion', 'desc')
      );
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      // Convertir Timestamp a ms para facilitar cálculos en el cliente
      fechaCreacionMs: d.data().fechaCreacion?.toMillis?.() ?? null,
    }));
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    throw error;
  }
};

// ─── ACTUALIZAR ESTADO DE COTIZACIÓN ────────────────────────────────────────
// estados: 'En espera' | 'Aprobada' | 'No aprobada'
export const actualizarEstadoCotizacion = async (nroCotizacion, nuevoEstado) => {
  try {
    const ref = doc(db, 'cotizaciones', nroCotizacion);
    await updateDoc(ref, {
      estado:               nuevoEstado,
      ultimaActualizacion:  serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    throw error;
  }
};

// ─── OBTENER UNA COTIZACIÓN POR ID ───────────────────────────────────────────
export const obtenerCotizacion = async (nroCotizacion) => {
  try {
    const snap = await getDoc(doc(db, 'cotizaciones', nroCotizacion));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error('Error al obtener cotización:', error);
    throw error;
  }
};

export const obtenerServiciosActivos = async () => {
  try {
    // Query simple: solo orderBy, sin límite ni not-in
    // Evita necesitar índice compuesto en Firestore
    const q = query(
      collection(db, 'servicios'),
      orderBy('fechaIngreso', 'desc')
    );

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return [];
  }
};

// ─── COTIZACIONES POR SERIAL ─────────────────────────────────────────────────
// Obtiene todas las cotizaciones vinculadas a un serial de equipo.
// No requiere índice compuesto — filtra en memoria.
export const obtenerCotizacionesPorSerial = async (serial) => {
  try {
    const q = query(
      collection(db, 'cotizaciones'),
      where('serialEquipo', '==', serial),
      orderBy('fechaCreacion', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      fechaCreacionMs: d.data().fechaCreacion?.toMillis?.() ?? null,
    }));
  } catch (error) {
    // Fallback sin orderBy si el índice no existe aún
    try {
      const q2 = query(
        collection(db, 'cotizaciones'),
        where('serialEquipo', '==', serial)
      );
      const snap2 = await getDocs(q2);
      return snap2.docs
        .map(d => ({ id: d.id, ...d.data(), fechaCreacionMs: d.data().fechaCreacion?.toMillis?.() ?? null }))
        .sort((a, b) => (b.fechaCreacionMs ?? 0) - (a.fechaCreacionMs ?? 0));
    } catch (e2) {
      console.error('Error al obtener cotizaciones por serial:', e2);
      return [];
    }
  }
};

// ─── ACTUALIZAR N° DE REPORTE TÉCNICO EN SERVICIO ────────────────────────────
export const actualizarNroReporte = async (servicioId, nroReporte) => {
  try {
    const ref = doc(db, 'servicios', servicioId);
    await updateDoc(ref, {
      nroReporte:          nroReporte,
      ultimaActualizacion: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar N° reporte:', error);
    throw error;
  }
};



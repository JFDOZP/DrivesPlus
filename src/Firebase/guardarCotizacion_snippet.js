import { db } from "./firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  serverTimestamp,
  setDoc
 
} from "firebase/firestore";

export const guardarCotizacion = async (datos) => {
  try {
    const cotRef = doc(db, "cotizaciones", datos.nroCotizacion);

    await setDoc(cotRef, {
      nroCotizacion:   datos.nroCotizacion,
      fecha:           datos.fecha,
      moneda:          datos.moneda,

      // Cliente
      empresa:         datos.empresa,
      contacto:        datos.contacto,
      email:           datos.email     || '',
      telefono:        datos.telefono  || '',
      ciudad:          datos.ciudad    || '',

      // Vinculación opcional a equipo
      serialEquipo:    datos.serialEquipo || null,

      // Ítems (array de objetos — sin el campo id interno)
      items: datos.items.map(({ id, ...rest }) => rest),

      // Totales
      subtotal:         datos.subtotal,
      descuentoGlobal:  datos.descuentoGlobal,
      descuentoMonto:   datos.descuentoMonto,
      totalFinal:       datos.totalFinal,

      // Condiciones comerciales
      garantia:         datos.garantia,
      formaPago:        datos.formaPago,
      validez:          datos.validez,
      tiempoEntrega:    datos.tiempoEntrega,
      impuestos:        datos.impuestos,
      observaciones:    datos.observaciones || '',

      // Estado inicial
      estado:           'Pendiente',  // Pendiente | Aprobada | Rechazada | Facturada

      // Auditoría
      fechaCreacion:    serverTimestamp(),
      ultimaActualizacion: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error al guardar cotización:", error);
    throw error;
  }
};

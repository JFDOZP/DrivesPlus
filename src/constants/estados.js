export const FLUJO_ESTADOS = {
  "Ingresado": "Diagnóstico",
  "Diagnóstico": "En espera aprobación",
  "En espera aprobación": "En reparación",
  "En reparación": "Listo para entrega",
  "Listo para entrega": "Entregado",
  "Devolución": "Entregado"
};

export const ESTADOS_DISPONIBLES = [
  "Ingresado",
  "Diagnóstico",
  "En espera aprobación",
  "En reparación",
  "Listo para entrega",
  "Entregado",
  "Devolución"
];
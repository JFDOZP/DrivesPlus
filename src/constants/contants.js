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

// Datos agrupados por familia
export const FAMILIAS = {
  "VLT®": [
    "VLT® AutomationDrive FC 301 / FC 302",
    "VLT® HVAC Drive FC 102",
    "VLT® AQUA Drive FC 202",
    "VLT® HVAC Basic Drive FC 101",
    "VLT® Micro Drive FC 51",
    "VLT® Refrigeration Drive FC 103",
    "VLT® Midi Drive FC 280",
    "VLT® Compact Starter MCD 201 and MCD 202",
    "VLT® Soft Starter MCD 600",
    "VLT® Soft Starter MCD 500",
  ],
  "iC7": [
    "iC7-Automation",
  ],
  "VACON®": [
    "VACON® NXP Air Cooled",
    "VACON® 100 FLOW",
    "VACON® 100 INDUSTRIAL",
    "VACON® 20",
  ],
  "iC2": [
    "iC2-Micro",
  ],
};

import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const usePDF = () => {
  const pdfRef    = useRef(null);
  const [generando, setGenerando] = useState(false);

  const generarPDF = async (nombreArchivo = 'cotizacion') => {
    const elemento = pdfRef.current;
    if (!elemento) return;

    setGenerando(true);
    try {
      const canvas = await html2canvas(elemento, {
        scale: 1.5,              // CAMBIO: era 2 — reduce peso ~44%
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth:  elemento.scrollWidth,
        windowHeight: elemento.scrollHeight,
      });

      // CAMBIO: JPEG en lugar de PNG — reduce peso 60-70% adicional
      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth  = pdf.internal.pageSize.getWidth();   // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight();  // 297mm

      const ratio = pdfWidth / canvas.width;
      const imgMM = canvas.height * ratio;

      // CAMBIO: umbral de 0.5mm para evitar página en blanco por decimales
      if (imgMM <= pdfHeight + 0.5) {
        // Contenido cabe en una página — forzar altura exacta A4
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(imgMM, pdfHeight));
      } else {
        // Múltiples páginas — solo si el contenido genuinamente desborda
        let yOffset = 0;
        while (yOffset < imgMM - 0.5) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, -yOffset, pdfWidth, imgMM);
          yOffset += pdfHeight;
        }
      }

      pdf.save(`${nombreArchivo}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Intenta de nuevo.');
    } finally {
      setGenerando(false);
    }
  };

  return { pdfRef, generarPDF, generando };
};
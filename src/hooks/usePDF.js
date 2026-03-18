import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Hook para generar un PDF a partir del componente CotizacionPDF.
 *
 * Uso:
 *   const { pdfRef, generarPDF, generando } = usePDF();
 *   <CotizacionPDF ref={pdfRef} cotizacion={datos} />
 *   <button onClick={() => generarPDF(nroCotizacion)}>Descargar PDF</button>
 */
export const usePDF = () => {
  const pdfRef    = useRef(null);
  const [generando, setGenerando] = useState(false);

  const generarPDF = async (nombreArchivo = 'cotizacion') => {
    const elemento = pdfRef.current;
    if (!elemento) return;

    setGenerando(true);
    try {
      // Capturar el componente como imagen de alta resolución
      const canvas = await html2canvas(elemento, {
        scale: 2,                // 2x para nitidez
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        // Forzar que el elemento esté completamente visible al capturar
        windowWidth:  elemento.scrollWidth,
        windowHeight: elemento.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');

      // Crear PDF tamaño A4
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth  = pdf.internal.pageSize.getWidth();   // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight();  // 297mm

      // Calcular alto proporcional de la imagen en mm
      const imgWidth  = canvas.width;
      const imgHeight = canvas.height;
      const ratio     = pdfWidth / imgWidth;
      const imgMM     = imgHeight * ratio;

      // Si el contenido cabe en una sola página
      if (imgMM <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgMM);
      } else {
        // Dividir en páginas si el contenido es muy largo
        let yOffset = 0;
        while (yOffset < imgMM) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfWidth, imgMM);
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

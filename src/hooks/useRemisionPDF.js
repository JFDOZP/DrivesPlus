import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Hook para generar el PDF de la remisión de recepción.
 * Mismo patrón que usePDF.js.
 *
 * Uso:
 *   const { remisionRef, generarRemision, generando } = useRemisionPDF();
 *   <RemisionRecepcionPDF ref={remisionRef} servicio={s} equipo={e} />
 *   <button onClick={() => generarRemision(`REM-${s.id.slice(-6)}`)}>Imprimir</button>
 */
export const useRemisionPDF = () => {
  const remisionRef          = useRef(null);
  const [generando, setGenerando] = useState(false);

  const generarRemision = async (nombreArchivo = 'remision') => {
    const elemento = remisionRef.current;
    if (!elemento) return;

    setGenerando(true);
    try {
      const canvas = await html2canvas(elemento, {
        scale:           3,
        useCORS:         true,
        backgroundColor: '#ffffff',
        logging:         false,
        windowWidth:     elemento.scrollWidth,
        windowHeight:    elemento.scrollHeight,
      });

      const imgData  = canvas.toDataURL('image/png');
      const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth  = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio     = pdfWidth / canvas.width;
      const imgMM     = canvas.height * ratio;

      if (imgMM <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgMM);
      } else {
        let yOffset = 0;
        while (yOffset < imgMM) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfWidth, imgMM);
          yOffset += pdfHeight;
        }
      }

      pdf.save(`${nombreArchivo}.pdf`);
    } catch (err) {
      console.error('Error al generar remisión:', err);
      alert('Error al generar el PDF. Intenta de nuevo.');
    } finally {
      setGenerando(false);
    }
  };

  return { remisionRef, generarRemision, generando };
};

import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Hook para generar el sticker como PNG descargable o PDF A4 con múltiples copias.
 *
 * Uso:
 *   const { stickerRef, descargarPNG, descargarPDF, generando } = useStickerPDF();
 *   <StickerEquipo ref={stickerRef} equipo={e} servicio={s} />
 *   <button onClick={descargarPNG}>PNG</button>
 *   <button onClick={() => descargarPDF(4)}>PDF 4 copias</button>
 */
export const useStickerPDF = () => {
  const stickerRef            = useRef(null);
  const [generando, setGenerando] = useState(false);

  const capturar = async () => {
    const el = stickerRef.current;
    if (!el) return null;
    return await html2canvas(el, {
      scale:           4,           // alta resolución para impresión
      useCORS:         true,
      backgroundColor: '#ffffff',
      logging:         false,
    });
  };

  // Descarga como PNG — ideal para enviar al cliente o imprimir directamente
  const descargarPNG = async (nombre = 'sticker') => {
    setGenerando(true);
    try {
      const canvas = await capturar();
      if (!canvas) return;
      const link    = document.createElement('a');
      link.download = `${nombre}.png`;
      link.href     = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error al generar sticker PNG:', err);
    } finally {
      setGenerando(false);
    }
  };

  /**
   * Descarga un PDF A4 con N copias del sticker distribuidas en la página.
   * Por defecto 8 copias (4 columnas × 2 filas) — útil para papel de etiquetas.
   * @param {number} copias - cantidad de copias en la página (4 u 8 recomendado)
   * @param {string} nombre - nombre del archivo
   */
  const descargarPDF = async (copias = 8, nombre = 'sticker') => {
    setGenerando(true);
    try {
      const canvas   = await capturar();
      if (!canvas) return;

      const imgData  = canvas.toDataURL('image/png');
      const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Dimensiones del sticker en mm (9cm × 5cm)
      const sW = 90;   // ancho sticker mm
      const sH = 50;   // alto sticker mm
      const margen  = 10;  // margen página mm
      const gapH    = 5;   // separación horizontal
      const gapV    = 5;   // separación vertical

      const cols = Math.floor((210 - 2 * margen + gapH) / (sW + gapH));  // 2 cols
      const rows = Math.floor((297 - 2 * margen + gapV) / (sH + gapV));  // 5 filas

      let copiasImpresas = 0;
      for (let r = 0; r < rows && copiasImpresas < copias; r++) {
        for (let c = 0; c < cols && copiasImpresas < copias; c++) {
          const x = margen + c * (sW + gapH);
          const y = margen + r * (sH + gapV);
          pdf.addImage(imgData, 'PNG', x, y, sW, sH);
          copiasImpresas++;
        }
      }

      pdf.save(`${nombre}.pdf`);
    } catch (err) {
      console.error('Error al generar sticker PDF:', err);
    } finally {
      setGenerando(false);
    }
  };

  return { stickerRef, descargarPNG, descargarPDF, generando };
};

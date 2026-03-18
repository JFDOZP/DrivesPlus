import { useMemo, useState } from 'react';
import styles from './EstadisticasRepuestos.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, moneda = 'COP') =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: moneda,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n ?? 0);

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// Fecha de inicio del rango: primer día del mes hace N meses
const inicioMesHace = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0,0,0,0);
  return d;
};

// ─── Barra horizontal simple ──────────────────────────────────────────────────
const BarraH = ({ label, valor, max, color, sublabel }) => {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0;
  return (
    <div className={styles.barraRow}>
      <span className={styles.barraLabel} title={label}>{label}</span>
      <div className={styles.barraTrack}>
        <div className={styles.barraFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.barraValor}>{valor}</span>
      {sublabel && <span className={styles.barraSub}>{sublabel}</span>}
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
const EstadisticasRepuestos = ({ cotizaciones }) => {

  // ── Rango de fechas ──
  const hoy       = new Date();
  const primerDia = (d) => { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; };

  const [fechaDesde, setFechaDesde] = useState(
    primerDia(inicioMesHace(5)).toISOString().split('T')[0]   // hace 6 meses
  );
  const [fechaHasta, setFechaHasta] = useState(
    hoy.toISOString().split('T')[0]
  );

  // ── Filtrar cotizaciones por rango ──
  const cotEnRango = useMemo(() => {
    const desde = new Date(fechaDesde).getTime();
    const hasta = new Date(fechaHasta + 'T23:59:59').getTime();
    return cotizaciones.filter(c => {
      const ms = c.fechaCreacionMs;
      return ms && ms >= desde && ms <= hasta;
    });
  }, [cotizaciones, fechaDesde, fechaHasta]);

  // ── Extraer todos los ítems con código (repuestos) del rango ──
  const items = useMemo(() => {
    return cotEnRango.flatMap(cot =>
      (cot.items ?? [])
        .filter(item => item.codigo && item.codigo.trim())
        .map(item => ({
          ...item,
          cotEstado:  cot.estado,
          cotMoneda:  cot.moneda ?? 'COP',
          cotFechaMs: cot.fechaCreacionMs,
          modelo:     cot.modelo ?? '',
        }))
    );
  }, [cotEnRango]);

  // ── Ranking de repuestos más cotizados ──
  const rankingCantidad = useMemo(() => {
    const map = {};
    items.forEach(item => {
      const key = item.codigo;
      if (!map[key]) map[key] = {
        codigo:      item.codigo,
        descripcion: item.descripcion,
        totalCant:   0,
        aprobados:   0,
        noAprobados: 0,
        totalCOP:    0,
      };
      const cant = item.cantidad ?? 1;
      map[key].totalCant += cant;
      if (item.cotEstado === 'Aprobada')    map[key].aprobados   += cant;
      if (item.cotEstado === 'No aprobada') map[key].noAprobados += cant;
      // Convertir a COP simple (USD/EUR sin TRM exacta)
      const precio = (item.precioUnit ?? 0) * (1 - (item.descuento ?? 0) / 100);
      map[key].totalCOP += precio * cant;
    });
    return Object.values(map).sort((a, b) => b.totalCant - a.totalCant);
  }, [items]);

  // ── Por modelo de equipo ──
  const porModelo = useMemo(() => {
    const map = {};
    items.forEach(item => {
      const modelo = item.modelo || 'Sin modelo';
      // Acortar el modelo para visualización
      const modeloCorto = modelo.length > 35 ? modelo.slice(0, 32) + '…' : modelo;
      if (!map[modeloCorto]) map[modeloCorto] = 0;
      map[modeloCorto] += item.cantidad ?? 1;
    });
    return Object.entries(map)
      .map(([modelo, cant]) => ({ modelo, cant }))
      .sort((a, b) => b.cant - a.cant)
      .slice(0, 10);
  }, [items]);

  // ── Evolución mensual ──
  const evolucionMensual = useMemo(() => {
    const map = {};
    items.forEach(item => {
      if (!item.cotFechaMs) return;
      const d   = new Date(item.cotFechaMs);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { label: `${MESES[d.getMonth()]} ${d.getFullYear()}`, total: 0, aprobados: 0 };
      map[key].total += item.cantidad ?? 1;
      if (item.cotEstado === 'Aprobada') map[key].aprobados += item.cantidad ?? 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [items]);

  // ── Totales generales ──
  const totales = useMemo(() => {
    const totalItems   = items.length;
    const aprobados    = items.filter(i => i.cotEstado === 'Aprobada').length;
    const noAprobados  = items.filter(i => i.cotEstado === 'No aprobada').length;
    const enEspera     = items.filter(i => i.cotEstado === 'En espera').length;
    const totalCantidad = items.reduce((s, i) => s + (i.cantidad ?? 1), 0);
    return { totalItems, aprobados, noAprobados, enEspera, totalCantidad };
  }, [items]);

  const maxCantidad = rankingCantidad[0]?.totalCant ?? 1;
  const maxModelo   = porModelo[0]?.cant ?? 1;
  const maxMensual  = Math.max(...evolucionMensual.map(m => m.total), 1);

  return (
    <div className={styles.page}>

      {/* ── Filtro de fechas ── */}
      <div className={styles.filtroFechas}>
        <span className={styles.filtroLabel}>Período:</span>
        <input type="date" value={fechaDesde}
          onChange={e => setFechaDesde(e.target.value)}
          className={styles.inputFecha} />
        <span className={styles.filtroSep}>—</span>
        <input type="date" value={fechaHasta}
          onChange={e => setFechaHasta(e.target.value)}
          className={styles.inputFecha} />
        <span className={styles.filtroCotizaciones}>
          {cotEnRango.length} cotizaciones · {totales.totalCantidad} ítems
        </span>
      </div>

      {totales.totalItems === 0 ? (
        <div className={styles.empty}>
          Sin repuestos cotizados en el período seleccionado.
        </div>
      ) : (
        <div className={styles.grid}>

          {/* ── INDICADORES ── */}
          <div className={`${styles.card} ${styles.cardFullRow}`}>
            <div className={styles.indicadores}>
              {[
                { label: 'Ítems cotizados', valor: totales.totalCantidad, color: '#1A1A1A' },
                { label: 'Aprobados',        valor: totales.aprobados,    color: '#166534' },
                { label: 'No aprobados',     valor: totales.noAprobados,  color: '#991b1b' },
                { label: 'En espera',        valor: totales.enEspera,     color: '#b45309' },
                { label: 'Refs únicas',      valor: rankingCantidad.length, color: '#1e40af' },
              ].map(({ label, valor, color }) => (
                <div key={label} className={styles.indicadorItem}>
                  <span className={styles.indicadorValor} style={{ color }}>{valor}</span>
                  <span className={styles.indicadorLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RANKING REPUESTOS ── */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Repuestos más cotizados</h3>
            <div className={styles.ranking}>
              {rankingCantidad.slice(0, 15).map((r, i) => (
                <div key={r.codigo} className={styles.rankingItem}>
                  <div className={styles.rankingTop}>
                    <span className={styles.rankingPos}>#{i + 1}</span>
                    <span className={styles.rankingCod}>{r.codigo}</span>
                    <div className={styles.rankingBadges}>
                      {r.aprobados > 0 && (
                        <span className={styles.badgeAprobado}>✓ {r.aprobados}</span>
                      )}
                      {r.noAprobados > 0 && (
                        <span className={styles.badgeNoAprobado}>✗ {r.noAprobados}</span>
                      )}
                    </div>
                  </div>
                  <p className={styles.rankingDesc}>{r.descripcion}</p>
                  <BarraH
                    label=""
                    valor={r.totalCant}
                    max={maxCantidad}
                    color="#DB0100"
                    sublabel={r.totalCOP > 0 ? fmt(r.totalCOP) : null}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── POR MODELO ── */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Por modelo de equipo</h3>
            <div className={styles.barras}>
              {porModelo.map(({ modelo, cant }) => (
                <BarraH
                  key={modelo}
                  label={modelo}
                  valor={cant}
                  max={maxModelo}
                  color="#1e40af"
                />
              ))}
              {porModelo.length === 0 && (
                <p className={styles.sinDatos}>Sin datos de modelo en este período.</p>
              )}
            </div>
          </div>

          {/* ── EVOLUCIÓN MENSUAL ── */}
          <div className={`${styles.card} ${styles.cardFullRow}`}>
            <h3 className={styles.cardTitle}>Evolución mensual</h3>
            {evolucionMensual.length === 0 ? (
              <p className={styles.sinDatos}>Sin datos en el período.</p>
            ) : (
              <div className={styles.mensualGrid}>
                {evolucionMensual.map(mes => {
                  const pctTotal    = Math.round((mes.total    / maxMensual) * 100);
                  const pctAprobado = Math.round((mes.aprobados / maxMensual) * 100);
                  return (
                    <div key={mes.label} className={styles.mesCol}>
                      <div className={styles.mesBarras}>
                        <div className={styles.mesBarraWrap} title={`Total: ${mes.total}`}>
                          <div className={styles.mesBarraBg}>
                            <div className={styles.mesBarraTotal}
                              style={{ height: `${pctTotal}%` }} />
                            <div className={styles.mesBarraAprobado}
                              style={{ height: `${pctAprobado}%` }} />
                          </div>
                        </div>
                      </div>
                      <span className={styles.mesValor}>{mes.total}</span>
                      <span className={styles.mesLabel}>{mes.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className={styles.leyenda}>
              <span className={styles.leyendaItem}>
                <span className={styles.leyendaDot} style={{ background: '#e2e8f0' }} />
                Total cotizado
              </span>
              <span className={styles.leyendaItem}>
                <span className={styles.leyendaDot} style={{ background: '#166534' }} />
                Aprobado
              </span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default EstadisticasRepuestos;

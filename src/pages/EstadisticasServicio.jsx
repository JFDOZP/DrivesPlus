import { useMemo, useState } from 'react';
import styles from './EstadisticasServicio.module.css';

const fmt = (n) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n ?? 0);

const inicioMesHace = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── Barra horizontal ─────────────────────────────────────────────────────────
const BarraH = ({ label, valor, max, color, sublabel }) => {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0;
  return (
    <div className={styles.barraRow}>
      <span className={styles.barraLabel} title={label}>{label}</span>
      <div className={styles.barraTrack}>
        <div className={styles.barraFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className={styles.barraRight}>
        <span className={styles.barraValor}>{valor}</span>
        {sublabel && <span className={styles.barraSub}>{sublabel}</span>}
      </div>
    </div>
  );
};

// ─── Bloque KPI compacto ──────────────────────────────────────────────────────
const KPIStrip = ({ items, label, color }) => {
  const stats = useMemo(() => {
    const total      = items.reduce((s, i) => s + (i.cantidad ?? 1), 0);
    const aprobados  = items.filter(i => i.cotEstado === 'Aprobada').reduce((s, i) => s + (i.cantidad ?? 1), 0);
    const noAprobados= items.filter(i => i.cotEstado === 'No aprobada').reduce((s, i) => s + (i.cantidad ?? 1), 0);
    const enEspera   = items.filter(i => i.cotEstado === 'En espera').reduce((s, i) => s + (i.cantidad ?? 1), 0);
    const refs       = new Set(items.map(i => (i.codigo || i.descripcion)?.slice(0, 60))).size;
    return { total, aprobados, noAprobados, enEspera, refs };
  }, [items]);

  return (
    <div className={styles.kpiStrip}>
      <div className={styles.kpiStripTitle} style={{ borderLeftColor: color }}>
        {label}
      </div>
      <div className={styles.kpiStripNums}>
        {[
          { l: 'Total',        v: stats.total,       c: color },
          { l: 'Aprobados',    v: stats.aprobados,   c: '#166534' },
          { l: 'En espera',    v: stats.enEspera,    c: '#b45309' },
          { l: 'No aprobados', v: stats.noAprobados, c: '#991b1b' },
          { l: 'Refs únicas',  v: stats.refs,        c: '#6b7280' },
        ].map(({ l, v, c }) => (
          <div key={l} className={styles.kpiNum}>
            <span className={styles.kpiVal} style={{ color: c }}>{v}</span>
            <span className={styles.kpiLbl}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Ranking compacto ─────────────────────────────────────────────────────────
const RankingPanel = ({ items, color, agruparPor, titulo }) => {
  const ranking = useMemo(() => {
    const map = {};
    items.forEach(item => {
      const key = agruparPor === 'codigo'
        ? (item.codigo?.trim() || item.descripcion?.slice(0, 40) || '—')
        : (item.descripcion?.slice(0, 60) || '—');
      if (!map[key]) map[key] = {
        codigo: item.codigo || '—',
        descripcion: item.descripcion || '—',
        totalCant: 0, aprobados: 0, noAprobados: 0, totalVal: 0,
      };
      const cant   = item.cantidad ?? 1;
      const precio = (item.precioUnit ?? 0) * (1 - (item.descuento ?? 0) / 100);
      map[key].totalCant   += cant;
      map[key].totalVal    += precio * cant;
      if (item.cotEstado === 'Aprobada')    map[key].aprobados   += cant;
      if (item.cotEstado === 'No aprobada') map[key].noAprobados += cant;
    });
    return Object.values(map).sort((a, b) => b.totalCant - a.totalCant);
  }, [items, agruparPor]);

  const maxCant = ranking[0]?.totalCant ?? 1;

  if (items.length === 0) return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardAccent} style={{ background: color }} />
        <h3 className={styles.cardTitle}>{titulo}</h3>
      </div>
      <p className={styles.sinDatos}>Sin datos en el período seleccionado.</p>
    </div>
  );

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardAccent} style={{ background: color }} />
        <h3 className={styles.cardTitle}>{titulo}</h3>
        <span className={styles.cardCount}>{ranking.length} refs</span>
      </div>
      <div className={styles.ranking}>
        {ranking.slice(0, 10).map((r, i) => (
          <div key={r.descripcion + i} className={styles.rankingItem}>
            <div className={styles.rankingMeta}>
              <span className={styles.rankingPos}>#{i + 1}</span>
              {agruparPor === 'codigo' && r.codigo !== '—' && (
                <span className={styles.rankingCod}>{r.codigo}</span>
              )}
              <div className={styles.rankingBadges}>
                {r.aprobados > 0 && (
                  <span className={styles.badgeOk}>✓{r.aprobados}</span>
                )}
                {r.noAprobados > 0 && (
                  <span className={styles.badgeNo}>✗{r.noAprobados}</span>
                )}
              </div>
            </div>
            <p className={styles.rankingDesc}>{r.descripcion}</p>
            <BarraH
              label=""
              valor={r.totalCant}
              max={maxCant}
              color={color}
              sublabel={r.totalVal > 0 ? fmt(r.totalVal) : null}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
const EstadisticasServicio = ({ cotizaciones }) => {
  const hoy = new Date();
  const primerDia = (d) => { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; };

  const [fechaDesde, setFechaDesde] = useState(
    primerDia(inicioMesHace(5)).toISOString().split('T')[0]
  );
  const [fechaHasta, setFechaHasta] = useState(hoy.toISOString().split('T')[0]);

  const cotEnRango = useMemo(() => {
    const desde = new Date(fechaDesde).getTime();
    const hasta = new Date(fechaHasta + 'T23:59:59').getTime();
    return cotizaciones.filter(c => {
      const ms = c.fechaCreacionMs;
      return ms && ms >= desde && ms <= hasta;
    });
  }, [cotizaciones, fechaDesde, fechaHasta]);

  const todosItems = useMemo(() =>
    cotEnRango.flatMap(cot =>
      (cot.items ?? []).map(item => ({
        ...item,
        cotEstado:  cot.estado,
        cotFechaMs: cot.fechaCreacionMs,
      }))
    ), [cotEnRango]);

  const itemsServicios = useMemo(() =>
    todosItems.filter(i => i.tipo === 'servicio'), [todosItems]);

  const itemsRepuestos = useMemo(() =>
    todosItems.filter(i => i.tipo === 'repuesto'), [todosItems]);

  const sinDatos = todosItems.length === 0;

  return (
    <div className={styles.page}>

      {/* ── Filtro ── */}
      <div className={styles.filtro}>
        <span className={styles.filtroLabel}>Período</span>
        <div className={styles.filtroInputs}>
          <input type="date" value={fechaDesde}
            onChange={e => setFechaDesde(e.target.value)}
            className={styles.inputFecha} />
          <span className={styles.filtroSep}>—</span>
          <input type="date" value={fechaHasta}
            onChange={e => setFechaHasta(e.target.value)}
            className={styles.inputFecha} />
        </div>
        <span className={styles.filtroResumen}>
          {cotEnRango.length} cotizaciones · {itemsServicios.length} servicios · {itemsRepuestos.length} repuestos
        </span>
      </div>

      {sinDatos ? (
        <div className={styles.empty}>Sin ítems cotizados en el período seleccionado.</div>
      ) : (
        <>
          {/* ── KPIs lado a lado ── */}
          <div className={styles.kpiGrid}>
            <KPIStrip items={itemsServicios} label="Servicios" color="#1e40af" />
            <KPIStrip items={itemsRepuestos} label="Repuestos" color="#DB0100" />
          </div>

          {/* ── Rankings lado a lado ── */}
          <div className={styles.rankingGrid}>
            <RankingPanel
              items={itemsServicios}
              color="#1e40af"
              agruparPor="descripcion"
              titulo="Servicios más cotizados"
            />
            <RankingPanel
              items={itemsRepuestos}
              color="#DB0100"
              agruparPor="codigo"
              titulo="Repuestos más cotizados"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default EstadisticasServicio;
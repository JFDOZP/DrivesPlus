import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";
import { useAuth } from '../context/AuthContext';

/* Iconos inline SVG — sin dependencias extra */
const icons = {
  inicio: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.75L12 3l9 6.75V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  equipos: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  inventario: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8V6a2 2 0 00-2-2H5a2 2 0 00-2 2v2" />
      <rect x="3" y="8" width="18" height="13" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  ),
  cotizaciones: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </svg>
  ),
  reportes: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  ),
  // Icono salir — puerta con flecha
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

const navItems = [
  { to: "/",             label: "Inicio",       index: "01", icon: icons.inicio       },
  { to: "/equipos",      label: "Equipos",      index: "02", icon: icons.equipos      },
  { to: "/inventario",   label: "Inventario",   index: "03", icon: icons.inventario   },
  { to: "/cotizaciones", label: "Cotizaciones", index: "04", icon: icons.cotizaciones },
  { to: "/reportes",     label: "Reportes",     index: "05", icon: icons.reportes     },
];

function Navbar() {
  const { logout, userProfile, currentUser } = useAuth();

  // Mostrar nombre del perfil o la parte antes del @ del email como fallback
  const nombreMostrar = userProfile?.nombre
    || currentUser?.email?.split('@')[0]
    || 'Usuario';

  return (
    <nav className={styles.navbar}>

      {/* Logo + usuario — visible solo en desktop */}
      <div className={styles.logo}>
        <img src="/logo.png" alt="Logo DrivesPlus" />
        <div className={styles.userBloque}>
          <span className={styles.userLabel}>Usuario activo</span>
          <span className={styles.userName}>{nombreMostrar}</span>
        </div>
      </div>

      {/* Links de navegación */}
      <div className={styles.links}>
        {navItems.map(({ to, label, index, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ""}`
            }
          >
            {icon}
            <span className={styles.index}>{index}</span>
            {label}
          </NavLink>
        ))}
      </div>

      {/* Pie: status + logout */}
      <div className={styles.pie}>
        <span className={styles.statusDot}>SISTEMA ACTIVO</span>
        <button className={styles.btnLogout} onClick={logout}>
          {icons.logout}
          Cerrar sesión
        </button>
      </div>

    </nav>
  );
}

export default Navbar;
import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";

function Navbar() {
  return (
    <nav className={styles.navbar}>
      
      <NavLink to="/" className={({isActive}) => isActive ? styles.active : ""}>
        Inicio
      </NavLink>

      <NavLink to="/reportes" className={({isActive}) => isActive ? styles.active : ""}>
        Reportes
      </NavLink>

      <NavLink to="/configuracion" className={({isActive}) => isActive ? styles.active : ""}>
        Configuración
      </NavLink>

    </nav>
  );
}

export default Navbar;
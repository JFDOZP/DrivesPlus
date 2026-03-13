import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import styles from "./MainLayout.module.css";

const MainLayout = () => {
  return (
    <div className={styles.layoutContainer}>
      
      <main className={styles.content}>
        <Outlet />
      </main>

      <Navbar />

    </div>
  );
};

export default MainLayout;
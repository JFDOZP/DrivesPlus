import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import styles from "./MainLayout.module.css";

const MainLayout = () => {
  return (
    <div className={styles.layoutContainer}>
      
       <Navbar />
       
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
import styles from './Dashboard.module.css';

const Dashboard = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Panel de Control</h1>
      
      <div className={styles.statsGrid}>
        <div className={styles.card}>
          <h3>Total Equipos</h3>
          <p className={styles.number}>124</p>
        </div>
        <div className={styles.card}>
          <h3>Servicios Hoy</h3>
          <p className={styles.number}>12</p>
        </div>
        <div className={styles.card}>
          <h3>Alertas</h3>
          <p className={styles.number} style={{color: '#e53e3e'}}>3</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
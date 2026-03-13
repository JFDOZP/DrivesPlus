import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
// --- IMPORTACIÓN REAL ---
import Dashboard from './pages/Dashboard'; 
import Home from "./pages/Inventario";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Equipos";

function App() {
  return (
    <Routes>

  <Route path="/" element={<MainLayout />}>

    <Route index element={<Dashboard />} />

    <Route path='Home' element={<Home />} />


    <Route path="reportes" element={<Reportes />} />

    <Route path="configuracion" element={<Configuracion />} />

  </Route>

</Routes>
  );
}

export default App;
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Reportes from './pages/Reportes';
import Cotizaciones from './pages/Cotizaciones';
import Equipos from './pages/Equipos';
import Inventario from './pages/Inventario';
import CotizacionPDF from './pages/CotizacionPDF';
import CotizacionPDFPreview from './pages/CotizacionPDFPreview';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ListaCotizaciones from './pages/ListaCotizaciones';
import DetalleCotizacion from './pages/DetalleCotizacion';





function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas — requieren sesión */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index                       element={<Dashboard />} />
          <Route path="equipos"              element={<Equipos />} />
          <Route path="inventario"           element={<Inventario />} />

          {/* Módulo cotizaciones */}
          <Route path="cotizaciones"         element={<ListaCotizaciones />} />
          <Route path="cotizaciones/nueva"   element={<Cotizaciones />} />
          <Route path="cotizaciones/:id"     element={<DetalleCotizacion />} />

          <Route path="reportes"             element={<Reportes />} />
        </Route>

      </Routes>
    </AuthProvider>
  );
}

export default App;

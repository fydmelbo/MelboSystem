import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './features/auth/pages/LoginPage';
import Welcome from './pages/Welcome';
import ProductsPage from './features/products/pages/ProductsPage';
import UbicacionesPage from './features/products/pages/UbicacionesPage';
import SalesPage from './features/sales/pages/SalesPage';
import ReportsPage from './features/reports/pages/ReportsPage';
import AdminPanel from './features/stats/pages/AdminPanel';
import React from 'react';
import HistoricoPage from './features/products/pages/HistoricoPage';
import UbicacionDetailPage from './features/products/pages/UbicacionDetailPage';
import { TransferView } from './features/products/components/TransferView';
import PromotionsPage from './features/promotions/pages/PromotionsPage';
import { AuthProvider } from './features/auth/context/AuthContext';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import UsersPage from './features/users/pages/UsersPage';
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="bottom-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/welcome" element={
            <ProtectedRoute>
              <Welcome />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute allowedRoles={['admin', 'admin_ubicacion', 'employee']}>
              <ProductsPage />
            </ProtectedRoute>
          } />
          <Route path="/ubicaciones" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UbicacionesPage />
            </ProtectedRoute>
          } />
          <Route path="/ubicaciones/:id" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UbicacionDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/sales" element={
            <ProtectedRoute allowedRoles={['admin', 'admin_ubicacion', 'employee']} requireLocation={true}>
              <SalesPage />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['admin', 'admin_ubicacion', 'employee']} requireLocation={true}>
              <ReportsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'admin_ubicacion']}>
              <AdminPanel />
            </ProtectedRoute>
          } />
          <Route path="/products/historico" element={
            <ProtectedRoute allowedRoles={['admin', 'admin_ubicacion']}>
              <HistoricoPage />
            </ProtectedRoute>
          } />
          <Route path="/transfer" element={
            <ProtectedRoute allowedRoles={['admin', 'admin_ubicacion']}>
              <TransferView />
            </ProtectedRoute>
          } />
          <Route path="/promotions" element={
            <ProtectedRoute allowedRoles={['admin', 'admin_ubicacion', 'employee']} requireLocation={true}>
              <PromotionsPage />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['admin', 'admin_ubicacion']}>
              <UsersPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
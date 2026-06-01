import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireLocation?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  requireLocation = false 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Si se requiere ubicación y el usuario no es admin y no tiene ubicación asignada
  if (requireLocation && user.role !== 'admin' && !user.ubicacion) {
    return <Navigate to="/welcome" replace />;
  }

  // Si hay roles permitidos especificados y el rol del usuario no está incluido
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}
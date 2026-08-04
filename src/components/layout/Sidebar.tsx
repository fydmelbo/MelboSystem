import { Home, Pill, Users, ShoppingCart, FileText, LayoutDashboard, History, Truck, Pin, MapPin, AlertTriangle } from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';

interface SidebarProps {
  onClose?: () => void;
}

const getMenuItems = (role: string) => [
  // Inicio - solo para admin
  ...(role === 'admin' ? [{
    icon: Home,
    label: 'Inicio',
    path: '/welcome',
    color: 'text-purple-500'
  }] : []),
  // Productos - para todos
  {
    icon: Pill,
    label: 'Productos',
    path: '/products',
    color: 'text-emerald-500'
  },
  // Histórico - para admin y admin_ubicacion
  ...((role === 'admin' || role === 'admin_ubicacion') ? [{
    icon: History,
    label: 'Histórico',
    path: '/products/historico',
    color: 'text-amber-500'
  }] : []),
  // Revisión - para admin y admin_ubicacion
  ...((role === 'admin' || role === 'admin_ubicacion') ? [{
    icon: AlertTriangle,
    label: 'Revisión de Importación',
    path: '/products/review',
    color: 'text-rose-500'
  }] : []),
  // Usuarios - para todos
  {
    icon: Users,
    label: 'Usuarios',
    path: '/users',
    color: 'text-rose-500'
  },
  // Ventas - para admin, admin_ubicacion y employee
  ...((role === 'admin' || role === 'admin_ubicacion' || role === 'employee') ? [{
    icon: ShoppingCart,
    label: 'Ventas',
    path: '/sales',
    color: 'text-cyan-500'
  }] : []),
  // Promociones
  ...((role === 'admin' || role === 'admin_ubicacion' || role === 'employee') ? [{
    icon: Pin,
    label: 'Promociones',
    path: '/promotions',
    color: 'text-blue-500'
  }] : []),
  // Reportes
  ...((role === 'admin' || role === 'admin_ubicacion' || role === 'employee') ? [{
    icon: FileText,
    label: 'Reportes',
    path: '/reports',
    color: 'text-indigo-500'
  }] : []),
  // Ubicaciones
  ...(role === 'admin' ? [{
    icon: MapPin,
    label: 'Ubicaciones',
    path: '/ubicaciones',
    color: 'text-green-500'
  }] : []),
  // Auditoria
  ...(role === 'admin' ? [{
    icon: FileText,
    label: 'Auditoría',
    path: '/auditoria',
    color: 'text-blue-500'
  }] : []),
  // Transferencia
  ...((role === 'admin' || role === 'admin_ubicacion') ? [{
    icon: Truck,
    label: 'Transferencia',
    path: '/transfer',
    color: 'text-red-500'
  }] : []),
  // Panel Admin
  ...((role === 'admin' || role === 'admin_ubicacion') ? [{
    icon: LayoutDashboard,
    label: 'Panel Admin',
    path: '/admin',
    color: 'text-orange-500'
  }] : [])
];

export default function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const menuItems = getMenuItems(user?.role || '');

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200">
      <nav className="space-y-1 p-4">
        {menuItems.filter(Boolean).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={onClose}
            >
              <item.icon className={`h-5 w-5 ${isActive ? item.color : 'text-gray-500'}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
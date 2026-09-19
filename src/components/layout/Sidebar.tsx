import {
  Home, Pill, Users, ShoppingCart, FileText, LayoutDashboard,
  History, Truck, Pin, MapPin, AlertTriangle,
  LayoutGrid, BarChart3, Settings, Package
} from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import CollapsibleSection from '../ui/CollapsibleSection';

interface SidebarProps {
  onClose?: () => void;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  color: string;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.role || '';

  const isActive = (path: string) => location.pathname === path;
  const isSectionActive = (paths: string[]) => paths.some(p => location.pathname.startsWith(p));

  const renderItem = (item: MenuItem) => {
    const active = isActive(item.path);
    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
          active
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
        onClick={onClose}
      >
        <item.icon className={`h-4 w-4 ${active ? item.color : 'text-gray-400'}`} />
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  };

  // Definir items por sección
  const generalItems: MenuItem[] = [
    ...(role === 'admin' ? [{ icon: Home, label: 'Inicio', path: '/welcome', color: 'text-purple-500' }] : []),
    { icon: Pill, label: 'Productos', path: '/products', color: 'text-emerald-500' },
    ...((role === 'admin' || role === 'admin_ubicacion') ? [{ icon: History, label: 'Histórico', path: '/products/historico', color: 'text-amber-500' }] : []),
  ];

  const operacionesItems: MenuItem[] = [
    ...((role === 'admin' || role === 'admin_ubicacion' || role === 'employee') ? [{ icon: ShoppingCart, label: 'Ventas', path: '/sales', color: 'text-cyan-500' }] : []),
    ...((role === 'admin' || role === 'admin_ubicacion') ? [{ icon: Package, label: 'Compras', path: '/purchases', color: 'text-teal-500' }] : []),
    ...((role === 'admin' || role === 'admin_ubicacion' || role === 'employee') ? [{ icon: Pin, label: 'Promociones', path: '/promotions', color: 'text-blue-500' }] : []),
    ...((role === 'admin' || role === 'admin_ubicacion') ? [{ icon: Truck, label: 'Transferencia', path: '/transfer', color: 'text-red-500' }] : []),
  ];

  const reportesItems: MenuItem[] = [
    ...((role === 'admin' || role === 'admin_ubicacion' || role === 'employee') ? [{ icon: FileText, label: 'Reportes', path: '/reports', color: 'text-indigo-500' }] : []),
    ...(role === 'admin' ? [{ icon: FileText, label: 'Auditoría', path: '/auditoria', color: 'text-blue-500' }] : []),
  ];

  const adminItems: MenuItem[] = [
    ...((role === 'admin' || role === 'admin_ubicacion') ? [{ icon: LayoutDashboard, label: 'Panel Admin', path: '/admin', color: 'text-orange-500' }] : []),
    // Usuarios vs Perfil según rol
    ...(role === 'admin' ? [{ icon: Users, label: 'Usuarios', path: '/users', color: 'text-rose-500' }] : []),
    ...(role === 'admin_ubicacion' ? [
      { icon: Users, label: 'Usuarios', path: '/users', color: 'text-rose-500' },
    ] : []),
    // Ubicaciones
    ...(role === 'admin' ? [{ icon: MapPin, label: 'Ubicaciones', path: '/ubicaciones', color: 'text-green-500' }] : []),
    // Revisión
    ...((role === 'admin' || role === 'admin_ubicacion') ? [{ icon: AlertTriangle, label: 'Revisión Importación', path: '/products/review', color: 'text-rose-500' }] : []),
  ];

  const generalPaths = generalItems.map(i => i.path);
  const operacionesPaths = operacionesItems.map(i => i.path);
  const reportesPaths = reportesItems.map(i => i.path);
  const adminPaths = adminItems.map(i => i.path);

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-3">
        {generalItems.length > 0 && (
          <CollapsibleSection title="General" icon={LayoutGrid} defaultOpen={isSectionActive(generalPaths)}>
            {generalItems.map(item => renderItem(item))}
          </CollapsibleSection>
        )}

        {operacionesItems.length > 0 && (
          <CollapsibleSection title="Operaciones" icon={ShoppingCart} defaultOpen={isSectionActive(operacionesPaths)}>
            {operacionesItems.map(item => renderItem(item))}
          </CollapsibleSection>
        )}

        {reportesItems.length > 0 && (
          <CollapsibleSection title="Reportes" icon={BarChart3} defaultOpen={isSectionActive(reportesPaths)}>
            {reportesItems.map(item => renderItem(item))}
          </CollapsibleSection>
        )}

        {adminItems.length > 0 && (
          <CollapsibleSection title="Administración" icon={Settings} defaultOpen={isSectionActive(adminPaths)}>
            {adminItems.map(item => renderItem(item))}
          </CollapsibleSection>
        )}
      </nav>
    </div>
  );
}

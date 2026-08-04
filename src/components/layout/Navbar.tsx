import { User, LogOut, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../features/auth/context/AuthContext';
import React from 'react';
import Logo from '../../img/LOGO (1).png';
import NotificationPanel from './NotificationPanel';
import { ubicacionesAPI } from '../../lib/api';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [ubicaciones, setUbicaciones] = useState<Array<{ _id: string; nombre: string }>>([]);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  useEffect(() => {
    if (isAdmin) {
      ubicacionesAPI.getUbicaciones().then(setUbicaciones).catch(() => {});
    }
  }, [isAdmin]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <img src={Logo} alt="MelboLogo" className="h-10" />
          </div>
          
          <div className="flex items-center gap-6">
            <NotificationPanel
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              ubicaciones={ubicaciones}
              isAdmin={isAdmin}
            />

            {/* Usuario */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name || user?.email || 'Usuario'}</p>
                    <p className="text-sm text-blue-600 capitalize">{user?.role || 'usuario'}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

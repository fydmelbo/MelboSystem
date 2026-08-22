import { useState, useEffect } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import { useAuth } from '../../auth/context/AuthContext';
import { toast } from 'react-hot-toast';
import { User, Mail, MapPin, Shield, Save, Loader2 } from 'lucide-react';
import { ubicacionesAPI } from '../../../lib/api';
import userService from '../services/userService';

export default function ProfilePage() {
  const { user, updateUser: updateAuthUser } = useAuth();
  const [name, setName] = useState('');
  const [ubicacionNombre, setUbicacionNombre] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      if (user.ubicacion) {
        ubicacionesAPI.getUbicaciones().then(ubicaciones => {
          const ub = ubicaciones.find(u => u._id === user.ubicacion);
          setUbicacionNombre(ub?.nombre || user.ubicacion || '');
        }).catch(() => {
          setUbicacionNombre(user.ubicacion || '');
        });
      }
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setIsSaving(true);
    try {
      await userService.updateUser(user!.uid, { name: name.trim() });
      updateAuthUser({ name: name.trim() });
      localStorage.setItem('userName', name.trim());
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'admin_ubicacion': return 'Admin de Ubicación';
      case 'employee': return 'Empleado';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'admin_ubicacion': return 'bg-blue-100 text-blue-700';
      case 'employee': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!user) return null;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Mi Perfil</h1>
                <p className="text-primary-100 text-sm">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Nombre */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 text-gray-400" />
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                placeholder="Ingrese su nombre"
              />
            </div>

            {/* Email (solo lectura) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 text-gray-400" />
                Correo electrónico
              </label>
              <input
                type="email"
                value={user.email}
                readOnly
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-400">El correo no se puede modificar</p>
            </div>

            {/* Rol (solo lectura) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Shield className="h-4 w-4 text-gray-400" />
                Rol
              </label>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">El rol solo puede ser modificado por un administrador</p>
            </div>

            {/* Ubicación (solo lectura) */}
            {user.ubicacion && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  Ubicación
                </label>
                <input
                  type="text"
                  value={ubicacionNombre}
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-400">La ubicación solo puede ser modificada por un administrador</p>
              </div>
            )}

            {/* Botón guardar */}
            <div className="pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
